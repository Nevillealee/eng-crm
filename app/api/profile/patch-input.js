import { allowedAvailability, maxOnboardingStep, parseAvatarUpdate, parseHolidays, parseSkills } from "./shared";
import {
  PROFILE_AVAILABILITY_NOTE_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
} from "../../constants/text-limits";

function parseNameUpdate(value, fieldLabel) {
  if (value === undefined) {
    return { hasUpdate: false };
  }

  if (typeof value !== "string") {
    return { error: `${fieldLabel} must be a string.` };
  }

  const normalized = value.trim().slice(0, PROFILE_NAME_MAX_LENGTH);
  return { hasUpdate: true, value: normalized || null };
}

export function parseProfilePatchInput(body) {
  const source = body && typeof body === "object" ? body : {};
  const hasLocationInput = typeof source.location === "string";
  const hasCityUpdate = hasLocationInput || typeof source.city === "string";
  const rawLocationValue = hasLocationInput ? source.location : source.city;
  const cityInput = hasCityUpdate
    ? rawLocationValue.trim().slice(0, PROFILE_CITY_MAX_LENGTH)
    : undefined;
  const firstNameUpdate = parseNameUpdate(source.firstName, "First name");
  const lastNameUpdate = parseNameUpdate(source.lastName, "Last name");
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
  const avatarUpdate = parseAvatarUpdate(source.avatar);

  return {
    hasCityUpdate,
    cityInput,
    firstNameUpdate,
    lastNameUpdate,
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
  firstNameUpdate,
  lastNameUpdate,
  skills,
  availabilityStatus,
  upcomingHolidays,
  requestedOnboardingStep,
  onboardingCompleted,
  avatarUpdate,
}) {
  if (firstNameUpdate.error) {
    return firstNameUpdate.error;
  }

  if (lastNameUpdate.error) {
    return lastNameUpdate.error;
  }

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
