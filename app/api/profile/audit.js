import { recordAdminAudit } from "../../../lib/admin-audit";
import {
  normalizeHolidaysForCompare,
  normalizeSkillsForCompare,
  stringifyForCompare,
} from "./shared";

export async function recordProfileChangeAudits(previous, updated) {
  const previousSkills = normalizeSkillsForCompare(previous.skills);
  const updatedSkills = normalizeSkillsForCompare(updated.skills);
  const previousHolidays = normalizeHolidaysForCompare(previous.upcomingHolidays);
  const updatedHolidays = normalizeHolidaysForCompare(updated.upcomingHolidays);
  const availabilityChanged =
    previous.availabilityStatus !== updated.availabilityStatus ||
    (previous.availabilityNote || "") !== (updated.availabilityNote || "");
  const skillsChanged = stringifyForCompare(previousSkills) !== stringifyForCompare(updatedSkills);
  const holidaysChanged =
    stringifyForCompare(previousHolidays) !== stringifyForCompare(updatedHolidays);

  if (availabilityChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.availability.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated availability.`,
      metadata: {
        before: {
          availabilityStatus: previous.availabilityStatus || null,
          availabilityNote: previous.availabilityNote || null,
        },
        after: {
          availabilityStatus: updated.availabilityStatus || null,
          availabilityNote: updated.availabilityNote || null,
        },
      },
    });
  }

  if (skillsChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.skills.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated skills.`,
      metadata: {
        before: previousSkills,
        after: updatedSkills,
      },
    });
  }

  if (holidaysChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.holidays.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated holidays.`,
      metadata: {
        before: previousHolidays,
        after: updatedHolidays,
      },
    });
  }
}
