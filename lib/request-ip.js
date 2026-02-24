import { isIP } from "node:net";

function normalizeIp(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  let value = rawValue.trim();
  if (!value || value.toLowerCase() === "unknown") {
    return null;
  }

  if (value.toLowerCase().startsWith("for=")) {
    value = value.slice(4);
  }

  value = value.replace(/^"|"$/g, "");

  if (value.startsWith("[")) {
    const endBracket = value.indexOf("]");
    if (endBracket > 1) {
      value = value.slice(1, endBracket);
    }
  } else {
    const maybeIpv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (maybeIpv4WithPort) {
      value = maybeIpv4WithPort[1];
    }
  }

  if (value.startsWith("::ffff:") && isIP(value.slice(7)) === 4) {
    value = value.slice(7);
  }

  return isIP(value) ? value : null;
}

function parseForwardedForHeader(value) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => normalizeIp(item))
    .filter(Boolean);
}

function parseForwardedHeader(value) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const parsed = [];
  for (const record of value.split(",")) {
    for (const part of record.split(";")) {
      const token = part.trim();
      if (!token.toLowerCase().startsWith("for=")) {
        continue;
      }
      const normalized = normalizeIp(token.slice(4));
      if (normalized) {
        parsed.push(normalized);
      }
    }
  }

  return parsed;
}

function isLoopbackIp(value) {
  return (
    value === "::1" ||
    value === "0:0:0:0:0:0:0:1" ||
    value === "127.0.0.1" ||
    value.startsWith("127.")
  );
}

function isPrivateIpv4(value) {
  const octets = value.split(".").map((item) => Number.parseInt(item, 10));
  if (octets.length !== 4 || octets.some((item) => Number.isNaN(item) || item < 0 || item > 255)) {
    return false;
  }

  const [first, second] = octets;

  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 100 && second >= 64 && second <= 127) return true;
  if (first === 0) return true;

  return false;
}

function isPrivateIpv6(value) {
  const normalized = value.toLowerCase();

  if (normalized === "::" || normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  // Unique local addresses: fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  // Link-local unicast: fe80::/10
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // Documentation range: 2001:db8::/32
  if (normalized.startsWith("2001:db8")) {
    return true;
  }

  return false;
}

function isPublicIp(value) {
  const version = isIP(value);
  if (version === 4) {
    return !isPrivateIpv4(value);
  }
  if (version === 6) {
    return !isPrivateIpv6(value);
  }
  return false;
}

/**
 * Extracts the most reliable client IP from proxy/CDN headers.
 *
 * Preference order:
 * 1) public IP candidates
 * 2) non-loopback private candidates
 * 3) null if no valid candidate exists
 *
 * @param {{ headers?: { get?: (name: string) => string | null } } | null | undefined} request
 * @returns {string | null}
 */
export function extractRequestIp(request) {
  if (!request || !request.headers || typeof request.headers.get !== "function") {
    return null;
  }

  const candidates = [
    normalizeIp(request.headers.get("cf-connecting-ip")),
    normalizeIp(request.headers.get("true-client-ip")),
    normalizeIp(request.headers.get("x-real-ip")),
    normalizeIp(request.headers.get("x-client-ip")),
    ...parseForwardedForHeader(request.headers.get("x-forwarded-for")),
    ...parseForwardedForHeader(request.headers.get("x-vercel-forwarded-for")),
    ...parseForwardedHeader(request.headers.get("forwarded")),
  ].filter(Boolean);

  const publicCandidate = candidates.find((ip) => isPublicIp(ip));
  if (publicCandidate) {
    return publicCandidate;
  }

  const nonLoopbackCandidate = candidates.find((ip) => !isLoopbackIp(ip));
  if (nonLoopbackCandidate) {
    return nonLoopbackCandidate;
  }

  return null;
}
