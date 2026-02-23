import {
  emptyHoliday,
  skillOptionSet,
} from "../profile-form-shared";
import { MAX_ONBOARDING_STEP, MIN_ONBOARDING_STEP } from "./constants";

export function clampOnboardingStep(value) {
  return Math.min(Math.max(value, MIN_ONBOARDING_STEP), MAX_ONBOARDING_STEP);
}

export function createOnboardingForm() {
  return {
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  };
}

export function normalizeOnboardingProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  const holidays = Array.isArray(source.upcomingHolidays) ? source.upcomingHolidays : [];

  return {
    skills: Array.isArray(source.skills)
      ? source.skills.filter((skill) => skillOptionSet.has(skill))
      : [],
    availabilityStatus: source.availabilityStatus || "available",
    availabilityNote: source.availabilityNote || "",
    upcomingHolidays: holidays.length ? holidays : [emptyHoliday()],
  };
}

export async function fetchOnboardingProfilePayload() {
  const response = await fetch("/api/profile");
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load onboarding data.");
  }

  return payload;
}

export async function persistOnboardingProfile(form, nextStep, complete) {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: form.skills,
      availabilityStatus: form.availabilityStatus,
      availabilityNote: form.availabilityNote,
      upcomingHolidays: form.upcomingHolidays.filter(
        (item) => item.label || item.startDate || item.endDate
      ),
      onboardingStep: nextStep,
      onboardingCompleted: complete,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to save onboarding data.");
  }
}
