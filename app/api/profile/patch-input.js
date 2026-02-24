import { allowedAvailability, maxOnboardingStep, parseAvatarUpdate, parseHolidays, parseSkills } from "./shared";
import {
  PROFILE_AVAILABILITY_NOTE_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
} from "../../constants/text-limits";

export function parseProfilePatchInput(body) {
  const source = body && typeof body === "object" ? body : {};
  const hasCityUpdate = typeof source.city === "string";
  const cityInput = hasCityUpdate
    ? source.city.trim().slice(0, PROFILE_CITY_MAX_LENGTH)
    : undefined;
  const skills = parseSkills(source.skills);
  const availabilityStatus =
    typeof source.availabilityStatus === "string" ? source.availabilityStatus : null;
  const availabilityNote =
    typeof source.availabilityNote === "string"
      ? source.availabilityNote.trim().slice(0, PROFILE_AVAILABILITY_NOTE_MAX_LENGTH)
      : null;
  const upcomingHolidays = parseHolidays(source.upcomingHolidays);
  const hasOnboardingCompletedUpdate = typeof source.onboardingCompleted === "boolean";
  const onboardingCompleted = hasOnboardingCompletedUpdate ? source.onboardingCompleted : undefined;
  const requestedOnboardingStep = Number.isInteger(source.onboardingStep) ? source.onboardingStep : null;
  const avatarUpdate = parseAvatarUpdate(source.avatar, source.avatarType);

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

export function deriveUpdatedCity(hasCityUpdate, cityInput, derivedCity, previousCity) {
  if (hasCityUpdate) {
    return cityInput || null;
  }

  return derivedCity || previousCity || null;
}
