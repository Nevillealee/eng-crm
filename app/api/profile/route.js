import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordAdminAudit } from "../../../lib/admin-audit";
import { extractRequestIp } from "../../../lib/request-ip";

const require = createRequire(import.meta.url);
let geoipLookupInstance;

const allowedAvailability = new Set([
  "available",
  "partially_allocated",
  "unavailable",
]);
const maxOnboardingStep = 3;

function parseSkills(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);

  return [...new Set(normalized)];
}

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseHolidays(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = [];

  for (const item of value.slice(0, 20)) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const label = typeof item.label === "string" ? item.label.trim() : "";
    const startDate = item.startDate;
    const endDate = item.endDate;

    if (!label || !isValidDateString(startDate) || !isValidDateString(endDate)) {
      return null;
    }

    if (new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`)) {
      return null;
    }

    parsed.push({
      label: label.slice(0, 120),
      startDate,
      endDate,
    });
  }

  return parsed;
}

function normalizeSkillsForCompare(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...value].filter((item) => typeof item === "string").sort((a, b) => a.localeCompare(b));
}

function normalizeHolidaysForCompare(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...value]
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      startDate: typeof item.startDate === "string" ? item.startDate : "",
      endDate: typeof item.endDate === "string" ? item.endDate : "",
    }))
    .sort((left, right) => {
      if (left.startDate !== right.startDate) {
        return left.startDate.localeCompare(right.startDate);
      }
      if (left.endDate !== right.endDate) {
        return left.endDate.localeCompare(right.endDate);
      }
      return left.label.localeCompare(right.label);
    });
}

function stringifyForCompare(value) {
  return JSON.stringify(value);
}

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

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      city: true,
      skills: true,
      availabilityStatus: true,
      availabilityNote: true,
      upcomingHolidays: true,
      onboardingCompleted: true,
      onboardingStep: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile: user });
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
  const onboardingCompleted = body?.onboardingCompleted === true;
  const requestedOnboardingStep = Number.isInteger(body?.onboardingStep)
    ? body.onboardingStep
    : null;

  if (skills === null) {
    return NextResponse.json(
      { ok: false, error: "Skills must be provided as an array of strings." },
      { status: 400 }
    );
  }

  if (!allowedAvailability.has(availabilityStatus || "")) {
    return NextResponse.json(
      { ok: false, error: "Invalid availability status." },
      { status: 400 }
    );
  }

  if (upcomingHolidays === null) {
    return NextResponse.json(
      { ok: false, error: "Upcoming holidays must be a valid list of date ranges." },
      { status: 400 }
    );
  }

  if (
    requestedOnboardingStep !== null &&
    (requestedOnboardingStep < 1 || requestedOnboardingStep > maxOnboardingStep)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid onboarding step." },
      { status: 400 }
    );
  }

  if (onboardingCompleted && skills.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Add at least one skill before finishing onboarding.",
      },
      { status: 400 }
    );
  }

  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      skills: true,
      availabilityStatus: true,
      availabilityNote: true,
      upcomingHolidays: true,
    },
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
      onboardingCompleted,
      onboardingStep: requestedOnboardingStep || undefined,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      city: true,
      skills: true,
      availabilityStatus: true,
      availabilityNote: true,
      upcomingHolidays: true,
      onboardingCompleted: true,
      onboardingStep: true,
      isAdmin: true,
    },
  });

  if (!updated.isAdmin) {
    const previousSkills = normalizeSkillsForCompare(previous.skills);
    const updatedSkills = normalizeSkillsForCompare(updated.skills);
    const previousHolidays = normalizeHolidaysForCompare(previous.upcomingHolidays);
    const updatedHolidays = normalizeHolidaysForCompare(updated.upcomingHolidays);
    const availabilityChanged =
      previous.availabilityStatus !== updated.availabilityStatus ||
      (previous.availabilityNote || "") !== (updated.availabilityNote || "");
    const skillsChanged =
      stringifyForCompare(previousSkills) !== stringifyForCompare(updatedSkills);
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

  return NextResponse.json({ ok: true, profile: updated });
}
