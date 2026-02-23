import {
  allowedProjectStatuses,
  parseCostPhpInput,
  parseCurrencyCodeInput,
  parseDateInput,
  parseTeamMemberIds,
} from "../shared";
import { PROJECT_CURRENCY_CODE_SET } from "../../../constants/project-currencies";

function hasOwnProperty(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

export function parseProjectPatchInput(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : undefined;
  const status = typeof body?.status === "string" ? body.status : undefined;
  const hasCostPhp = hasOwnProperty(body, "costPhp");
  const costPhp = hasCostPhp ? parseCostPhpInput(body?.costPhp) : undefined;
  const hasCurrencyCode = hasOwnProperty(body, "currencyCode");
  const currencyCode = hasCurrencyCode
    ? parseCurrencyCodeInput(body?.currencyCode, PROJECT_CURRENCY_CODE_SET)
    : undefined;
  const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim() : undefined;
  const hasStartDate = hasOwnProperty(body, "startDate");
  const hasEndDate = hasOwnProperty(body, "endDate");
  const startDate = hasStartDate ? parseDateInput(body?.startDate) : undefined;
  const endDate =
    hasEndDate && body?.endDate ? parseDateInput(body.endDate) : hasEndDate ? null : undefined;
  const teamMemberIds = Array.isArray(body?.teamMemberIds)
    ? parseTeamMemberIds(body.teamMemberIds)
    : undefined;

  return {
    body,
    name,
    clientName,
    status,
    hasCostPhp,
    costPhp,
    hasCurrencyCode,
    currencyCode,
    adminNotes,
    hasStartDate,
    hasEndDate,
    startDate,
    endDate,
    teamMemberIds,
  };
}

export function getProjectPatchValidationError(input) {
  if (typeof input.status !== "undefined" && !allowedProjectStatuses.has(input.status)) {
    return "Invalid project status.";
  }

  if (input.hasCostPhp && input.costPhp === null) {
    return "Project cost must be a non-negative whole number.";
  }

  if (input.hasCurrencyCode && input.currencyCode === null) {
    return "Invalid currency code.";
  }

  if (input.hasStartDate && !input.startDate) {
    return "Invalid start date.";
  }

  if (input.hasEndDate && input.body?.endDate && !input.endDate) {
    return "Invalid end date.";
  }

  return "";
}

export function toProjectUpdateData(input) {
  return {
    name: typeof input.name === "undefined" ? undefined : input.name.slice(0, 200),
    clientName:
      typeof input.clientName === "undefined" ? undefined : input.clientName.slice(0, 200),
    costPhp: input.costPhp,
    currencyCode: input.currencyCode,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    adminNotes:
      typeof input.adminNotes === "undefined"
        ? undefined
        : input.adminNotes
        ? input.adminNotes.slice(0, 5000)
        : null,
  };
}
