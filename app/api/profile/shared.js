import {
  AVATAR_INVALID_ERROR,
  AVATAR_URL_MAX_LENGTH,
  AVATAR_URL_TOO_LONG_ERROR,
} from "../../constants/avatar";
import { PROFILE_HOLIDAY_LABEL_MAX_LENGTH } from "../../constants/text-limits";

export const allowedAvailability = new Set([
  "available",
  "partially_allocated",
  "unavailable",
]);
export const maxOnboardingStep = 3;

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeAvatarUrl(avatar) {
  if (typeof avatar !== "string") {
    return { error: AVATAR_INVALID_ERROR };
  }

  const trimmedAvatar = avatar.trim();
  if (!trimmedAvatar) {
    return { avatarUrl: null };
  }

  if (trimmedAvatar.length > AVATAR_URL_MAX_LENGTH) {
    return { error: AVATAR_URL_TOO_LONG_ERROR };
  }

  let parsed;
  try {
    parsed = new URL(trimmedAvatar);
  } catch {
    return { error: AVATAR_INVALID_ERROR };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: AVATAR_INVALID_ERROR };
  }

  return { avatarUrl: parsed.toString() };
}

export function parseSkills(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);

  return [...new Set(normalized)];
}

export function parseHolidays(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = [];

  for (const item of value.slice(0, 20)) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const label = typeof item.label === "string" ? item.label.trim() : "";
    const startDate = item.startDate;
    const endDate = item.endDate;

    if (!label || !isValidDateString(startDate) || !isValidDateString(endDate)) {
      return null;
    }

    if (new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`)) {
      return null;
    }

    parsed.push({
      label: label.slice(0, PROFILE_HOLIDAY_LABEL_MAX_LENGTH),
      startDate,
      endDate,
    });
  }

  return parsed;
}

export function parseAvatarUpdate(avatar) {
  if (avatar === undefined) {
    return { hasAvatarUpdate: false };
  }

  if (avatar === null) {
    return { hasAvatarUpdate: true, avatarUrl: null };
  }

  const parsed = normalizeAvatarUrl(avatar);
  if (parsed.error) {
    return { error: parsed.error };
  }

  return { hasAvatarUpdate: true, avatarUrl: parsed.avatarUrl };
}

export function normalizeSkillsForCompare(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...value].filter((item) => typeof item === "string").sort((a, b) => a.localeCompare(b));
}

export function normalizeHolidaysForCompare(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...value]
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      startDate: typeof item.startDate === "string" ? item.startDate : "",
      endDate: typeof item.endDate === "string" ? item.endDate : "",
    }))
    .sort((left, right) => {
      if (left.startDate !== right.startDate) {
        return left.startDate.localeCompare(right.startDate);
      }
      if (left.endDate !== right.endDate) {
        return left.endDate.localeCompare(right.endDate);
      }
      return left.label.localeCompare(right.label);
    });
}

export function toProfileDto(user) {
  return {
    ...user,
    image: typeof user.image === "string" ? user.image : null,
  };
}

export function stringifyForCompare(value) {
  return JSON.stringify(value);
}
