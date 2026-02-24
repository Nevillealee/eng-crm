import {
  allowedProjectStatuses,
  parseCostPhpInput,
  parseCurrencyCodeInput,
  parseDateInput,
  parseTeamMemberIds,
} from "../shared";
import { PROJECT_CURRENCY_CODE_SET } from "../../../constants/project-currencies";
import {
  PROJECT_ADMIN_NOTES_MAX_LENGTH,
  PROJECT_CLIENT_NAME_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "../../../constants/text-limits";

function hasOwnProperty(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

export function parseProjectPatchInput(body) {
  const source = body && typeof body === "object" ? body : {};
  const hasName = hasOwnProperty(source, "name");
  const hasClientName = hasOwnProperty(source, "clientName");
  const hasStatus = hasOwnProperty(source, "status");
  const hasAdminNotes = hasOwnProperty(source, "adminNotes");

  const name = hasName && typeof source.name === "string" ? source.name.trim() : undefined;
  const clientName =
    hasClientName && typeof source.clientName === "string" ? source.clientName.trim() : undefined;
  const status = hasStatus && typeof source.status === "string" ? source.status : undefined;
  const hasCostPhp = hasOwnProperty(source, "costPhp");
  const costPhp = hasCostPhp ? parseCostPhpInput(source.costPhp) : undefined;
  const hasCurrencyCode = hasOwnProperty(source, "currencyCode");
  const currencyCode = hasCurrencyCode
    ? parseCurrencyCodeInput(source.currencyCode, PROJECT_CURRENCY_CODE_SET)
    : undefined;
  const adminNotes =
    hasAdminNotes && typeof source.adminNotes === "string" ? source.adminNotes.trim() : undefined;
  const hasStartDate = hasOwnProperty(source, "startDate");
  const hasEndDate = hasOwnProperty(source, "endDate");
  const startDate = hasStartDate ? parseDateInput(source.startDate) : undefined;
  const hasEndDateValue = hasEndDate && !!source.endDate;
  const endDate =
    hasEndDateValue ? parseDateInput(source.endDate) : hasEndDate ? null : undefined;
  const hasTeamMemberIds = Array.isArray(source.teamMemberIds);
  const teamMemberIds = hasTeamMemberIds ? parseTeamMemberIds(source.teamMemberIds) : undefined;

  return {
    hasName,
    hasClientName,
    hasStatus,
    hasAdminNotes,
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
    hasEndDateValue,
    startDate,
    endDate,
    hasTeamMemberIds,
    teamMemberIds,
  };
}

export function getProjectPatchValidationError(input) {
  if (typeof input.status === "string" && !allowedProjectStatuses.has(input.status)) {
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

  if (input.hasEndDateValue && !input.endDate) {
    return "Invalid end date.";
  }

  return "";
}

export function toProjectUpdateData(input) {
  const name = typeof input.name === "string" ? input.name.slice(0, PROJECT_NAME_MAX_LENGTH) : undefined;
  const clientName =
    typeof input.clientName === "string"
      ? input.clientName.slice(0, PROJECT_CLIENT_NAME_MAX_LENGTH)
      : undefined;
  const adminNotes =
    typeof input.adminNotes === "string"
      ? input.adminNotes
        ? input.adminNotes.slice(0, PROJECT_ADMIN_NOTES_MAX_LENGTH)
        : null
      : undefined;

  return {
    name: input.hasName ? name : undefined,
    clientName: input.hasClientName ? clientName : undefined,
    costPhp: input.costPhp,
    currencyCode: input.currencyCode,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    adminNotes: input.hasAdminNotes ? adminNotes : undefined,
  };
}
