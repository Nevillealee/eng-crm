import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_INVALID_ERROR,
  AVATAR_TOO_LARGE_ERROR,
  AVATAR_TYPE_INVALID_ERROR,
  BASE64_CONTENT_PATTERN,
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

export function toAvatarDataUrl(avatar, avatarMimeType) {
  if (
    !avatar ||
    typeof avatarMimeType !== "string" ||
    !ALLOWED_AVATAR_MIME_TYPES.has(avatarMimeType)
  ) {
    return null;
  }
  const avatarBuffer =
    Buffer.isBuffer(avatar) ? avatar : avatar instanceof Uint8Array ? Buffer.from(avatar) : null;
  if (!avatarBuffer || avatarBuffer.length === 0) {
    return null;
  }
  return `data:${avatarMimeType};base64,${avatarBuffer.toString("base64")}`;
}

function estimateBase64ByteLength(value) {
  if (value.length % 4 !== 0) {
    return null;
  }

  const paddingLength = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length / 4) * 3 - paddingLength;
}

export function parseAvatarUpdate(avatar, avatarType) {
  if (avatar === undefined) {
    return { hasAvatarUpdate: false };
  }

  if (avatar === null) {
    return { hasAvatarUpdate: true, avatarBuffer: null, avatarMimeType: null };
  }

  if (typeof avatar !== "string") {
    return { error: AVATAR_INVALID_ERROR };
  }

  const normalizedAvatar = avatar.trim();
  if (!normalizedAvatar || !BASE64_CONTENT_PATTERN.test(normalizedAvatar)) {
    return { error: AVATAR_INVALID_ERROR };
  }

  if (typeof avatarType !== "string" || !ALLOWED_AVATAR_MIME_TYPES.has(avatarType)) {
    return { error: AVATAR_TYPE_INVALID_ERROR };
  }

  const estimatedBytes = estimateBase64ByteLength(normalizedAvatar);
  if (!estimatedBytes || estimatedBytes > AVATAR_MAX_BYTES) {
    return { error: AVATAR_TOO_LARGE_ERROR };
  }

  const avatarBuffer = Buffer.from(normalizedAvatar, "base64");
  if (!avatarBuffer.length || avatarBuffer.length > AVATAR_MAX_BYTES) {
    return { error: AVATAR_TOO_LARGE_ERROR };
  }

  return { hasAvatarUpdate: true, avatarBuffer, avatarMimeType: avatarType };
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
    image: toAvatarDataUrl(user.avatar, user.avatarMimeType) || user.image || null,
    avatar: undefined,
    avatarMimeType: undefined,
  };
}

export function stringifyForCompare(value) {
  return JSON.stringify(value);
}
