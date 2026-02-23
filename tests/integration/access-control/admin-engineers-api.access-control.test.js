const { jsonRequest, readJson } = require("../../helpers/http");

describe("Given admin engineer management endpoints", () => {
  it("When no session is present, then GET /api/admin/engineers returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/engineers/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("When a non-admin requests engineers, then GET /api/admin/engineers returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-3", role: "engineer", email: "eng3@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/engineers/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin requests engineers, then GET /api/admin/engineers succeeds", async () => {
    jest.resetModules();

    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "eng-7",
            email: "eng7@example.com",
            firstName: "Eng",
            lastName: "Seven",
            name: "Eng Seven",
            image: null,
            avatar: null,
            avatarMimeType: null,
            city: "Cebu",
            skills: ["JavaScript"],
            availabilityStatus: "available",
            availabilityNote: "",
            upcomingHolidays: [],
            lastLogin: null,
            lastLoginIp: null,
            monthlySalaryPhp: null,
            salaryNotes: null,
            onboardingCompleted: true,
          },
        ]),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-1", role: "admin", email: "admin@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));

    const { GET } = await import("../../../app/api/admin/engineers/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.engineers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "eng-7", email: "eng7@example.com" }),
      ])
    );
  });

  it("When a non-admin updates engineer compensation, then PATCH /api/admin/engineers/[engineerId] returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-9", role: "engineer", email: "eng9@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findUnique: jest.fn(), update: jest.fn() } },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { PATCH } = await import("../../../app/api/admin/engineers/[engineerId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-9", "PATCH", {
        monthlySalaryPhp: "100000",
      }),
      { params: Promise.resolve({ engineerId: "eng-9" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin updates engineer compensation, then PATCH /api/admin/engineers/[engineerId] succeeds", async () => {
    jest.resetModules();

    const auditMock = jest.fn();
    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-10",
          email: "eng10@example.com",
          isAdmin: false,
          monthlySalaryPhp: 90000,
          salaryNotes: "legacy",
        }),
        update: jest.fn().mockResolvedValue({
          id: "eng-10",
          email: "eng10@example.com",
          monthlySalaryPhp: 100000,
          salaryNotes: "market adjustment",
          updatedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-2", role: "admin", email: "admin2@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: auditMock,
    }));

    const { PATCH } = await import("../../../app/api/admin/engineers/[engineerId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-10", "PATCH", {
        monthlySalaryPhp: "100000",
        salaryNotes: "market adjustment",
      }),
      { params: Promise.resolve({ engineerId: "eng-10" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.engineer).toEqual(
      expect.objectContaining({ id: "eng-10", monthlySalaryPhp: 100000 })
    );
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "engineer.compensation.updated",
        actorUserId: "admin-2",
      })
    );
  });
});
