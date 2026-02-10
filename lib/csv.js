function normalizeCsvValue(value) {
  if (value === null || typeof value === "undefined") {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function escapeCsvField(value) {
  const normalized = normalizeCsvValue(value);
  if (!normalized) {
    return "";
  }

  if (/["\n,\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export function toCsvContent(headers, rows) {
  const head = headers.map((header) => escapeCsvField(header)).join(",");
  const body = rows
    .map((row) => row.map((field) => escapeCsvField(field)).join(","))
    .join("\n");

  return `${head}\n${body}`;
}

