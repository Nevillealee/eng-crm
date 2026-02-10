import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";
import { recordAdminAudit } from "../../../../lib/admin-audit";
import {
  allowedProjectStatuses,
  isPrismaNotFoundError,
  parseCostPhpInput,
  parseCurrencyCodeInput,
  parseDateInput,
  parseTeamMemberIds,
  projectMembershipInclude,
  toProjectDto,
} from "../shared";
import { PROJECT_CURRENCY_CODE_SET } from "../../../constants/project-currencies";

function sortedIds(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export async function PATCH(request, { params }) {
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

  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : undefined;
  const status = typeof body?.status === "string" ? body.status : undefined;
  const hasCostPhp = Object.prototype.hasOwnProperty.call(body || {}, "costPhp");
  const costPhp = hasCostPhp ? parseCostPhpInput(body?.costPhp) : undefined;
  const hasCurrencyCode = Object.prototype.hasOwnProperty.call(body || {}, "currencyCode");
  const currencyCode = hasCurrencyCode
    ? parseCurrencyCodeInput(body?.currencyCode, PROJECT_CURRENCY_CODE_SET)
    : undefined;
  const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim() : undefined;
  const hasStartDate = Object.prototype.hasOwnProperty.call(body || {}, "startDate");
  const hasEndDate = Object.prototype.hasOwnProperty.call(body || {}, "endDate");
  const startDate = hasStartDate ? parseDateInput(body?.startDate) : undefined;
  const endDate =
    hasEndDate && body?.endDate ? parseDateInput(body.endDate) : hasEndDate ? null : undefined;
  const teamMemberIds = Array.isArray(body?.teamMemberIds)
    ? parseTeamMemberIds(body.teamMemberIds)
    : undefined;

  if (typeof status !== "undefined" && !allowedProjectStatuses.has(status)) {
    return NextResponse.json({ ok: false, error: "Invalid project status." }, { status: 400 });
  }

  if (hasCostPhp && costPhp === null) {
    return NextResponse.json(
      { ok: false, error: "Project cost must be a non-negative whole number." },
      { status: 400 }
    );
  }

  if (hasCurrencyCode && currencyCode === null) {
    return NextResponse.json({ ok: false, error: "Invalid currency code." }, { status: 400 });
  }

  if (hasStartDate && !startDate) {
    return NextResponse.json({ ok: false, error: "Invalid start date." }, { status: 400 });
  }

  if (hasEndDate && body?.endDate && !endDate) {
    return NextResponse.json({ ok: false, error: "Invalid end date." }, { status: 400 });
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

  const effectiveStartDate = startDate || previousProject.startDate;
  const effectiveEndDate = hasEndDate ? endDate : previousProject.endDate;

  if (
    effectiveStartDate &&
    effectiveEndDate &&
    new Date(effectiveEndDate).getTime() < new Date(effectiveStartDate).getTime()
  ) {
    return NextResponse.json(
      { ok: false, error: "End date must be on or after start date." },
      { status: 400 }
    );
  }

  const validEngineerIds =
    typeof teamMemberIds === "undefined"
      ? undefined
      : (
          await prisma.user.findMany({
            where: { id: { in: teamMemberIds }, isAdmin: false },
            select: { id: true },
          })
        ).map((user) => user.id);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          name: typeof name === "undefined" ? undefined : name.slice(0, 200),
          clientName:
            typeof clientName === "undefined" ? undefined : clientName.slice(0, 200),
          costPhp,
          currencyCode,
          status,
          startDate,
          endDate,
          adminNotes:
            typeof adminNotes === "undefined"
              ? undefined
              : adminNotes
              ? adminNotes.slice(0, 5000)
              : null,
        },
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

    const previousTeamMemberIds = sortedIds(
      (previousProject.memberships || []).map((membership) => membership.userId)
    );
    const updatedTeamMemberIds = sortedIds(
      (updated.memberships || []).map((membership) => membership.userId)
    );
    const changes = {};

    if (typeof name !== "undefined" && previousProject.name !== updated.name) {
      changes.name = { before: previousProject.name, after: updated.name };
    }
    if (typeof clientName !== "undefined" && previousProject.clientName !== updated.clientName) {
      changes.clientName = { before: previousProject.clientName, after: updated.clientName };
    }
    if (typeof status !== "undefined" && previousProject.status !== updated.status) {
      changes.status = { before: previousProject.status, after: updated.status };
    }
    if (typeof costPhp !== "undefined" && previousProject.costPhp !== updated.costPhp) {
      changes.costPhp = { before: previousProject.costPhp, after: updated.costPhp };
    }
    if (typeof currencyCode !== "undefined" && previousProject.currencyCode !== updated.currencyCode) {
      changes.currencyCode = { before: previousProject.currencyCode, after: updated.currencyCode };
    }
    if (
      typeof startDate !== "undefined" &&
      previousProject.startDate?.getTime() !== updated.startDate?.getTime()
    ) {
      changes.startDate = { before: previousProject.startDate, after: updated.startDate };
    }
    if (
      typeof endDate !== "undefined" &&
      (previousProject.endDate?.getTime() || null) !== (updated.endDate?.getTime() || null)
    ) {
      changes.endDate = { before: previousProject.endDate, after: updated.endDate };
    }
    if (typeof adminNotes !== "undefined" && (previousProject.adminNotes || null) !== (updated.adminNotes || null)) {
      changes.adminNotes = {
        before: previousProject.adminNotes || null,
        after: updated.adminNotes || null,
      };
    }
    if (
      typeof validEngineerIds !== "undefined" &&
      JSON.stringify(previousTeamMemberIds) !== JSON.stringify(updatedTeamMemberIds)
    ) {
      changes.teamMemberIds = {
        before: previousTeamMemberIds,
        after: updatedTeamMemberIds,
      };
    }

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

    throw error;
  }
}

export async function DELETE(_request, { params }) {
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

  try {
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

    throw error;
  }
}
