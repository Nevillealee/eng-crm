import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitInput = Number.parseInt(searchParams.get("limit") || "50", 10);
  const limit = Number.isInteger(limitInput) ? Math.min(Math.max(limitInput, 1), 200) : 50;

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      actorUserId: true,
      actorEmail: true,
      summary: true,
      metadata: true,
      createdAt: true,
    },
  });

  const projectTargetIds = [
    ...new Set(
      logs
        .filter((entry) => entry.targetType === "project" && typeof entry.targetId === "string")
        .map((entry) => entry.targetId)
    ),
  ];
  const userTargetIds = [
    ...new Set(
      logs
        .filter(
          (entry) =>
            entry.targetType === "user" &&
            typeof entry.targetId === "string" &&
            !entry.targetId.includes("@")
        )
        .map((entry) => entry.targetId)
    ),
  ];

  const [projects, users] = await Promise.all([
    projectTargetIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectTargetIds } },
          select: { id: true, name: true },
        })
      : [],
    userTargetIds.length
      ? prisma.user.findMany({
          where: { id: { in: userTargetIds } },
          select: { id: true, email: true },
        })
      : [],
  ]);

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const userEmailById = new Map(users.map((user) => [user.id, user.email]));

  const logsWithTargetValue = logs.map((entry) => {
    let targetValue = entry.targetId || "";

    if (entry.targetType === "project") {
      targetValue =
        projectNameById.get(entry.targetId || "") ||
        (typeof entry.metadata?.name === "string" ? entry.metadata.name : "") ||
        targetValue;
    }

    if (entry.targetType === "user") {
      targetValue =
        (entry.targetId || "").includes("@")
          ? entry.targetId
          : userEmailById.get(entry.targetId || "") || targetValue;
    }

    return {
      ...entry,
      targetValue,
    };
  });

  return NextResponse.json({ ok: true, logs: logsWithTargetValue });
}
