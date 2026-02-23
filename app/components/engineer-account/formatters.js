export function formatDateLabel(value) {
  if (!value) {
    return "TBD";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
