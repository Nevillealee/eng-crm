import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { recordAdminAudit } from "../../../../../lib/admin-audit";
import {
  ENGINEER_SALARY_NOTES_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
} from "../../../../constants/text-limits";

function parseMonthlySalaryPhp(value) {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export async function PATCH(request, { params }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const { engineerId } = await params;
  if (!engineerId) {
    return NextResponse.json({ ok: false, error: "Engineer not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const input = body && typeof body === "object" ? body : {};
  const hasLocationInput = typeof input.location === "string";
  const hasCityUpdate = hasLocationInput || typeof input.city === "string";
  const rawLocationValue = hasLocationInput ? input.location : input.city;
  const city = hasCityUpdate
    ? rawLocationValue.trim().slice(0, PROFILE_CITY_MAX_LENGTH)
    : undefined;
  const hasMonthlySalaryPhp = Object.prototype.hasOwnProperty.call(input, "monthlySalaryPhp");
  const hasSalaryNotes = typeof input.salaryNotes === "string";
  const monthlySalaryPhp = hasMonthlySalaryPhp
    ? parseMonthlySalaryPhp(input.monthlySalaryPhp)
    : undefined;
  const salaryNotes = hasSalaryNotes
    ? input.salaryNotes.trim().slice(0, ENGINEER_SALARY_NOTES_MAX_LENGTH)
    : undefined;

  if (
    hasMonthlySalaryPhp &&
    monthlySalaryPhp === null &&
    input.monthlySalaryPhp !== null &&
    input.monthlySalaryPhp !== ""
  ) {
    return NextResponse.json(
      { ok: false, error: "Monthly salary must be a non-negative whole number." },
      { status: 400 }
    );
  }

  const previousEngineer = await prisma.user.findUnique({
    where: { id: engineerId },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      city: true,
      monthlySalaryPhp: true,
      salaryNotes: true,
    },
  });

  if (!previousEngineer || previousEngineer.isAdmin) {
    return NextResponse.json({ ok: false, error: "Engineer not found." }, { status: 404 });
  }

  const updateData = {
    monthlySalaryPhp,
    salaryNotes: hasSalaryNotes ? salaryNotes || null : undefined,
  };
  if (hasCityUpdate) {
    updateData.city = city || null;
  }

  const engineer = await prisma.user.update({
    where: { id: engineerId },
    data: updateData,
    select: {
      id: true,
      email: true,
      city: true,
      monthlySalaryPhp: true,
      salaryNotes: true,
      updatedAt: true,
    },
  });

  const cityChanged = (previousEngineer.city || "") !== (engineer.city || "");
  const salaryChanged = previousEngineer.monthlySalaryPhp !== engineer.monthlySalaryPhp;
  const notesChanged = (previousEngineer.salaryNotes || "") !== (engineer.salaryNotes || "");

  if (cityChanged || salaryChanged || notesChanged) {
    await recordAdminAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "engineer.compensation.updated",
      targetType: "user",
      targetId: engineer.email,
      summary: `Updated engineer details for ${engineer.email}.`,
      metadata: {
        changedFields: {
          city: cityChanged,
          monthlySalaryPhp: salaryChanged,
          salaryNotes: notesChanged,
        },
        before: {
          city: previousEngineer.city || null,
          monthlySalaryPhp: previousEngineer.monthlySalaryPhp,
          salaryNotes: previousEngineer.salaryNotes || null,
        },
        after: {
          city: engineer.city || null,
          monthlySalaryPhp: engineer.monthlySalaryPhp,
          salaryNotes: engineer.salaryNotes || null,
        },
      },
    });
  }

  return NextResponse.json({ ok: true, engineer });
}
