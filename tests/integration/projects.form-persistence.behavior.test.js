const { jsonRequest, readJson } = require("../helpers/http");

describe("Given project form persistence", () => {
  it("When create-project form payload is submitted, then POST /api/projects persists form fields", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const prismaMock = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: "eng-1" }, { id: "eng-2" }]),
      },
      project: {
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: "proj-1",
          name: data.name,
          clientName: data.clientName,
          costPhp: data.costPhp,
          currencyCode: data.currencyCode,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          adminNotes: data.adminNotes,
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
            {
              userId: "eng-2",
              user: {
                id: "eng-2",
                email: "eng2@example.com",
                firstName: "Eng",
                lastName: "Two",
                name: "Eng Two",
              },
            },
          ],
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
      recordAdminAudit,
    }));

    const payloadBody = {
      name: "Platform migration",
      clientName: "Client Inc",
      costPhp: "250000",
      currencyCode: "PHP",
      status: "ongoing",
      startDate: "2026-04-01",
      endDate: "2026-09-30",
      adminNotes: "Priority project",
      teamMemberIds: ["eng-1", "eng-2", "eng-999"],
    };

    const { POST } = await import("../../app/api/projects/route.js");
    const response = await POST(jsonRequest("http://localhost/api/projects", "POST", payloadBody));
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);

    const createCall = prismaMock.project.create.mock.calls[0][0];
    expect(createCall.data).toEqual(
      expect.objectContaining({
        name: "Platform migration",
        clientName: "Client Inc",
        costPhp: 250000,
        currencyCode: "PHP",
        status: "ongoing",
        adminNotes: "Priority project",
      })
    );
    expect(createCall.data.startDate).toBeInstanceOf(Date);
    expect(createCall.data.startDate.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(createCall.data.endDate).toBeInstanceOf(Date);
    expect(createCall.data.endDate.toISOString()).toBe("2026-09-30T00:00:00.000Z");
    expect(createCall.data.memberships).toEqual({
      createMany: {
        data: [{ userId: "eng-1" }, { userId: "eng-2" }],
      },
    });

    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "project.created", actorUserId: "admin-1" })
    );
  });

  it("When edit-project form payload is submitted, then PATCH /api/projects/[projectId] persists updated fields", async () => {
    jest.resetModules();

    const recordAdminAudit = jest.fn();
    const previousProject = {
      id: "proj-8",
      name: "Old project",
      clientName: "Old client",
      costPhp: 100000,
      currencyCode: "PHP",
      status: "ongoing",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: null,
      adminNotes: null,
      memberships: [{ userId: "eng-1" }],
    };

    const updatedProject = {
      ...previousProject,
      name: "Updated project",
      clientName: "Updated client",
      costPhp: 200000,
      currencyCode: "USD",
      status: "completed",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-10-01T00:00:00.000Z"),
      adminNotes: "Updated notes",
      memberships: [
        {
          userId: "eng-2",
          user: {
            id: "eng-2",
            email: "eng2@example.com",
            firstName: "Eng",
            lastName: "Two",
            name: "Eng Two",
          },
        },
      ],
    };

    const tx = {
      project: {
        update: jest.fn().mockResolvedValue(updatedProject),
        findUnique: jest.fn().mockResolvedValue(updatedProject),
      },
      projectMembership: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const prismaMock = {
      project: {
        findUnique: jest.fn().mockResolvedValue(previousProject),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: "eng-2" }]),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
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
      recordAdminAudit,
    }));

    const payloadBody = {
      name: "Updated project",
      clientName: "Updated client",
      costPhp: "200000",
      currencyCode: "USD",
      status: "completed",
      startDate: "2026-05-01",
      endDate: "2026-10-01",
      adminNotes: "Updated notes",
      teamMemberIds: ["eng-2"],
    };

    const { PATCH } = await import("../../app/api/projects/[projectId]/route.js");
    const response = await PATCH(
      jsonRequest("http://localhost/api/projects/proj-8", "PATCH", payloadBody),
      { params: Promise.resolve({ projectId: "proj-8" }) }
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    const updateCall = tx.project.update.mock.calls[0][0];
    expect(updateCall).toEqual(
      expect.objectContaining({
        where: { id: "proj-8" },
        data: expect.objectContaining({
          name: "Updated project",
          clientName: "Updated client",
          costPhp: 200000,
          currencyCode: "USD",
          status: "completed",
          adminNotes: "Updated notes",
        }),
      })
    );
    expect(updateCall.data.startDate).toBeInstanceOf(Date);
    expect(updateCall.data.startDate.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(updateCall.data.endDate).toBeInstanceOf(Date);
    expect(updateCall.data.endDate.toISOString()).toBe("2026-10-01T00:00:00.000Z");

    expect(tx.projectMembership.deleteMany).toHaveBeenCalledWith({ where: { projectId: "proj-8" } });
    expect(tx.projectMembership.createMany).toHaveBeenCalledWith({
      data: [{ projectId: "proj-8", userId: "eng-2" }],
      skipDuplicates: true,
    });

    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "project.updated", actorUserId: "admin-2" })
    );
  });
});
