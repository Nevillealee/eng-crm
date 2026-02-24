export const allowedProjectStatuses = new Set(["ongoing", "completed", "archived"]);

export const projectMembershipInclude = {
  memberships: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  },
};

/**
 * Parses a date-like input into a Date instance.
 *
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseDateInput(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/**
 * Normalizes project membership rows into API team-member DTOs.
 *
 * @param {Array<{ user: { id: string, email: string, firstName?: string | null, lastName?: string | null, name?: string | null } }>} memberships
 * @returns {Array<{ id: string, firstName: string, lastName: string, name: string, email: string }>}
 */
export function formatTeamMembers(memberships) {
  return memberships.map((membership) => ({
    id: membership.user.id,
    firstName: membership.user.firstName || "",
    lastName: membership.user.lastName || "",
    name:
      membership.user.name ||
      `${membership.user.firstName || ""} ${membership.user.lastName || ""}`.trim() ||
      membership.user.email,
    email: membership.user.email,
  }));
}

/**
 * Converts a project record into the API response shape.
 *
 * @param {object} project
 * @param {boolean} [includeAdminNotes=false]
 * @returns {object}
 */
export function toProjectDto(project, includeAdminNotes = false) {
  return {
    id: project.id,
    name: project.name,
    clientName: project.clientName,
    costPhp: project.costPhp,
    currencyCode: project.currencyCode,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    adminNotes: includeAdminNotes ? project.adminNotes : undefined,
    teamMembers: formatTeamMembers(project.memberships || []),
  };
}

/**
 * Sanitizes incoming team member IDs for project assignment.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function parseTeamMemberIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => typeof item === "string"))].slice(0, 50);
}

/**
 * Parses project cost input as a non-negative whole number.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseCostPhpInput(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }

  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

/**
 * Parses and validates a project currency code.
 *
 * @param {unknown} value
 * @param {Set<string>} allowedCurrencyCodes
 * @returns {string | null}
 */
export function parseCurrencyCodeInput(value, allowedCurrencyCodes) {
  if (typeof value !== "string") {
    return null;
  }

  const code = value.trim().toUpperCase();
  if (!code || !allowedCurrencyCodes.has(code)) {
    return null;
  }

  return code;
}

/**
 * Detects Prisma "record not found" errors in route handlers.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isPrismaNotFoundError(error) {
  return typeof error === "object" && error !== null && error.code === "P2025";
}
