import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordAdminAudit } from "../../../lib/admin-audit";
import { extractRequestIp } from "../../../lib/request-ip";
import {
  allowedAvailability,
  maxOnboardingStep,
  normalizeHolidaysForCompare,
  normalizeSkillsForCompare,
  parseAvatarUpdate,
  parseHolidays,
  parseSkills,
  stringifyForCompare,
  toProfileDto,
} from "./shared";

const require = createRequire(import.meta.url);
let geoipLookupInstance;

const profileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  image: true,
  avatar: true,
  avatarMimeType: true,
  city: true,
  skills: true,
  availabilityStatus: true,
  availabilityNote: true,
  upcomingHolidays: true,
  onboardingCompleted: true,
  onboardingStep: true,
  isAdmin: true,
};

const profileAuditSelect = {
  id: true,
  email: true,
  isAdmin: true,
  city: true,
  skills: true,
  availabilityStatus: true,
  availabilityNote: true,
  upcomingHolidays: true,
};

function deriveCityFromIp(request) {
  const ip = extractRequestIp(request);
  if (!ip) {
    return null;
  }

  if (!geoipLookupInstance) {
    try {
      geoipLookupInstance = require("geoip-lite");
    } catch {
      return null;
    }
  }

  const location = geoipLookupInstance.lookup(ip);
  if (!location) {
    return null;
  }

  const city = typeof location.city === "string" ? location.city.trim() : "";
  if (city) {
    return city.slice(0, 120);
  }

  const region = typeof location.region === "string" ? location.region.trim() : "";
  const country = typeof location.country === "string" ? location.country.trim() : "";
  const fallback = [region, country].filter(Boolean).join(", ");
  return fallback ? fallback.slice(0, 120) : null;
}

function getPatchValidationError({
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

async function recordProfileChangeAudits(previous, updated) {
  const previousSkills = normalizeSkillsForCompare(previous.skills);
  const updatedSkills = normalizeSkillsForCompare(updated.skills);
  const previousHolidays = normalizeHolidaysForCompare(previous.upcomingHolidays);
  const updatedHolidays = normalizeHolidaysForCompare(updated.upcomingHolidays);
  const availabilityChanged =
    previous.availabilityStatus !== updated.availabilityStatus ||
    (previous.availabilityNote || "") !== (updated.availabilityNote || "");
  const skillsChanged = stringifyForCompare(previousSkills) !== stringifyForCompare(updatedSkills);
  const holidaysChanged =
    stringifyForCompare(previousHolidays) !== stringifyForCompare(updatedHolidays);

  if (availabilityChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.availability.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated availability.`,
      metadata: {
        before: {
          availabilityStatus: previous.availabilityStatus || null,
          availabilityNote: previous.availabilityNote || null,
        },
        after: {
          availabilityStatus: updated.availabilityStatus || null,
          availabilityNote: updated.availabilityNote || null,
        },
      },
    });
  }

  if (skillsChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.skills.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated skills.`,
      metadata: {
        before: previousSkills,
        after: updatedSkills,
      },
    });
  }

  if (holidaysChanged) {
    await recordAdminAudit({
      actorUserId: updated.id,
      actorEmail: updated.email,
      action: "engineer.holidays.updated",
      targetType: "user",
      targetId: updated.email,
      summary: `Engineer ${updated.email} updated holidays.`,
      metadata: {
        before: previousHolidays,
        after: updatedHolidays,
      },
    });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: toProfileDto(user),
  });
}

export async function PATCH(request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const skills = parseSkills(body?.skills);
  const availabilityStatus =
    typeof body?.availabilityStatus === "string" ? body.availabilityStatus : null;
  const availabilityNote =
    typeof body?.availabilityNote === "string"
      ? body.availabilityNote.trim().slice(0, 500)
      : null;
  const upcomingHolidays = parseHolidays(body?.upcomingHolidays);
  const hasOnboardingCompletedUpdate = typeof body?.onboardingCompleted === "boolean";
  const onboardingCompleted = hasOnboardingCompletedUpdate ? body.onboardingCompleted : undefined;
  const requestedOnboardingStep = Number.isInteger(body?.onboardingStep)
    ? body.onboardingStep
    : null;
  const avatarUpdate = parseAvatarUpdate(body?.avatar, body?.avatarType);

  const validationError = getPatchValidationError({
    skills,
    availabilityStatus,
    upcomingHolidays,
    requestedOnboardingStep,
    onboardingCompleted,
    avatarUpdate,
  });

  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileAuditSelect,
  });

  if (!previous) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const derivedCity = deriveCityFromIp(request);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      city: derivedCity || previous.city || null,
      skills,
      availabilityStatus,
      availabilityNote: availabilityNote || null,
      upcomingHolidays,
      onboardingCompleted: hasOnboardingCompletedUpdate ? onboardingCompleted : undefined,
      onboardingStep: requestedOnboardingStep || undefined,
      avatar: avatarUpdate.hasAvatarUpdate ? avatarUpdate.avatarBuffer : undefined,
      avatarMimeType: avatarUpdate.hasAvatarUpdate ? avatarUpdate.avatarMimeType : undefined,
    },
    select: profileSelect,
  });

  if (!updated.isAdmin) {
    await recordProfileChangeAudits(previous, updated);
  }

  return NextResponse.json({
    ok: true,
    profile: toProfileDto(updated),
  });
}
