const { jsonRequest, readJson } = require("../helpers/http");

describe("Given personal information form persistence", () => {
  it("When the admin personal information form payload is submitted, then city, avatar, and profile fields persist", async () => {
    jest.resetModules();

    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "admin-1",
          email: "admin@example.com",
          isAdmin: true,
          city: "Manila",
          skills: ["JavaScript"],
          availabilityStatus: "available",
          availabilityNote: "",
          upcomingHolidays: [],
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: "admin-1",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          image: data.image,
          city: data.city,
          skills: data.skills,
          availabilityStatus: data.availabilityStatus,
          availabilityNote: data.availabilityNote,
          upcomingHolidays: data.upcomingHolidays,
          onboardingCompleted: true,
          onboardingStep: 3,
          isAdmin: true,
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
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const avatar = "https://res.cloudinary.com/demo/image/upload/admin-avatar.png";
    const payloadBody = {
      city: "Cebu",
      skills: ["JavaScript", "React"],
      availabilityStatus: "partially_allocated",
      availabilityNote: "Available for one project",
      upcomingHolidays: [
        {
          label: "Family trip",
          startDate: "2026-06-01",
          endDate: "2026-06-03",
        },
      ],
      avatar,
    };

    const { PATCH } = await import("../../app/api/profile/route.js");
    const response = await PATCH(jsonRequest("http://localhost/api/profile", "PATCH", payloadBody));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.profile).toEqual(
      expect.objectContaining({
        city: "Cebu",
        availabilityStatus: "partially_allocated",
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "admin-1" },
        data: expect.objectContaining({
          city: "Cebu",
          skills: ["JavaScript", "React"],
          availabilityStatus: "partially_allocated",
          availabilityNote: "Available for one project",
          upcomingHolidays: [
            {
              label: "Family trip",
              startDate: "2026-06-01",
              endDate: "2026-06-03",
            },
          ],
        }),
      })
    );

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data.image).toBe(avatar);
  });

  it("When the admin personal information form payload removes avatar, then avatar data is cleared", async () => {
    jest.resetModules();

    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "admin-1",
          email: "admin@example.com",
          isAdmin: true,
          city: "Manila",
          skills: ["JavaScript"],
          availabilityStatus: "available",
          availabilityNote: "",
          upcomingHolidays: [],
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: "admin-1",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          image: data.image,
          city: data.city,
          skills: data.skills,
          availabilityStatus: data.availabilityStatus,
          availabilityNote: data.availabilityNote,
          upcomingHolidays: data.upcomingHolidays,
          onboardingCompleted: true,
          onboardingStep: 3,
          isAdmin: true,
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
      recordAdminAudit: jest.fn(),
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const payloadBody = {
      city: "Cebu",
      skills: ["JavaScript"],
      availabilityStatus: "available",
      availabilityNote: "Ready for assignments",
      upcomingHolidays: [
        {
          label: "Admin break",
          startDate: "2026-08-12",
          endDate: "2026-08-13",
        },
      ],
      avatar: null,
    };

    const { PATCH } = await import("../../app/api/profile/route.js");
    const response = await PATCH(jsonRequest("http://localhost/api/profile", "PATCH", payloadBody));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data.image).toBeNull();
  });

  it("When the engineer account personal form payload omits city, then existing city is preserved", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "eng-1",
          email: "eng1@example.com",
          isAdmin: false,
          city: "Manila",
          skills: ["JavaScript"],
          availabilityStatus: "available",
          availabilityNote: "",
          upcomingHolidays: [],
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: "eng-1",
          email: "eng1@example.com",
          firstName: "Eng",
          lastName: "User",
          image: data.image,
          city: data.city,
          skills: data.skills,
          availabilityStatus: data.availabilityStatus,
          availabilityNote: data.availabilityNote,
          upcomingHolidays: data.upcomingHolidays,
          onboardingCompleted: true,
          onboardingStep: 3,
          isAdmin: false,
        })),
      },
    };

    jest.doMock("../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/admin-audit", () => ({
      recordAdminAudit,
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: jest.fn(() => null),
    }));

    const avatar = "https://res.cloudinary.com/demo/image/upload/engineer-avatar.png";
    const payloadBody = {
      skills: ["Node.js", "React"],
      availabilityStatus: "available",
      availabilityNote: "Open to new work",
      upcomingHolidays: [
        {
          label: "Break",
          startDate: "2026-07-01",
          endDate: "2026-07-02",
        },
      ],
      avatar,
    };

    const { PATCH } = await import("../../app/api/profile/route.js");
    const response = await PATCH(jsonRequest("http://localhost/api/profile", "PATCH", payloadBody));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data).toEqual(
      expect.objectContaining({
        city: "Manila",
        skills: ["Node.js", "React"],
        availabilityStatus: "available",
        availabilityNote: "Open to new work",
        upcomingHolidays: [
          {
            label: "Break",
            startDate: "2026-07-01",
            endDate: "2026-07-02",
          },
        ],
        image: avatar,
      })
    );

    expect(recordAdminAudit).toHaveBeenCalled();
  });
});
