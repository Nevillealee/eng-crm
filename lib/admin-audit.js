import prisma from "./prisma";

function truncate(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export async function recordAdminAudit({
  actorUserId,
  actorEmail,
  action,
  targetType,
  targetId,
  summary,
  metadata,
}) {
  if (!action || !targetType || !summary) {
    return;
  }

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: typeof actorUserId === "string" ? actorUserId : null,
      actorEmail: truncate(actorEmail || "", 320) || null,
      action: truncate(action, 120),
      targetType: truncate(targetType, 80),
      targetId: typeof targetId === "string" ? truncate(targetId, 120) : null,
      summary: truncate(summary, 500),
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    },
  });
}
