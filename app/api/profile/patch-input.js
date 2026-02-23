import { allowedAvailability, maxOnboardingStep, parseAvatarUpdate, parseHolidays, parseSkills } from "./shared";

export function parseProfilePatchInput(body) {
  const hasCityUpdate = typeof body?.city === "string";
  const cityInput = hasCityUpdate ? body.city.trim().slice(0, 120) : undefined;
  const skills = parseSkills(body?.skills);
  const availabilityStatus =
    typeof body?.availabilityStatus === "string" ? body.availabilityStatus : null;
  const availabilityNote =
    typeof body?.availabilityNote === "string" ? body.availabilityNote.trim().slice(0, 500) : null;
  const upcomingHolidays = parseHolidays(body?.upcomingHolidays);
  const hasOnboardingCompletedUpdate = typeof body?.onboardingCompleted === "boolean";
  const onboardingCompleted = hasOnboardingCompletedUpdate ? body.onboardingCompleted : undefined;
  const requestedOnboardingStep = Number.isInteger(body?.onboardingStep) ? body.onboardingStep : null;
  const avatarUpdate = parseAvatarUpdate(body?.avatar, body?.avatarType);

  return {
    hasCityUpdate,
    cityInput,
    skills,
    availabilityStatus,
    availabilityNote,
    upcomingHolidays,
    hasOnboardingCompletedUpdate,
    onboardingCompleted,
    requestedOnboardingStep,
    avatarUpdate,
  };
}

export function getProfilePatchValidationError({
  skills,
  availabilityStatus,
  upcomingHolidays,
  requestedOnboardingStep,
  onboardingCompleted,
  avatarUpdate,
}) {
  if (skills === null) {
    return "Skills must be provided as an array of strings.";
  }

  if (!allowedAvailability.has(availabilityStatus || "")) {
    return "Invalid availability status.";
  }

  if (upcomingHolidays === null) {
    return "Upcoming holidays must be a valid list of date ranges.";
  }

  if (
    requestedOnboardingStep !== null &&
    (requestedOnboardingStep < 1 || requestedOnboardingStep > maxOnboardingStep)
  ) {
    return "Invalid onboarding step.";
  }

  if (onboardingCompleted && skills.length === 0) {
    return "Add at least one skill before finishing onboarding.";
  }

  return avatarUpdate.error || "";
}

export function deriveUpdatedCity(cityInput, derivedCity, previousCity) {
  if (typeof cityInput !== "undefined") {
    return cityInput || null;
  }

  return derivedCity || previousCity || null;
}
