import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }

    const engineers = await prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        image: true,
        city: true,
        skills: true,
        availabilityStatus: true,
        availabilityNote: true,
        upcomingHolidays: true,
        lastLogin: true,
        lastLoginIp: true,
        monthlySalaryPhp: true,
        salaryNotes: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ ok: true, engineers });
  } catch (error) {
    console.error("Engineer list retrieval failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load engineers right now. Please try again later." },
      { status: 500 }
    );
  }
}
