const { jsonRequest, readJson } = require("../helpers/http");

function buildTaskRecord(data, overrides = {}) {
  return {
    id: overrides.id || "task-1",
    projectId: data.projectId,
    parentTaskId: data.parentTaskId ?? null,
    name: data.name,
    assigneeId: data.assigneeId,
    assignedById: data.assignedById,
    createdByUserId: data.createdByUserId,
    completedAt: data.completedAt ?? null,
    completedById: data.completedById ?? null,
    completed: data.completed,
    dueOn: data.dueOn ?? null,
    notes: data.notes ?? null,
    resourceType: "task",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    project: {
      id: data.projectId,
      name: "Phoenix",
      clientName: "Client Inc",
      status: "ongoing",
      memberships: [{ userId: data.assigneeId }],
    },
    assignee: {
      id: data.assigneeId,
      email: "eng2@example.com",
      firstName: "Eng",
      lastName: "Two",
      name: "Eng Two",
    },
    assignedBy: {
      id: data.assignedById,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
    },
    createdByUser: {
      id: data.createdByUserId,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
    },
    completedBy: data.completedById
      ? {
          id: data.completedById,
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          name: "Admin User",
        }
      : null,
    parentTask: data.parentTaskId
      ? {
          id: data.parentTaskId,
          projectId: data.projectId,
          name: "Parent task",
        }
      : null,
    ...overrides,
  };
}

describe("Given task form persistence", () => {
  it("When create-task form payload is submitted, then POST /api/tasks persists task fields", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: "proj-1",
          memberships: [{ userId: "eng-1" }, { userId: "eng-2" }],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "eng-2", isAdmin: false }),
      },
      task: {
        findUnique: jest.fn().mockResolvedValue({ id: "task-parent", projectId: "proj-1" }),
        create: jest.fn().mockImplementation(async ({ data }) => buildTaskRecord(data)),
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
      recordAdminAudit,
    }));

    const payloadBody = {
      projectId: "proj-1",
      name: "Approve QA checklist",
      assigneeId: "eng-2",
      dueOn: "2026-04-25",
      notes: "Review before client handoff.",
      parentTaskId: "task-parent",
      completed: true,
    };

    const { POST } = await import("../../app/api/tasks/route.js");
    const response = await POST(jsonRequest("http://localhost/api/tasks", "POST", payloadBody));
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);

    const createCall = prismaMock.task.create.mock.calls[0][0];
    expect(createCall.data).toEqual(
      expect.objectContaining({
        projectId: "proj-1",
        name: "Approve QA checklist",
        assigneeId: "eng-2",
        assignedById: "admin-1",
        createdByUserId: "admin-1",
        notes: "Review before client handoff.",
        parentTaskId: "task-parent",
        completed: true,
        completedById: "admin-1",
        resourceType: "task",
      })
    );
    expect(createCall.data.dueOn).toBeInstanceOf(Date);
    expect(createCall.data.dueOn.toISOString()).toBe("2026-04-25T00:00:00.000Z");
    expect(createCall.data.completedAt).toBeInstanceOf(Date);

    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "task.created", actorUserId: "admin-1" })
    );
  });

  it("When edit-task form payload is submitted, then PATCH /api/tasks/[taskId] persists updated task fields", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const existingTask = buildTaskRecord({
      projectId: "proj-1",
      parentTaskId: null,
      name: "Prepare release notes",
      assigneeId: "eng-1",
      assignedById: "admin-1",
      createdByUserId: "admin-1",
      completedAt: null,
      completedById: null,
      completed: false,
      dueOn: new Date("2026-05-10T00:00:00.000Z"),
      notes: "Need final screenshots.",
    });
    const updatedTask = buildTaskRecord(
      {
        projectId: "proj-1",
        parentTaskId: null,
        name: "Prepare final release notes",
        assigneeId: "eng-1",
        assignedById: "admin-1",
        createdByUserId: "admin-1",
        completedAt: new Date("2026-05-08T00:00:00.000Z"),
        completedById: "admin-1",
        completed: true,
        dueOn: new Date("2026-05-12T00:00:00.000Z"),
        notes: "Screenshots included.",
      },
      { id: "task-5" }
    );

    const prismaMock = {
      task: {
        findFirst: jest.fn().mockResolvedValue({ ...existingTask, id: "task-5" }),
        update: jest.fn().mockResolvedValue(updatedTask),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "eng-1", isAdmin: false }),
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
      recordAdminAudit,
    }));

    const payloadBody = {
      name: "Prepare final release notes",
      dueOn: "2026-05-12",
      notes: "Screenshots included.",
      completed: true,
    };

    const { PATCH } = await import("../../app/api/tasks/[taskId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/tasks/task-5", "PATCH", payloadBody),
      { params: Promise.resolve({ taskId: "task-5" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    const updateCall = prismaMock.task.update.mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: "task-5" });
    expect(updateCall.data).toEqual(
      expect.objectContaining({
        name: "Prepare final release notes",
        notes: "Screenshots included.",
        completed: true,
        completedById: "admin-1",
      })
    );
    expect(updateCall.data.dueOn).toBeInstanceOf(Date);
    expect(updateCall.data.dueOn.toISOString()).toBe("2026-05-12T00:00:00.000Z");
    expect(updateCall.data.completedAt).toBeInstanceOf(Date);

    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: "admin-1" })
    );
  });
});
