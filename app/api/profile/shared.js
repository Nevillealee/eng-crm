const allowedAvatarMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxAvatarBytes = 2 * 1024 * 1024;
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

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
      label: label.slice(0, 120),
      startDate,
      endDate,
    });
  }

  return parsed;
}

export function toAvatarDataUrl(avatar, avatarMimeType) {
  if (!avatar || typeof avatarMimeType !== "string" || !allowedAvatarMimeTypes.has(avatarMimeType)) {
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
    return { error: "Avatar image is invalid." };
  }

  const normalizedAvatar = avatar.trim();
  if (!normalizedAvatar || !base64Pattern.test(normalizedAvatar)) {
    return { error: "Avatar image is invalid." };
  }

  if (typeof avatarType !== "string" || !allowedAvatarMimeTypes.has(avatarType)) {
    return { error: "Avatar type is invalid." };
  }

  const estimatedBytes = estimateBase64ByteLength(normalizedAvatar);
  if (!estimatedBytes || estimatedBytes > maxAvatarBytes) {
    return { error: "Avatar must be 2MB or smaller." };
  }

  const avatarBuffer = Buffer.from(normalizedAvatar, "base64");
  if (!avatarBuffer.length || avatarBuffer.length > maxAvatarBytes) {
    return { error: "Avatar must be 2MB or smaller." };
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
