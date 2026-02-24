export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 32;

export const PASSWORD_MIN_LENGTH_ERROR = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
export const PASSWORD_MAX_BYTES_ERROR = `Password must be ${PASSWORD_MAX_BYTES} characters or fewer.`;

export function getUtf8ByteLength(value) {
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(value, "utf8");
  }

  return new TextEncoder().encode(value).length;
}
