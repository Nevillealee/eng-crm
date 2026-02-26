const { jsonRequest, readJson } = require("../../helpers/http");

describe("Given onboarding profile updates", () => {
  it("When onboarding completion is requested without skills, then the request is rejected", async () => {
    jest.resetModules();
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
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

  it("When a valid onboarding step update is submitted, then the onboarding step is persisted", async () => {
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

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-11", role: "engineer" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
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
});
