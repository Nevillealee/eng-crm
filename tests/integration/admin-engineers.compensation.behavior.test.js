const { jsonRequest, readJson } = require("../helpers/http");

describe("Given engineer compensation form persistence", () => {
  it("When compensation form payload has salary and notes, then PATCH persists parsed values", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-1",
          email: "eng1@example.com",
          isAdmin: false,
          city: "Manila",
          monthlySalaryPhp: 90000,
          salaryNotes: "legacy",
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: "eng-1",
          email: "eng1@example.com",
          city: data.city,
          monthlySalaryPhp: data.monthlySalaryPhp,
          salaryNotes: data.salaryNotes,
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        })),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-1", role: "admin", email: "admin@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit,
    }));

    const payloadBody = {
      city: "Cebu",
      monthlySalaryPhp: "120,000",
      salaryNotes: "  updated notes  ",
    };

    const { PATCH } = await import("../../app/api/admin/engineers/[engineerId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-1", "PATCH", payloadBody),
      { params: Promise.resolve({ engineerId: "eng-1" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "eng-1" },
        data: {
          city: "Cebu",
          monthlySalaryPhp: 120000,
          salaryNotes: "updated notes",
        },
      })
    );

    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "engineer.compensation.updated",
        actorUserId: "admin-1",
      })
    );
  });

  it("When compensation form payload clears salary and notes, then PATCH persists nulls", async () => {
    jest.resetModules();

    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-2",
          email: "eng2@example.com",
          isAdmin: false,
          monthlySalaryPhp: 100000,
          salaryNotes: "old",
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: "eng-2",
          email: "eng2@example.com",
          monthlySalaryPhp: data.monthlySalaryPhp,
          salaryNotes: data.salaryNotes,
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        })),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-2", role: "admin", email: "admin2@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { PATCH } = await import("../../app/api/admin/engineers/[engineerId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-2", "PATCH", {
        monthlySalaryPhp: "",
        salaryNotes: "",
      }),
      { params: Promise.resolve({ engineerId: "eng-2" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "eng-2" },
        data: {
          monthlySalaryPhp: null,
          salaryNotes: null,
        },
      })
    );
  });
});
