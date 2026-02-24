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

/**
 * Hashes a verification token using SHA-256.
 *
 * @param {string} token
 * @returns {string}
 */
export function hashVerificationToken(token) {
  if (typeof token !== "string" || !token) {
    return "";
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a raw verification token with its hashed form and expiration date.
 *
 * @returns {{ rawToken: string, tokenHash: string, expiresAt: Date }}
 */
export function createVerificationTokenRecord() {
  const rawToken = crypto.randomUUID();
  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + DEFAULT_VERIFICATION_TOKEN_TTL_MS),
  };
}

/**
 * Resolves the public app origin used for building links in emails.
 *
 * @returns {string}
 */
export function resolveAppBaseUrl() {
  const configuredBaseUrl =
    normalizeBaseUrl(process.env.APP_URL) ||
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    DEFAULT_APP_URL;

  return configuredBaseUrl;
}

/**
 * Builds the verification URL containing the provided token in the hash fragment.
 *
 * @param {string} token
 * @returns {string}
 */
export function buildVerificationUrl(token) {
  const params = new URLSearchParams({ token });
  return `${resolveAppBaseUrl()}/verify-email#${params.toString()}`;
}
