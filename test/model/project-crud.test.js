const { jsonRequest, readJson } = require("../../tests/helpers/http");

describe("project CRUD integration checks", () => {
  it("creates a project as admin and records audit entry", async () => {
    jest.resetModules();
    const recordAdminAuditMock = jest.fn();
    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: "eng-1" }]),
      },
      project: {
        create: jest.fn().mockResolvedValue({
          id: "proj-1",
          name: "Website Revamp",
          clientName: "Acme Corp",
          costPhp: 150000,
          currencyCode: "PHP",
          status: "ongoing",
          startDate: new Date("2026-01-10T00:00:00.000Z"),
          endDate: null,
          adminNotes: "Priority project",
          memberships: [
            {
              userId: "eng-1",
              user: {
                id: "eng-1",
                email: "eng1@example.com",
                firstName: "A",
                lastName: "B",
                name: "A B",
              },
            },
          ],
        }),
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
      recordAdminAudit: recordAdminAuditMock,
    }));

    const { POST } = await import("../../app/api/projects/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/projects", "POST", {
        name: "Website Revamp",
        clientName: "Acme Corp",
        status: "ongoing",
        costPhp: "150000",
        currencyCode: "PHP",
        startDate: "2026-01-10",
        endDate: null,
        adminNotes: "Priority project",
        teamMemberIds: ["eng-1"],
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.project).toEqual(
      expect.objectContaining({
        id: "proj-1",
        name: "Website Revamp",
        clientName: "Acme Corp",
      })
    );
    expect(recordAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "project.created",
        actorUserId: "admin-1",
      })
    );
  });

  it("updates and deletes projects as admin", async () => {
    jest.resetModules();
    const recordAdminAuditMock = jest.fn();
    const txMock = {
      project: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          id: "proj-2",
          name: "Updated Project",
          clientName: "Client A",
          costPhp: 1000,
          currencyCode: "PHP",
          status: "ongoing",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: null,
          adminNotes: null,
          memberships: [],
        }),
      },
      projectMembership: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: "proj-2",
          name: "Original Project",
          clientName: "Client A",
          costPhp: 1000,
          currencyCode: "PHP",
          status: "ongoing",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: null,
          adminNotes: null,
          memberships: [],
        }),
        delete: jest.fn().mockResolvedValue({ id: "proj-2", name: "Updated Project" }),
      },
      $transaction: jest.fn(async (callback) => callback(txMock)),
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
      recordAdminAudit: recordAdminAuditMock,
    }));

    const { PATCH, DELETE } = await import("../../app/api/projects/[projectId]/route.js");

    let response = await PATCH(
      jsonRequest("http://localhost/api/projects/proj-2", "PATCH", {
        name: "Updated Project",
      }),
      { params: Promise.resolve({ projectId: "proj-2" }) }
    );
    let payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.project.name).toBe("Updated Project");

    response = await DELETE(new Request("http://localhost/api/projects/proj-2", { method: "DELETE" }), {
      params: Promise.resolve({ projectId: "proj-2" }),
    });
    payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, deletedProjectId: "proj-2" });
    expect(recordAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "project.deleted",
        actorUserId: "admin-2",
      })
    );
  });
});
