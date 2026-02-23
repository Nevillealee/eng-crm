import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { toCsvContent } from "../../../../../lib/csv";

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  return value.toISOString();
}

function formatHolidays(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      const label = typeof item?.label === "string" ? item.label.trim() : "";
      const startDate = typeof item?.startDate === "string" ? item.startDate : "";
      const endDate = typeof item?.endDate === "string" ? item.endDate : "";
      if (!label && !startDate && !endDate) {
        return "";
      }
      return `${label}: ${startDate} - ${endDate}`.trim();
    })
    .filter(Boolean)
    .join(" | ");
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 401 });
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
        onboardingStep: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const headers = [
      "id",
      "email",
      "firstName",
      "lastName",
      "name",
      "city",
      "skills",
      "availabilityStatus",
      "availabilityNote",
      "upcomingHolidays",
      "lastLogin",
      "lastLoginIp",
      "monthlySalaryPhp",
      "salaryNotes",
      "onboardingCompleted",
      "onboardingStep",
      "createdAt",
      "updatedAt",
    ];

    const rows = engineers.map((engineer) => [
      engineer.id,
      engineer.email,
      engineer.firstName || "",
      engineer.lastName || "",
      engineer.name || "",
      engineer.city || "",
      Array.isArray(engineer.skills) ? engineer.skills.join(" | ") : "",
      engineer.availabilityStatus || "",
      engineer.availabilityNote || "",
      formatHolidays(engineer.upcomingHolidays),
      formatDateTime(engineer.lastLogin),
      engineer.lastLoginIp || "",
      typeof engineer.monthlySalaryPhp === "number" ? engineer.monthlySalaryPhp : "",
      engineer.salaryNotes || "",
      engineer.onboardingCompleted ? "true" : "false",
      engineer.onboardingStep,
      formatDateTime(engineer.createdAt),
      formatDateTime(engineer.updatedAt),
    ]);

    const content = toCsvContent(headers, rows);
    const filename = `engineers-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Engineer export failed.", error);
    return new Response("Export is temporarily unavailable. Please try again later.", {
      status: 500,
    });
  }
}
