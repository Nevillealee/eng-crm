const { jsonRequest, readJson } = require("../helpers/http");

describe("access control and onboarding integration checks", () => {
  it("blocks unauthorized profile reads", async () => {
    jest.resetModules();

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findUnique: jest.fn() } },
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const { GET } = await import("../../app/api/profile/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("enforces onboarding skill requirement before completion", async () => {
    jest.resetModules();
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const { PATCH } = await import("../../app/api/profile/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/profile", "PATCH", {
        skills: [],
        availabilityStatus: "available",
        availabilityNote: "",
        upcomingHolidays: [],
        onboardingCompleted: true,
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Add at least one skill before finishing onboarding.",
    });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("persists onboarding step updates for valid onboarding wizard submissions", async () => {
    jest.resetModules();
    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-11",
          email: "eng11@example.com",
          isAdmin: false,
          city: "Manila",
          skills: ["JavaScript"],
          availabilityStatus: "available",
          availabilityNote: "",
          upcomingHolidays: [],
        }),
        update: jest.fn().mockResolvedValue({
          id: "eng-11",
          email: "eng11@example.com",
          firstName: "Eng",
          lastName: "User",
          image: null,
          avatar: null,
          avatarMimeType: null,
          city: "Manila",
          skills: ["JavaScript"],
          availabilityStatus: "available",
          availabilityNote: "",
          upcomingHolidays: [],
          onboardingCompleted: false,
          onboardingStep: 2,
          isAdmin: false,
        }),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-11", role: "engineer" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const { PATCH } = await import("../../app/api/profile/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/profile", "PATCH", {
        skills: ["JavaScript"],
        availabilityStatus: "available",
        availabilityNote: "",
        upcomingHolidays: [],
        onboardingCompleted: false,
        onboardingStep: 2,
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.profile).toEqual(
      expect.objectContaining({
        onboardingCompleted: false,
        onboardingStep: 2,
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "eng-11" },
        data: expect.objectContaining({
          onboardingStep: 2,
          onboardingCompleted: false,
        }),
      })
    );
  });

  it("blocks unauthorized and non-admin project mutations", async () => {
    jest.resetModules();
    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { project: { findMany: jest.fn(), create: jest.fn() }, user: { findMany: jest.fn() } },
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    let { GET, POST } = await import("../../app/api/projects/route.js");
    let response = await GET();
    let payload = await readJson(response);
    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized.");

    jest.resetModules();
    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-2", role: "engineer", email: "eng@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { project: { findMany: jest.fn(), create: jest.fn() }, user: { findMany: jest.fn() } },
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    ({ POST } = await import("../../app/api/projects/route.js"));
    response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "New Project",
        clientName: "Client",
        startDate: "2026-01-01",
        costPhp: "1000",
      })
    );
    payload = await readJson(response);
    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden.");
  });

  it("blocks unauthorized and non-admin engineer admin APIs", async () => {
    jest.resetModules();
    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findMany: jest.fn() } },
    }));
    let { GET } = await import("../../app/api/admin/engineers/route.js");
    let response = await GET();
    let payload = await readJson(response);
    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized.");

    jest.resetModules();
    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-3", role: "engineer", email: "eng3@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findMany: jest.fn() } },
    }));
    ({ GET } = await import("../../app/api/admin/engineers/route.js"));
    response = await GET();
    payload = await readJson(response);
    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden.");

    jest.resetModules();
    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-4", role: "engineer", email: "eng4@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findUnique: jest.fn(), update: jest.fn() } },
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    const { PATCH } = await import("../../app/api/admin/engineers/[engineerId]/route.js");
    response = await PATCH(
      jsonRequest("http://localhost/api/admin/engineers/eng-9", "PATCH", {
        monthlySalaryPhp: 10000,
      }),
      { params: Promise.resolve({ engineerId: "eng-9" }) }
    );
    payload = await readJson(response);
    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden.");
  });
});
