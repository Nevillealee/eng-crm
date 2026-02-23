const { jsonRequest, readJson } = require("../../helpers/http");

describe("Given project admin actions", () => {
  it("When creating a project without a session, then POST /api/projects returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { create: jest.fn() },
        user: { findMany: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/projects/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "Phoenix",
        clientName: "Client Inc",
        startDate: "2026-01-01",
        costPhp: "1000",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("When a non-admin creates a project, then POST /api/projects returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-2", role: "engineer", email: "eng@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { create: jest.fn() },
        user: { findMany: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/projects/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "Phoenix",
        clientName: "Client Inc",
        startDate: "2026-01-01",
        costPhp: "1000",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin creates a project, then POST /api/projects succeeds", async () => {
    jest.resetModules();

    const auditMock = jest.fn();
    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: "eng-1" }]),
      },
      project: {
        create: jest.fn().mockResolvedValue({
          id: "proj-1",
          name: "Phoenix",
          clientName: "Client Inc",
          costPhp: 1000,
          currencyCode: "PHP",
          status: "ongoing",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: null,
          adminNotes: null,
          memberships: [
            {
              userId: "eng-1",
              user: {
                id: "eng-1",
                email: "eng1@example.com",
                firstName: "Eng",
                lastName: "One",
                name: "Eng One",
              },
            },
          ],
        }),
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
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: auditMock,
    }));

    const { POST } = await import("../../../app/api/projects/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "Phoenix",
        clientName: "Client Inc",
        startDate: "2026-01-01",
        costPhp: "1000",
        teamMemberIds: ["eng-1"],
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.project).toEqual(
      expect.objectContaining({
        id: "proj-1",
        name: "Phoenix",
      })
    );
    expect(prismaMock.project.create).toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "project.created",
        actorUserId: "admin-1",
      })
    );
  });

  it("When a non-admin updates a project, then PATCH /api/projects/[projectId] returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-3", role: "engineer", email: "eng3@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findUnique: jest.fn() },
        user: { findMany: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { PATCH } = await import("../../../app/api/projects/[projectId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/projects/proj-1", "PATCH", { status: "completed" }),
      { params: Promise.resolve({ projectId: "proj-1" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin updates a project, then PATCH /api/projects/[projectId] succeeds", async () => {
    jest.resetModules();

    const auditMock = jest.fn();
    const previousProject = {
      id: "proj-1",
      name: "Phoenix",
      clientName: "Client Inc",
      costPhp: 1000,
      currencyCode: "PHP",
      status: "ongoing",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: null,
      adminNotes: null,
      memberships: [{ userId: "eng-1" }],
    };

    const updatedProject = {
      ...previousProject,
      status: "completed",
      memberships: [
        {
          user: {
            id: "eng-1",
            email: "eng1@example.com",
            firstName: "Eng",
            lastName: "One",
            name: "Eng One",
          },
          userId: "eng-1",
        },
      ],
    };

    const prismaMock = {
      project: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(previousProject),
      },
      user: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => {
        const tx = {
          project: {
            update: jest.fn().mockResolvedValue(updatedProject),
            findUnique: jest.fn().mockResolvedValue(updatedProject),
          },
          projectMembership: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };

        return callback(tx);
      }),
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

    const { PATCH } = await import("../../../app/api/projects/[projectId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/projects/proj-1", "PATCH", { status: "completed" }),
      { params: Promise.resolve({ projectId: "proj-1" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.project).toEqual(
      expect.objectContaining({
        id: "proj-1",
        status: "completed",
      })
    );
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-2",
      })
    );
  });

  it("When a non-admin deletes a project, then DELETE /api/projects/[projectId] returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-5", role: "engineer", email: "eng5@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findUnique: jest.fn(), delete: jest.fn() },
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

    expect(response.status).toBe(403);
    expect(payload).toEqual({ ok: false, error: "Forbidden." });
  });

  it("When an admin deletes a project, then DELETE /api/projects/[projectId] succeeds", async () => {
    jest.resetModules();

    const auditMock = jest.fn();
    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue({ id: "proj-1", name: "Phoenix", status: "archived" }),
        delete: jest.fn().mockResolvedValue({ id: "proj-1", name: "Phoenix" }),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-3", role: "admin", email: "admin3@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: auditMock,
    }));

    const { DELETE } = await import("../../../app/api/projects/[projectId]/route.js");
    const response = await DELETE(new Request("http://localhost/api/projects/proj-1"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, deletedProjectId: "proj-1" });
    expect(prismaMock.project.delete).toHaveBeenCalledWith({ where: { id: "proj-1" } });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "project.deleted",
        actorUserId: "admin-3",
      })
    );
  });
});
