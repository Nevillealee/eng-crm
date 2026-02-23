import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";
import { recordAdminAudit } from "../../../../lib/admin-audit";
import {
  isPrismaNotFoundError,
  projectMembershipInclude,
  toProjectDto,
} from "../shared";
import { buildProjectChanges, isEndDateBeforeStartDate } from "./route-helpers";
import {
  getProjectPatchValidationError,
  parseProjectPatchInput,
  toProjectUpdateData,
} from "./route-input";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const patchInput = parseProjectPatchInput(body);
    const validationError = getProjectPatchValidationError(patchInput);

    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const previousProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          select: { userId: true },
        },
      },
    });

    if (!previousProject) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    const effectiveStartDate = patchInput.startDate || previousProject.startDate;
    const effectiveEndDate = patchInput.hasEndDate ? patchInput.endDate : previousProject.endDate;

    if (isEndDateBeforeStartDate(effectiveStartDate, effectiveEndDate)) {
      return NextResponse.json(
        { ok: false, error: "End date must be on or after start date." },
        { status: 400 }
      );
    }

    const validEngineerIds =
      typeof patchInput.teamMemberIds === "undefined"
        ? undefined
        : (
            await prisma.user.findMany({
              where: { id: { in: patchInput.teamMemberIds }, isAdmin: false },
              select: { id: true },
            })
          ).map((user) => user.id);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: toProjectUpdateData(patchInput),
      });

      if (typeof validEngineerIds !== "undefined") {
        await tx.projectMembership.deleteMany({
          where: { projectId },
        });

        if (validEngineerIds.length) {
          await tx.projectMembership.createMany({
            data: validEngineerIds.map((userId) => ({ projectId, userId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.project.findUnique({
        where: { id: projectId },
        include: projectMembershipInclude,
      });
    });

    const changes = buildProjectChanges({
      previousProject,
      updatedProject: updated,
      name: patchInput.name,
      clientName: patchInput.clientName,
      status: patchInput.status,
      costPhp: patchInput.costPhp,
      currencyCode: patchInput.currencyCode,
      startDate: patchInput.startDate,
      endDate: patchInput.endDate,
      adminNotes: patchInput.adminNotes,
      validEngineerIds,
    });

    if (Object.keys(changes).length > 0) {
      const isArchiveAction = changes.status?.after === "archived";
      await recordAdminAudit({
        actorUserId: session.user.id,
        actorEmail: session.user.email,
        action: isArchiveAction ? "project.archived" : "project.updated",
        targetType: "project",
        targetId: updated.name,
        summary: `${isArchiveAction ? "Archived" : "Updated"} project ${updated.name}.`,
        metadata: { changes },
      });
    }

    return NextResponse.json({ ok: true, project: toProjectDto(updated, true) });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    console.error("Project update failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update project right now. Please try again later." },
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    const deleted = await prisma.project.delete({
      where: { id: projectId },
    });

    await recordAdminAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "project.deleted",
      targetType: "project",
      targetId: existing.name || deleted.name || "",
      summary: `Deleted project ${existing.name}.`,
      metadata: {
        status: existing.status,
      },
    });

    return NextResponse.json({ ok: true, deletedProjectId: deleted.id });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    }

    console.error("Project delete failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete project right now. Please try again later." },
      { status: 500 }
    );
  }
}
