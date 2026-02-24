import prisma from "./prisma";
import {
  ADMIN_AUDIT_ACTION_MAX_LENGTH,
  ADMIN_AUDIT_ACTOR_EMAIL_MAX_LENGTH,
  ADMIN_AUDIT_SUMMARY_MAX_LENGTH,
  ADMIN_AUDIT_TARGET_ID_MAX_LENGTH,
  ADMIN_AUDIT_TARGET_TYPE_MAX_LENGTH,
} from "../app/constants/text-limits";

function truncate(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/**
 * Persists an admin audit log entry when the minimum required fields are present.
 *
 * @param {object} input
 * @param {string | null | undefined} input.actorUserId
 * @param {string | null | undefined} input.actorEmail
 * @param {string} input.action
 * @param {string} input.targetType
 * @param {string | null | undefined} input.targetId
 * @param {string} input.summary
 * @param {Record<string, unknown> | undefined} input.metadata
 * @returns {Promise<void>}
 */
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
      actorEmail: truncate(actorEmail || "", ADMIN_AUDIT_ACTOR_EMAIL_MAX_LENGTH) || null,
      action: truncate(action, ADMIN_AUDIT_ACTION_MAX_LENGTH),
      targetType: truncate(targetType, ADMIN_AUDIT_TARGET_TYPE_MAX_LENGTH),
      targetId:
        typeof targetId === "string" ? truncate(targetId, ADMIN_AUDIT_TARGET_ID_MAX_LENGTH) : null,
      summary: truncate(summary, ADMIN_AUDIT_SUMMARY_MAX_LENGTH),
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    },
  });
}
