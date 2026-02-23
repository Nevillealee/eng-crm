import { ENGINEER_SKILL_OPTIONS } from "../constants/engineer-skills";

export const engineerSkillOptions = ENGINEER_SKILL_OPTIONS;

export const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "partially_allocated", label: "Partially allocated" },
  { value: "unavailable", label: "Unavailable" },
];

export const skillOptionSet = new Set(ENGINEER_SKILL_OPTIONS);

export async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function emptyHoliday() {
  return { label: "", startDate: "", endDate: "" };
}

export function nextDateInputValue(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map((item) => Number.parseInt(item, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}
