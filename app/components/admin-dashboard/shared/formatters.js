import { availabilityOptions } from "./constants";

export function availabilityLabel(value) {
  return availabilityOptions.find((option) => option.value === value)?.label || "Unknown";
}

export function formatAuditTimestamp(value) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}
