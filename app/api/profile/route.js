import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { recordProfileChangeAudits } from "./audit";
import { getProfilePatchValidationError, parseProfilePatchInput } from "./patch-input";
import { profileAuditSelect, profileSelect } from "./selectors";
import { toProfileDto } from "./shared";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Profile retrieval failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load profile right now. Please try again later." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
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

    const city = patchInput.hasCityUpdate ? patchInput.cityInput || null : previous.city || null;
    const resolvedFirstName = patchInput.firstNameUpdate.hasUpdate
      ? patchInput.firstNameUpdate.value
      : previous.firstName || null;
    const resolvedLastName = patchInput.lastNameUpdate.hasUpdate
      ? patchInput.lastNameUpdate.value
      : previous.lastName || null;
    const resolvedName =
      `${resolvedFirstName || ""} ${resolvedLastName || ""}`.trim() || null;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: patchInput.firstNameUpdate.hasUpdate
          ? patchInput.firstNameUpdate.value
          : undefined,
        lastName: patchInput.lastNameUpdate.hasUpdate
          ? patchInput.lastNameUpdate.value
          : undefined,
        name:
          patchInput.firstNameUpdate.hasUpdate || patchInput.lastNameUpdate.hasUpdate
            ? resolvedName
            : undefined,
        city,
        skills: patchInput.skills,
        availabilityStatus: patchInput.availabilityStatus,
        availabilityNote: patchInput.availabilityNote || null,
        upcomingHolidays: patchInput.upcomingHolidays,
        onboardingCompleted: patchInput.hasOnboardingCompletedUpdate
          ? patchInput.onboardingCompleted
          : undefined,
        onboardingStep: patchInput.requestedOnboardingStep ?? undefined,
        image: patchInput.avatarUpdate.hasAvatarUpdate ? patchInput.avatarUpdate.avatarUrl : undefined,
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
  } catch (error) {
    console.error("Profile update failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save profile right now. Please try again later." },
      { status: 500 }
    );
  }
}
