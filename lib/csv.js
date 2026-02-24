function normalizeCsvValue(value) {
  if (value === null || value === undefined) {
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

function neutralizeCsvFormula(value) {
  if (!value) {
    return value;
  }

  const trimmed = value.trimStart();
  if (/^[=+\-@]/.test(trimmed) || /^[\t\r]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

/**
 * Escapes and hardens a single CSV field value.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvField(value) {
  const normalized = neutralizeCsvFormula(normalizeCsvValue(value));
  if (!normalized) {
    return "";
  }

  if (/["\n,\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

/**
 * Builds CSV content from header and row arrays.
 *
 * @param {unknown[]} headers
 * @param {unknown[][]} rows
 * @returns {string}
 */
export function toCsvContent(headers, rows) {
  const head = headers.map((header) => escapeCsvField(header)).join(",");
  const body = rows
    .map((row) => row.map((field) => escapeCsvField(field)).join(","))
    .join("\n");

  return `${head}\n${body}`;
}
