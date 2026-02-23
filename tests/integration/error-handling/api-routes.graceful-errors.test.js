const { jsonRequest, readJson } = require("../../helpers/http");

describe("Given graceful API error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("When forgot password processing throws, then the endpoint returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: {
          findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")),
          update: jest.fn(),
        },
      },
    }));
    jest.doMock("../../../app/actions/sendEmail", () => ({
      sendForgotPasswordEmail: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/forgot-password/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/forgot-password", "POST", { email: "user@example.com" })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to process forgot password request right now. Please try again later.",
    });
  });

  it("When resend verification processing throws, then the endpoint returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: { findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")) },
        verificationToken: { deleteMany: jest.fn(), create: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/email-verification", () => ({
      buildVerificationUrl: jest.fn(() => "http://localhost:3000/verify-email#token=test"),
      createVerificationTokenRecord: jest.fn(() => ({
        rawToken: "raw-token",
        tokenHash: "token-hash",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    }));
    jest.doMock("../../../app/actions/sendEmail", () => ({
      sendVerificationEmail: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/resend-verification/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/resend-verification", "POST", {
        email: "user@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to resend verification email right now. Please try again later.",
    });
  });

  it("When email verification processing throws, then the endpoint returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../lib/email-verification", () => ({
      hashVerificationToken: jest.fn(() => "hashed-token"),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        verificationToken: {
          findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")),
          delete: jest.fn(),
        },
        user: { updateMany: jest.fn() },
      },
    }));

    const { POST } = await import("../../../app/api/verify-email/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/verify-email", "POST", { token: "token-value" })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to verify email right now. Please try again later.",
    });
  });

  it("When project listing throws, then GET /api/projects returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-1", role: "admin", email: "admin@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findMany: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { GET } = await import("../../../app/api/projects/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to load projects right now. Please try again later.",
    });
  });

  it("When project creation throws, then POST /api/projects returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-1", role: "admin", email: "admin@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: { findMany: jest.fn().mockResolvedValue([]) },
        project: { create: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/projects/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "Project Alpha",
        clientName: "Client Alpha",
        startDate: "2026-05-01",
        status: "ongoing",
        costPhp: "10000",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to create project right now. Please try again later.",
    });
  });

  it("When engineer listing throws, then GET /api/admin/engineers returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-2", role: "admin", email: "admin2@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: { findMany: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
    }));

    const { GET } = await import("../../../app/api/admin/engineers/route.js");
    const response = await GET();
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to load engineers right now. Please try again later.",
    });
  });

  it("When audit log loading throws, then GET /api/admin/audit-logs returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-3", role: "admin", email: "admin3@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        adminAuditLog: {
          findMany: jest.fn().mockRejectedValue(new Error("db unavailable")),
        },
        project: { findMany: jest.fn() },
        user: { findMany: jest.fn() },
      },
    }));

    const { GET } = await import("../../../app/api/admin/audit-logs/route.js");
    const response = await GET(new Request("http://localhost/api/admin/audit-logs?limit=10"));
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to load audit logs right now. Please try again later.",
    });
  });

  it("When engineer CSV export throws, then GET /api/admin/export/engineers returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-4", role: "admin", email: "admin4@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: { findMany: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
    }));

    const { GET } = await import("../../../app/api/admin/export/engineers/route.js");
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toBe("Export is temporarily unavailable. Please try again later.");
  });

  it("When project CSV export throws, then GET /api/admin/export/projects returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-5", role: "admin", email: "admin5@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findMany: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
    }));

    const { GET } = await import("../../../app/api/admin/export/projects/route.js");
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toBe("Export is temporarily unavailable. Please try again later.");
  });

  it("When profile loading throws, then GET /api/profile returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: { findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")) },
      },
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

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to load profile right now. Please try again later.",
    });
  });

  it("When profile saving throws, then PATCH /api/profile returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-2", role: "engineer", email: "eng2@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: {
          findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")),
          update: jest.fn(),
        },
      },
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
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to save profile right now. Please try again later.",
    });
  });

  it("When signup processing throws unexpectedly, then POST /api/signup returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("bcryptjs", () => ({
      hash: jest.fn().mockRejectedValue(new Error("hash failure")),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        verificationToken: { deleteMany: jest.fn(), create: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/email-verification", () => ({
      buildVerificationUrl: jest.fn(() => "http://localhost:3000/verify-email#token=test-token"),
      createVerificationTokenRecord: jest.fn(() => ({
        rawToken: "raw-token",
        tokenHash: "hashed-token",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    }));
    jest.doMock("../../../app/actions/sendEmail", () => ({
      sendVerificationEmail: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/signup/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/signup", "POST", {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Sign-up is temporarily unavailable. Please try again in a few minutes.",
    });
  });

  it("When project updates throw unexpectedly, then PATCH /api/projects/[projectId] returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-6", role: "admin", email: "admin6@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: {
          findUnique: jest.fn().mockResolvedValue({
            id: "proj-1",
            name: "Project One",
            clientName: "Client One",
            status: "ongoing",
            costPhp: 1000,
            currencyCode: "PHP",
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            endDate: null,
            adminNotes: null,
            memberships: [],
          }),
        },
        user: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn().mockRejectedValue(new Error("transaction failure")),
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { PATCH } = await import("../../../app/api/projects/[projectId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/projects/proj-1", "PATCH", {
        status: "completed",
      }),
      { params: Promise.resolve({ projectId: "proj-1" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to update project right now. Please try again later.",
    });
  });

  it("When project deletion throws unexpectedly, then DELETE /api/projects/[projectId] returns a safe server error", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-7", role: "admin", email: "admin7@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: {
          findUnique: jest.fn().mockRejectedValue(new Error("db unavailable")),
          delete: jest.fn(),
        },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { DELETE } = await import("../../../app/api/projects/[projectId]/route.js");
    const response = await DELETE(new Request("http://localhost/api/projects/proj-1"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to delete project right now. Please try again later.",
    });
  });
});
