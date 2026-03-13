import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordAdminAudit } from "../../../lib/admin-audit";
import {
  buildTaskListFilters,
  buildTaskWhere,
  isProjectMember,
  parseDateInput,
  parseOptionalId,
  parseTaskCompletedValue,
  parseTaskName,
  parseTaskNotes,
  taskInclude,
  taskProjectAccessInclude,
  toTaskDto,
} from "./shared";

async function resolveAssignee({ assigneeId, actingUserId, isAdmin, project }) {
  const effectiveAssigneeId = assigneeId || actingUserId;
  const assignee = await prisma.user.findUnique({
    where: { id: effectiveAssigneeId },
    select: { id: true, isAdmin: true },
  });

  if (!assignee) {
    return { error: "Assignee not found." };
  }

  if (!isAdmin && assignee.id !== actingUserId) {
    return { error: "Engineers can only assign tasks to themselves.", status: 403 };
  }

  if (isAdmin && assignee.isAdmin && assignee.id !== actingUserId) {
    return { error: "Admins can only self-assign admin tasks." };
  }

  if (!assignee.isAdmin && !isProjectMember(project, assignee.id)) {
    return { error: "Assignee must be assigned to the selected project." };
  }

  return { assignee };
}

export async function GET(request = new Request("http://localhost/api/tasks")) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const searchParams = new URL(request.url).searchParams;
    const filters = buildTaskListFilters(searchParams);
    const tasks = await prisma.task.findMany({
      where: buildTaskWhere({
        filters,
        isAdmin,
        userId: session.user.id,
      }),
      orderBy: [{ completed: "asc" }, { dueOn: "asc" }, { createdAt: "desc" }],
      include: taskInclude,
    });

    return NextResponse.json({
      ok: true,
      tasks: tasks.map((task) =>
        toTaskDto(task, {
          sessionUserId: session.user.id,
          isAdmin,
        })
      ),
    });
  } catch (error) {
    console.error("Task list retrieval failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load tasks right now. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const body = await request.json().catch(() => ({}));
    const input = body && typeof body === "object" ? body : {};
    const projectId = parseOptionalId(input.projectId);
    const name = parseTaskName(input.name);
    const requestedAssigneeId = parseOptionalId(input.assigneeId ?? input.assignee);
    const requestedCompleted = parseTaskCompletedValue(input.completed);
    const parentTaskId = parseOptionalId(input.parentTaskId);
    const notes = parseTaskNotes(input.notes);
    const hasDueOnInput = Object.prototype.hasOwnProperty.call(input, "dueOn");
    const dueOn = input.dueOn === null || input.dueOn === "" ? null : parseDateInput(input.dueOn);

    if (!projectId || !name) {
      return NextResponse.json(
        { ok: false, error: "Project and task name are required." },
        { status: 400 }
      );
    }

    if (hasDueOnInput && input.dueOn !== null && input.dueOn !== "" && !dueOn) {
      return NextResponse.json({ ok: false, error: "Invalid due date." }, { status: 400 });
    }

    if (Object.prototype.hasOwnProperty.call(input, "completed") && requestedCompleted === null) {
      return NextResponse.json({ ok: false, error: "Invalid completed flag." }, { status: 400 });
    }

    if (Object.prototype.hasOwnProperty.call(input, "approvalStatus")) {
      return NextResponse.json(
        { ok: false, error: "Field approvalStatus has been removed." },
        { status: 400 }
      );
    }

    if (Object.prototype.hasOwnProperty.call(input, "approval_status")) {
      return NextResponse.json(
        { ok: false, error: "Field approval_status has been removed." },
        { status: 400 }
      );
    }

    if (!isAdmin && requestedAssigneeId && requestedAssigneeId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Engineers can only assign tasks to themselves." },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: taskProjectAccessInclude,
    });

    if (!project) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    if (!isAdmin && !isProjectMember(project, session.user.id)) {
      return NextResponse.json(
        { ok: false, error: "Engineers can only create tasks for assigned projects." },
        { status: 403 }
      );
    }

    if (parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentTaskId },
        select: { id: true, projectId: true },
      });

      if (!parentTask) {
        return NextResponse.json({ ok: false, error: "Parent task not found." }, { status: 404 });
      }

      if (parentTask.projectId !== projectId) {
        return NextResponse.json(
          { ok: false, error: "Parent task must belong to the selected project." },
          { status: 400 }
        );
      }
    }

    const assigneeResult = await resolveAssignee({
      assigneeId: requestedAssigneeId,
      actingUserId: session.user.id,
      isAdmin,
      project,
    });

    if (assigneeResult.error) {
      return NextResponse.json(
        { ok: false, error: assigneeResult.error },
        { status: assigneeResult.status || 400 }
      );
    }

    const completed = requestedCompleted === true;
    const now = new Date();
    const task = await prisma.task.create({
      data: {
        projectId,
        parentTaskId,
        name,
        assigneeId: assigneeResult.assignee.id,
        assignedById: session.user.id,
        createdByUserId: session.user.id,
        completed,
        completedAt: completed ? now : null,
        completedById: completed ? session.user.id : null,
        dueOn,
        notes: notes || null,
        resourceType: "task",
      },
      include: taskInclude,
    });

    if (isAdmin) {
      await recordAdminAudit({
        actorUserId: session.user.id,
        actorEmail: session.user.email,
        action: "task.created",
        targetType: "task",
        targetId: task.id,
        summary: `Created task ${task.name}.`,
        metadata: {
          taskId: task.id,
          taskName: task.name,
          projectId: task.projectId,
          projectName: task.project?.name || "",
          assigneeId: task.assigneeId,
          completed: task.completed,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        task: toTaskDto(task, {
          sessionUserId: session.user.id,
          isAdmin,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task creation failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create task right now. Please try again later." },
      { status: 500 }
    );
  }
}
