const { jsonRequest, readJson } = require("../../helpers/http");

describe("Given profile API access control", () => {
  it("When profile is requested without a session, then GET /api/profile returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findUnique: jest.fn() } },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const { GET } = await import("../../../app/api/profile/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("When profile updates are submitted without a session, then PATCH /api/profile returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findUnique: jest.fn(), update: jest.fn() } },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const { PATCH } = await import("../../../app/api/profile/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/profile", "PATCH", {
        skills: ["JavaScript"],
        availabilityStatus: "available",
        upcomingHolidays: [],
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });
});
