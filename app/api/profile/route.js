import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordProfileChangeAudits } from "./audit";
import { deriveCityFromIp } from "./geoip";
import {
  deriveUpdatedCity,
  getProfilePatchValidationError,
  parseProfilePatchInput,
} from "./patch-input";
import { profileAuditSelect, profileSelect } from "./selectors";
import { toProfileDto } from "./shared";

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
  const patchInput = parseProfilePatchInput(body);
  const validationError = getProfilePatchValidationError(patchInput);

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
  const city = deriveUpdatedCity(patchInput.cityInput, derivedCity, previous.city);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      city,
      skills: patchInput.skills,
      availabilityStatus: patchInput.availabilityStatus,
      availabilityNote: patchInput.availabilityNote || null,
      upcomingHolidays: patchInput.upcomingHolidays,
      onboardingCompleted: patchInput.hasOnboardingCompletedUpdate
        ? patchInput.onboardingCompleted
        : undefined,
      onboardingStep: patchInput.requestedOnboardingStep || undefined,
      avatar: patchInput.avatarUpdate.hasAvatarUpdate
        ? patchInput.avatarUpdate.avatarBuffer
        : undefined,
      avatarMimeType: patchInput.avatarUpdate.hasAvatarUpdate
        ? patchInput.avatarUpdate.avatarMimeType
        : undefined,
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
