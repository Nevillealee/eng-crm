export const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const BASE64_CONTENT_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export const AVATAR_INVALID_ERROR = "Avatar image is invalid.";
export const AVATAR_TYPE_INVALID_ERROR = "Avatar type is invalid.";
export const AVATAR_TOO_LARGE_ERROR = "Avatar must be 2MB or smaller.";
