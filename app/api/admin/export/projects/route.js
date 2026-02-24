import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { toCsvContent } from "../../../../../lib/csv";

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  return value.toISOString();
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
      },
    });

    const headers = [
      "id",
      "name",
      "clientName",
      "status",
      "cost",
      "currencyCode",
      "startDate",
      "endDate",
      "teamMembers",
      "teamMemberIds",
      "adminNotes",
      "createdAt",
      "updatedAt",
    ];

    const rows = projects.map((project) => {
      const members = (project.memberships || []).map((membership) => membership.user);
      const memberNames = members.map((member) => {
        return (
          member.name ||
          `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
          member.email
        );
      });
      const memberIds = members.map((member) => member.id);

      return [
        project.id,
        project.name,
        project.clientName,
        project.status,
        project.costPhp,
        project.currencyCode,
        formatDateTime(project.startDate),
        formatDateTime(project.endDate),
        memberNames.join(" | "),
        memberIds.join(" | "),
        project.adminNotes || "",
        formatDateTime(project.createdAt),
        formatDateTime(project.updatedAt),
      ];
    });

    const content = toCsvContent(headers, rows);
    const filename = `projects-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Project export failed.", error);
    return NextResponse.json(
      { ok: false, error: "Export is temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
