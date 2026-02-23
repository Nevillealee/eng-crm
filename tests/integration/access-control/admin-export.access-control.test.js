describe("Given admin CSV export endpoints", () => {
  it("When no session exists, then GET /api/admin/export/engineers is unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { user: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/export/engineers/route.js");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("When no session exists, then GET /api/admin/export/projects is unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { project: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/export/projects/route.js");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("When an admin exports engineers, then CSV content is returned", async () => {
    jest.resetModules();

    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "eng-1",
            email: "eng1@example.com",
            firstName: "Eng",
            lastName: "One",
            name: "Eng One",
            city: "Manila",
            skills: ["JavaScript"],
            availabilityStatus: "available",
            availabilityNote: "",
            upcomingHolidays: [],
            lastLogin: null,
            lastLoginIp: null,
            monthlySalaryPhp: null,
            salaryNotes: null,
            onboardingCompleted: true,
            onboardingStep: 3,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-02-01T00:00:00.000Z"),
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

    const { GET } = await import("../../../app/api/admin/export/engineers/route.js");
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(text).toContain("email");
    expect(text).toContain("eng1@example.com");
  });

  it("When an admin exports projects, then CSV content is returned", async () => {
    jest.resetModules();

    const prismaMock = {
      project: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "proj-1",
            name: "Phoenix",
            clientName: "Client Inc",
            status: "ongoing",
            costPhp: 1000,
            currencyCode: "PHP",
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            endDate: null,
            adminNotes: "",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-02-01T00:00:00.000Z"),
            memberships: [
              {
                user: {
                  id: "eng-1",
                  email: "eng1@example.com",
                  firstName: "Eng",
                  lastName: "One",
                  name: "Eng One",
                },
              },
            ],
          },
        ]),
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

    const { GET } = await import("../../../app/api/admin/export/projects/route.js");
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(text).toContain("name");
    expect(text).toContain("Phoenix");
  });
});
