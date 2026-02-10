import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordAdminAudit } from "../../../lib/admin-audit";
import {
  allowedProjectStatuses,
  parseCostPhpInput,
  parseCurrencyCodeInput,
  parseDateInput,
  parseTeamMemberIds,
  projectMembershipInclude,
  toProjectDto,
} from "./shared";
import { PROJECT_CURRENCY_CODE_SET } from "../../constants/project-currencies";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  const now = new Date();

  const where = isAdmin
    ? {}
    : {
        memberships: { some: { userId: session.user.id } },
        status: "ongoing",
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      };

  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: projectMembershipInclude,
  });

  return NextResponse.json({
    ok: true,
    projects: projects.map((project) => toProjectDto(project, isAdmin)),
  });
}

export async function POST(request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "";
  const status = typeof body?.status === "string" ? body.status : "ongoing";
  const costPhp = parseCostPhpInput(body?.costPhp);
  const currencyCode = parseCurrencyCodeInput(body?.currencyCode || "PHP", PROJECT_CURRENCY_CODE_SET);
  const startDate = parseDateInput(body?.startDate);
  const endDate = body?.endDate ? parseDateInput(body.endDate) : null;
  const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim() : "";
  const teamMemberIds = parseTeamMemberIds(body?.teamMemberIds);

  if (!name || !clientName || !startDate) {
    return NextResponse.json(
      { ok: false, error: "Name, client name, and start date are required." },
      { status: 400 }
    );
  }

  if (!allowedProjectStatuses.has(status)) {
    return NextResponse.json({ ok: false, error: "Invalid project status." }, { status: 400 });
  }

  if (costPhp === null) {
    return NextResponse.json(
      { ok: false, error: "Project cost must be a non-negative whole number." },
      { status: 400 }
    );
  }

  if (currencyCode === null) {
    return NextResponse.json({ ok: false, error: "Invalid currency code." }, { status: 400 });
  }

  if (endDate && endDate < startDate) {
    return NextResponse.json(
      { ok: false, error: "End date must be on or after start date." },
      { status: 400 }
    );
  }

  const engineers = teamMemberIds.length
    ? await prisma.user.findMany({
        where: {
          id: { in: teamMemberIds },
          isAdmin: false,
        },
        select: { id: true },
      })
    : [];

  const validEngineerIds = engineers.map((user) => user.id);

  const project = await prisma.project.create({
    data: {
      name: name.slice(0, 200),
      clientName: clientName.slice(0, 200),
      costPhp,
      currencyCode,
      status,
      startDate,
      endDate,
      adminNotes: adminNotes ? adminNotes.slice(0, 5000) : null,
      memberships: validEngineerIds.length
        ? {
            createMany: {
              data: validEngineerIds.map((userId) => ({ userId })),
            },
          }
        : undefined,
    },
    include: projectMembershipInclude,
  });

  await recordAdminAudit({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: "project.created",
    targetType: "project",
    targetId: project.name,
    summary: `Created project ${project.name}.`,
    metadata: {
      name: project.name,
      clientName: project.clientName,
      status: project.status,
      currencyCode: project.currencyCode,
      costPhp: project.costPhp,
      teamMemberIds: (project.memberships || []).map((membership) => membership.userId),
    },
  });

  return NextResponse.json({ ok: true, project: toProjectDto(project, true) }, { status: 201 });
}
