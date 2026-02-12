import crypto from "crypto";

const DEFAULT_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_APP_URL = "http://localhost:3000";

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export function hashVerificationToken(token) {
  if (typeof token !== "string" || !token) {
    return "";
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createVerificationTokenRecord() {
  const rawToken = crypto.randomUUID();
  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + DEFAULT_VERIFICATION_TOKEN_TTL_MS),
  };
}

export function resolveAppBaseUrl() {
  const configuredBaseUrl =
    normalizeBaseUrl(process.env.APP_URL) ||
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    DEFAULT_APP_URL;

  return configuredBaseUrl;
}

export function buildVerificationUrl(token) {
  const params = new URLSearchParams({ token });
  return `${resolveAppBaseUrl()}/verify-email#${params.toString()}`;
}
