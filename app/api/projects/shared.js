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

export function parseTeamMemberIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => typeof item === "string"))].slice(0, 50);
}

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

export function isPrismaNotFoundError(error) {
  return typeof error === "object" && error !== null && error.code === "P2025";
}
