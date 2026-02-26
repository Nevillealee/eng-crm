const { jsonRequest, readJson } = require("../../tests/helpers/http");

describe("engineer CRUD integration checks", () => {
  it("lists engineers and updates engineer compensation as admin", async () => {
    jest.resetModules();
    const recordAdminAuditMock = jest.fn();
    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "eng-10",
            email: "eng10@example.com",
            firstName: "Alex",
            lastName: "Dev",
            name: "Alex Dev",
            image: "https://res.cloudinary.com/demo/image/upload/alex-dev.png",
            city: "Manila",
            skills: ["JavaScript"],
            availabilityStatus: "available",
            availabilityNote: "",
            upcomingHolidays: [],
            lastLogin: null,
            lastLoginIp: null,
            monthlySalaryPhp: 40000,
            salaryNotes: "",
            onboardingCompleted: true,
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-10",
          email: "eng10@example.com",
          isAdmin: false,
          monthlySalaryPhp: 40000,
          salaryNotes: "",
        }),
        update: jest.fn().mockResolvedValue({
          id: "eng-10",
          email: "eng10@example.com",
          monthlySalaryPhp: 50000,
          salaryNotes: "Promoted",
          updatedAt: new Date(),
        }),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-3", role: "admin", email: "admin3@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: recordAdminAuditMock,
    }));

    const { GET } = await import("../../app/api/admin/engineers/route.js");
    const { PATCH } = await import("../../app/api/admin/engineers/[engineerId]/route.js");

    let response = await GET();
    let payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.engineers).toHaveLength(1);
    expect(payload.engineers[0].image).toBe(
      "https://res.cloudinary.com/demo/image/upload/alex-dev.png"
    );

    response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-10", "PATCH", {
        monthlySalaryPhp: "50000",
        salaryNotes: "Promoted",
      }),
      { params: Promise.resolve({ engineerId: "eng-10" }) }
    );
    payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.engineer).toEqual(
      expect.objectContaining({
        id: "eng-10",
        monthlySalaryPhp: 50000,
        salaryNotes: "Promoted",
      })
    );
    expect(recordAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "engineer.compensation.updated",
        actorUserId: "admin-3",
      })
    );
  });
});
