const { jsonRequest, readJson } = require("../../helpers/http");

function buildTaskRecord(overrides = {}) {
  return {
    id: "task-1",
    projectId: "proj-1",
    parentTaskId: null,
    name: "Ship dashboard",
    assigneeId: "eng-1",
    assignedById: "admin-1",
    createdByUserId: "admin-1",
    completedAt: null,
    completedById: null,
    completed: false,
    dueOn: new Date("2026-03-21T00:00:00.000Z"),
    notes: "Focus on the filter state.",
    resourceType: "task",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    project: {
      id: "proj-1",
      name: "Phoenix",
      clientName: "Client Inc",
      status: "ongoing",
      memberships: [{ userId: "eng-1" }],
    },
    assignee: {
      id: "eng-1",
      email: "eng1@example.com",
      firstName: "Eng",
      lastName: "One",
      name: "Eng One",
    },
    assignedBy: {
      id: "admin-1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
    },
    createdByUser: {
      id: "admin-1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
    },
    completedBy: null,
    parentTask: null,
    ...overrides,
  };
}

describe("Given task API access control", () => {
  it("When creating a task without a session, then POST /api/tasks returns unauthorized", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        task: { create: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/tasks/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        projectId: "proj-1",
        name: "Write docs",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Unauthorized." });
  });

  it("When an engineer creates a self-assigned task on their project, then POST /api/tasks succeeds", async () => {
    jest.resetModules();

    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: "proj-1",
          memberships: [{ userId: "eng-1" }],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "eng-1", isAdmin: false }),
      },
      task: {
        create: jest.fn().mockResolvedValue(
          buildTaskRecord({
            assigneeId: "eng-1",
            assignedById: "eng-1",
            createdByUserId: "eng-1",
            assignedBy: {
              id: "eng-1",
              email: "eng1@example.com",
              firstName: "Eng",
              lastName: "One",
              name: "Eng One",
            },
            createdByUser: {
              id: "eng-1",
              email: "eng1@example.com",
              firstName: "Eng",
              lastName: "One",
              name: "Eng One",
            },
          })
        ),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/tasks/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        projectId: "proj-1",
        name: "Write docs",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.task).toEqual(expect.objectContaining({ assignee: "eng-1", projectId: "proj-1" }));
  });

  it("When an engineer tries to assign a task to someone else, then POST /api/tasks returns forbidden", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        task: { create: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/tasks/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        projectId: "proj-1",
        name: "Write docs",
        assigneeId: "eng-2",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(403);
    expect(payload).toEqual({
      ok: false,
      error: "Engineers can only assign tasks to themselves.",
    });
  });

  it("When an admin creates a task, then POST /api/tasks succeeds and records audit data", async () => {
    jest.resetModules();

    const auditMock = jest.fn();
    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: "proj-1",
          memberships: [{ userId: "eng-1" }],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "eng-1", isAdmin: false }),
      },
      task: {
        create: jest.fn().mockResolvedValue(buildTaskRecord()),
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

    const { POST } = await import("../../../app/api/tasks/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        projectId: "proj-1",
        name: "Ship dashboard",
        assigneeId: "eng-1",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "task.created",
        actorUserId: "admin-1",
      })
    );
  });

  it("When legacy approvalStatus is sent to PATCH /api/tasks/[taskId], then it is rejected", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        task: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { PATCH } = await import("../../../app/api/tasks/[taskId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/tasks/task-1", "PATCH", { approvalStatus: "approved" }),
      { params: Promise.resolve({ taskId: "task-1" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Field approvalStatus has been removed.",
    });
  });

  it("When legacy approval_status is sent to POST /api/tasks, then it is rejected", async () => {
    jest.resetModules();

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "admin-1", role: "admin", email: "admin@example.com" },
      }),
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: {
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        task: { create: jest.fn() },
      },
    }));
    jest.doMock("../../../lib/admin-audit", () => ({
      recordAdminAudit: jest.fn(),
    }));

    const { POST } = await import("../../../app/api/tasks/route.js");
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        projectId: "proj-1",
        name: "Ship dashboard",
        approval_status: "approved",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Field approval_status has been removed.",
    });
  });
});
