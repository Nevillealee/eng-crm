import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";
import { recordAdminAudit } from "../../../../lib/admin-audit";
import {
  buildTaskVisibilityWhere,
  isProjectMember,
  parseDateInput,
  parseOptionalId,
  parseTaskApprovalStatus,
  parseTaskCompletedValue,
  parseTaskName,
  parseTaskNotes,
  taskInclude,
  taskProjectSummarySelect,
  taskProjectAccessInclude,
  toTaskDto,
  userDisplayName,
} from "../shared";

function dateToIso(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildTaskChanges(previousTask, updatedTask) {
  const changes = {};

  if (previousTask.projectId !== updatedTask.projectId) {
    changes.projectId = {
      before: previousTask.projectId,
      after: updatedTask.projectId,
    };
  }

  if (previousTask.name !== updatedTask.name) {
    changes.name = {
      before: previousTask.name,
      after: updatedTask.name,
    };
  }

  if (previousTask.assigneeId !== updatedTask.assigneeId) {
    changes.assigneeId = {
      before: previousTask.assigneeId,
      after: updatedTask.assigneeId,
    };
  }

  if (previousTask.approvalStatus !== updatedTask.approvalStatus) {
    changes.approvalStatus = {
      before: previousTask.approvalStatus,
      after: updatedTask.approvalStatus,
    };
  }

  if (Boolean(previousTask.completed) !== Boolean(updatedTask.completed)) {
    changes.completed = {
      before: Boolean(previousTask.completed),
      after: Boolean(updatedTask.completed),
      completedAt: {
        before: dateToIso(previousTask.completedAt),
        after: dateToIso(updatedTask.completedAt),
      },
      completedBy: {
        before: previousTask.completedById || null,
        after: updatedTask.completedById || null,
      },
    };
  }

  if (dateToIso(previousTask.dueOn) !== dateToIso(updatedTask.dueOn)) {
    changes.dueOn = {
      before: dateToIso(previousTask.dueOn),
      after: dateToIso(updatedTask.dueOn),
    };
  }

  if ((previousTask.notes || "") !== (updatedTask.notes || "")) {
    changes.notes = {
      before: previousTask.notes || "",
      after: updatedTask.notes || "",
    };
  }

  if ((previousTask.parentTaskId || null) !== (updatedTask.parentTaskId || null)) {
    changes.parentTaskId = {
      before: previousTask.parentTaskId || null,
      after: updatedTask.parentTaskId || null,
    };
  }

  return changes;
}

async function recordTaskUpdateAudits({ session, previousTask, updatedTask, changes }) {
  const changedKeys = Object.keys(changes);
  if (changedKeys.length === 0) {
    return;
  }

  const sharedMetadata = {
    taskId: updatedTask.id,
    taskName: updatedTask.name,
    projectId: updatedTask.projectId,
    projectName: updatedTask.project?.name || "",
    changes,
  };
  const entries = [];

  if (changes.assigneeId) {
    entries.push({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "task.assigned",
      targetType: "task",
      targetId: updatedTask.id,
      summary: `Assigned task ${updatedTask.name} to ${
        userDisplayName(updatedTask.assignee) || updatedTask.assigneeId
      }.`,
      metadata: sharedMetadata,
    });
  }

  if (changes.completed) {
    entries.push({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "task.completed",
      targetType: "task",
      targetId: updatedTask.id,
      summary: `${updatedTask.completed ? "Completed" : "Reopened"} task ${updatedTask.name}.`,
      metadata: sharedMetadata,
    });
  }

  if (changes.approvalStatus?.after === "approved") {
    entries.push({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "task.approved",
      targetType: "task",
      targetId: updatedTask.id,
      summary: `Approved task ${updatedTask.name}.`,
      metadata: sharedMetadata,
    });
  }

  if (changes.approvalStatus?.after === "rejected") {
    entries.push({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "task.rejected",
      targetType: "task",
      targetId: updatedTask.id,
      summary: `Rejected task ${updatedTask.name}.`,
      metadata: sharedMetadata,
    });
  }

  const hasGenericChanges = changedKeys.some((key) =>
    ["projectId", "name", "dueOn", "notes", "parentTaskId"].includes(key)
  );
  const approvalResetToPending = changes.approvalStatus?.after === "pending";

  if (hasGenericChanges || approvalResetToPending || entries.length === 0) {
    entries.push({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "task.updated",
      targetType: "task",
      targetId: updatedTask.id,
      summary: `Updated task ${updatedTask.name}.`,
      metadata: sharedMetadata,
    });
  }

  await Promise.all(entries.map((entry) => recordAdminAudit(entry)));
}

async function loadVisibleTask({ taskId, isAdmin, userId }) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      ...buildTaskVisibilityWhere({ isAdmin, userId }),
    },
    include: {
      ...taskInclude,
      project: {
        select: {
          ...taskProjectSummarySelect,
          memberships: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });
}

async function loadEffectiveProject({ projectId, existingProject }) {
  if (projectId === existingProject.id) {
    return existingProject;
  }

  return prisma.project.findUnique({
    where: { id: projectId },
    include: taskProjectAccessInclude,
  });
}

async function loadAssigneeUser(assigneeId) {
  return prisma.user.findUnique({
    where: { id: assigneeId },
    select: {
      id: true,
      isAdmin: true,
    },
  });
}

export async function GET(_request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    const task = await loadVisibleTask({
      taskId,
      isAdmin,
      userId: session.user.id,
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      task: toTaskDto(task, {
        sessionUserId: session.user.id,
        isAdmin,
      }),
    });
  } catch (error) {
    console.error("Task retrieval failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load task right now. Please try again later." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const input = body && typeof body === "object" ? body : {};
    const hasProjectId = Object.prototype.hasOwnProperty.call(input, "projectId");
    const hasName = Object.prototype.hasOwnProperty.call(input, "name");
    const hasAssigneeId =
      Object.prototype.hasOwnProperty.call(input, "assigneeId") ||
      Object.prototype.hasOwnProperty.call(input, "assignee");
    const hasCompleted = Object.prototype.hasOwnProperty.call(input, "completed");
    const hasApprovalStatus =
      Object.prototype.hasOwnProperty.call(input, "approvalStatus") ||
      Object.prototype.hasOwnProperty.call(input, "approval_status");
    const hasDueOn = Object.prototype.hasOwnProperty.call(input, "dueOn");
    const hasNotes = Object.prototype.hasOwnProperty.call(input, "notes");
    const hasParentTaskId = Object.prototype.hasOwnProperty.call(input, "parentTaskId");

    if (!isAdmin && hasAssigneeId) {
      return NextResponse.json(
        { ok: false, error: "Only admins can reassign tasks." },
        { status: 403 }
      );
    }

    if (!isAdmin && hasApprovalStatus) {
      return NextResponse.json(
        { ok: false, error: "Only admins can approve or reject tasks." },
        { status: 403 }
      );
    }

    const existingTask = await loadVisibleTask({
      taskId,
      isAdmin,
      userId: session.user.id,
    });

    if (!existingTask) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    const parsedProjectId = hasProjectId ? parseOptionalId(input.projectId) : null;
    if (hasProjectId && !parsedProjectId) {
      return NextResponse.json({ ok: false, error: "Project is required." }, { status: 400 });
    }

    const parsedName = hasName ? parseTaskName(input.name) : "";
    if (hasName && !parsedName) {
      return NextResponse.json({ ok: false, error: "Task name is required." }, { status: 400 });
    }

    const parsedCompleted = hasCompleted ? parseTaskCompletedValue(input.completed) : null;
    if (hasCompleted && parsedCompleted === null) {
      return NextResponse.json({ ok: false, error: "Invalid completed flag." }, { status: 400 });
    }

    const parsedApprovalStatus = hasApprovalStatus
      ? parseTaskApprovalStatus(input.approvalStatus ?? input.approval_status)
      : null;
    if (hasApprovalStatus && parsedApprovalStatus === null) {
      return NextResponse.json({ ok: false, error: "Invalid approval status." }, { status: 400 });
    }

    const dueOnInput = hasDueOn ? input.dueOn : undefined;
    const parsedDueOn = !hasDueOn
      ? undefined
      : dueOnInput === null || dueOnInput === ""
        ? null
        : parseDateInput(dueOnInput);
    if (hasDueOn && dueOnInput !== null && dueOnInput !== "" && !parsedDueOn) {
      return NextResponse.json({ ok: false, error: "Invalid due date." }, { status: 400 });
    }

    const parsedNotes = hasNotes ? parseTaskNotes(input.notes) : undefined;
    const parsedParentTaskId = !hasParentTaskId
      ? undefined
      : input.parentTaskId === null || input.parentTaskId === ""
        ? null
        : parseOptionalId(input.parentTaskId);
    if (hasParentTaskId && input.parentTaskId !== null && input.parentTaskId !== "" && !parsedParentTaskId) {
      return NextResponse.json({ ok: false, error: "Invalid parent task." }, { status: 400 });
    }

    const effectiveProjectId = hasProjectId ? parsedProjectId : existingTask.projectId;
    const effectiveProject = await loadEffectiveProject({
      projectId: effectiveProjectId,
      existingProject: existingTask.project,
    });

    if (!effectiveProject) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    if (!isAdmin && !isProjectMember(effectiveProject, session.user.id)) {
      return NextResponse.json(
        { ok: false, error: "Engineers can only move tasks to assigned projects." },
        { status: 403 }
      );
    }

    const nextAssigneeId = hasAssigneeId
      ? parseOptionalId(input.assigneeId ?? input.assignee)
      : existingTask.assigneeId;
    if (hasAssigneeId && !nextAssigneeId) {
      return NextResponse.json({ ok: false, error: "Assignee is required." }, { status: 400 });
    }

    const assigneeUser = await loadAssigneeUser(nextAssigneeId);
    if (!assigneeUser) {
      return NextResponse.json({ ok: false, error: "Assignee not found." }, { status: 404 });
    }

    if (isAdmin && assigneeUser.isAdmin && assigneeUser.id !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Admins can only self-assign admin tasks." },
        { status: 400 }
      );
    }

    if (!assigneeUser.isAdmin && !isProjectMember(effectiveProject, assigneeUser.id)) {
      return NextResponse.json(
        { ok: false, error: "Assignee must be assigned to the selected project." },
        { status: 400 }
      );
    }

    const effectiveParentTaskId = hasParentTaskId ? parsedParentTaskId : existingTask.parentTaskId;
    if (effectiveParentTaskId === taskId) {
      return NextResponse.json(
        { ok: false, error: "A task cannot be its own parent." },
        { status: 400 }
      );
    }

    if (effectiveParentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: effectiveParentTaskId },
        select: { id: true, projectId: true },
      });

      if (!parentTask) {
        return NextResponse.json({ ok: false, error: "Parent task not found." }, { status: 404 });
      }

      if (parentTask.projectId !== effectiveProjectId) {
        return NextResponse.json(
          { ok: false, error: "Parent task must belong to the selected project." },
          { status: 400 }
        );
      }
    }

    const updateData = {};

    if (hasProjectId && effectiveProjectId !== existingTask.projectId) {
      updateData.projectId = effectiveProjectId;
    }

    if (hasName && parsedName !== existingTask.name) {
      updateData.name = parsedName;
    }

    if (isAdmin && hasAssigneeId && nextAssigneeId !== existingTask.assigneeId) {
      updateData.assigneeId = nextAssigneeId;
      updateData.assignedById = session.user.id;
    }

    if (hasDueOn && dateToIso(parsedDueOn) !== dateToIso(existingTask.dueOn)) {
      updateData.dueOn = parsedDueOn;
    }

    if (hasNotes && (parsedNotes || "") !== (existingTask.notes || "")) {
      updateData.notes = parsedNotes || null;
    }

    if (hasParentTaskId && (parsedParentTaskId || null) !== (existingTask.parentTaskId || null)) {
      updateData.parentTaskId = parsedParentTaskId;
    }

    if (isAdmin && hasApprovalStatus && parsedApprovalStatus !== existingTask.approvalStatus) {
      updateData.approvalStatus = parsedApprovalStatus;
    }

    if (hasCompleted && parsedCompleted !== existingTask.completed) {
      updateData.completed = parsedCompleted;
      updateData.completedAt = parsedCompleted ? new Date() : null;
      updateData.completedById = parsedCompleted ? session.user.id : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        ok: true,
        task: toTaskDto(existingTask, {
          sessionUserId: session.user.id,
          isAdmin,
        }),
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: taskInclude,
    });

    if (isAdmin) {
      const changes = buildTaskChanges(existingTask, updatedTask);
      await recordTaskUpdateAudits({
        session,
        previousTask: existingTask,
        updatedTask,
        changes,
      });
    }

    return NextResponse.json({
      ok: true,
      task: toTaskDto(updatedTask, {
        sessionUserId: session.user.id,
        isAdmin,
      }),
    });
  } catch (error) {
    console.error("Task update failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update task right now. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    const existingTask = await loadVisibleTask({
      taskId,
      isAdmin,
      userId: session.user.id,
    });

    if (!existingTask) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    if (isAdmin) {
      await recordAdminAudit({
        actorUserId: session.user.id,
        actorEmail: session.user.email,
        action: "task.deleted",
        targetType: "task",
        targetId: existingTask.id,
        summary: `Deleted task ${existingTask.name}.`,
        metadata: {
          taskId: existingTask.id,
          taskName: existingTask.name,
          projectId: existingTask.projectId,
          projectName: existingTask.project?.name || "",
        },
      });
    }

    return NextResponse.json({ ok: true, deletedTaskId: taskId });
  } catch (error) {
    console.error("Task deletion failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete task right now. Please try again later." },
      { status: 500 }
    );
  }
}
