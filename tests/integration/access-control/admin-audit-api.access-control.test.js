const { readJson } = require("../../helpers/http");

describe("Given admin audit log endpoint", () => {
  it("When no session is present, then GET /api/admin/audit-logs returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { adminAuditLog: { findMany: jest.fn() }, project: { findMany: jest.fn() }, user: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/audit-logs/route.js");
    const response = await GET(new Request("http://localhost/api/admin/audit-logs?limit=10"));
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("When a non-admin requests audit logs, then GET /api/admin/audit-logs returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: { adminAuditLog: { findMany: jest.fn() }, project: { findMany: jest.fn() }, user: { findMany: jest.fn() } },
    }));

    const { GET } = await import("../../../app/api/admin/audit-logs/route.js");
    const response = await GET(new Request("http://localhost/api/admin/audit-logs?limit=10"));
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin requests audit logs, then GET /api/admin/audit-logs succeeds", async () => {
    jest.resetModules();

    const prismaMock = {
      adminAuditLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "log-1",
            action: "project.created",
            targetType: "project",
            targetId: "proj-1",
            actorUserId: "admin-1",
            actorEmail: "admin@example.com",
            summary: "Created project Phoenix.",
            metadata: { name: "Phoenix" },
            createdAt: new Date("2026-02-01T10:00:00.000Z"),
          },
        ]),
      },
      project: {
        findMany: jest.fn().mockResolvedValue([{ id: "proj-1", name: "Phoenix" }]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
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

    const { GET } = await import("../../../app/api/admin/audit-logs/route.js");
    const response = await GET(new Request("http://localhost/api/admin/audit-logs?limit=10"));
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "log-1",
          targetValue: "Phoenix",
        }),
      ])
    );
  });
});
