import { TASK_NAME_MAX_LENGTH, TASK_NOTES_MAX_LENGTH } from "../../constants/text-limits";

export const allowedTaskApprovalStatuses = new Set(["pending", "approved", "rejected"]);
export const allowedTaskDueFilters = new Set(["all", "overdue", "due_today", "upcoming", "no_due_date"]);

export const taskUserSummarySelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  name: true,
};

export const taskProjectSummarySelect = {
  id: true,
  name: true,
  clientName: true,
  status: true,
};

export const taskInclude = {
  project: {
    select: taskProjectSummarySelect,
  },
  assignee: {
    select: taskUserSummarySelect,
  },
  assignedBy: {
    select: taskUserSummarySelect,
  },
  createdByUser: {
    select: taskUserSummarySelect,
  },
  completedBy: {
    select: taskUserSummarySelect,
  },
  parentTask: {
    select: {
      id: true,
      projectId: true,
      name: true,
    },
  },
};

export const taskProjectAccessInclude = {
  memberships: {
    select: {
      userId: true,
    },
  },
};

export function parseDateInput(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseOptionalString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function parseOptionalId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function parseTaskName(value) {
  return parseOptionalString(value, TASK_NAME_MAX_LENGTH);
}

export function parseTaskNotes(value) {
  return parseOptionalString(value, TASK_NOTES_MAX_LENGTH);
}

export function parseTaskApprovalStatus(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return allowedTaskApprovalStatuses.has(normalized) ? normalized : null;
}

export function parseTaskCompletedValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export function parseTaskDueFilter(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return allowedTaskDueFilters.has(normalized) ? normalized : null;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfNextUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
}

export function buildTaskListFilters(searchParams) {
  return {
    projectId: parseOptionalId(searchParams.get("projectId")),
    assigneeId: parseOptionalId(searchParams.get("assigneeId")),
    createdByUserId: parseOptionalId(searchParams.get("createdBy")),
    approvalStatus: parseTaskApprovalStatus(searchParams.get("approvalStatus")),
    completed: parseTaskCompletedValue(searchParams.get("completed")),
    due: parseTaskDueFilter(searchParams.get("due")),
    query: parseOptionalString(searchParams.get("q"), TASK_NAME_MAX_LENGTH),
    parentTaskId: parseOptionalId(searchParams.get("parentTaskId")),
  };
}

export function buildTaskVisibilityWhere({ isAdmin, userId }) {
  if (isAdmin) {
    return {};
  }

  return {
    OR: [{ assigneeId: userId }, { createdByUserId: userId }],
  };
}

export function buildTaskWhere({ filters, isAdmin, userId, now = new Date() }) {
  const clauses = [];
  const visibilityWhere = buildTaskVisibilityWhere({ isAdmin, userId });

  if (Object.keys(visibilityWhere).length > 0) {
    clauses.push(visibilityWhere);
  }

  if (filters.projectId) {
    clauses.push({ projectId: filters.projectId });
  }

  if (filters.assigneeId) {
    clauses.push({ assigneeId: filters.assigneeId });
  }

  if (filters.createdByUserId) {
    clauses.push({ createdByUserId: filters.createdByUserId });
  }

  if (filters.approvalStatus) {
    clauses.push({ approvalStatus: filters.approvalStatus });
  }

  if (typeof filters.completed === "boolean") {
    clauses.push({ completed: filters.completed });
  }

  if (filters.query) {
    clauses.push({
      name: {
        contains: filters.query,
        mode: "insensitive",
      },
    });
  }

  if (filters.parentTaskId) {
    clauses.push({ parentTaskId: filters.parentTaskId });
  }

  if (filters.due === "overdue") {
    clauses.push({ dueOn: { lt: now } });
  }

  if (filters.due === "due_today") {
    clauses.push({
      dueOn: {
        gte: startOfUtcDay(now),
        lt: startOfNextUtcDay(now),
      },
    });
  }

  if (filters.due === "upcoming") {
    clauses.push({
      dueOn: {
        gte: startOfNextUtcDay(now),
      },
    });
  }

  if (filters.due === "no_due_date") {
    clauses.push({ dueOn: null });
  }

  if (clauses.length === 0) {
    return {};
  }

  return { AND: clauses };
}

export function userDisplayName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }

  return user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
}

export function toUserSummary(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    name: userDisplayName(user),
  };
}

export function toProjectSummary(project) {
  if (!project || typeof project !== "object") {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    clientName: project.clientName,
    status: project.status,
  };
}

export function toTaskParent(task) {
  if (task?.parentTask) {
    return {
      id: task.parentTask.id,
      name: task.parentTask.name,
      projectId: task.parentTask.projectId,
      resourceType: "task",
    };
  }

  if (task?.project) {
    return {
      id: task.project.id,
      name: task.project.name,
      clientName: task.project.clientName,
      resourceType: "project",
    };
  }

  return null;
}

export function canManageTask({ task, sessionUserId, isAdmin }) {
  if (isAdmin) {
    return true;
  }

  return task.assigneeId === sessionUserId || task.createdByUserId === sessionUserId;
}

export function isProjectMember(project, userId) {
  return Array.isArray(project?.memberships) && project.memberships.some((membership) => membership.userId === userId);
}

export function toTaskDto(task, { sessionUserId = "", isAdmin = false } = {}) {
  return {
    id: task.id,
    projectId: task.projectId,
    parentTaskId: task.parentTaskId || null,
    name: task.name,
    assignee: task.assigneeId,
    assignedBy: task.assignedById,
    createdBy: task.createdByUserId,
    completedAt: task.completedAt,
    completedBy: task.completedById,
    completed: Boolean(task.completed),
    approvalStatus: task.approvalStatus,
    dueOn: task.dueOn,
    notes: task.notes || "",
    resourceType: task.resourceType || "task",
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    parent: toTaskParent(task),
    project: toProjectSummary(task.project),
    assigneeUser: toUserSummary(task.assignee),
    assignedByUser: toUserSummary(task.assignedBy),
    createdByUser: toUserSummary(task.createdByUser),
    completedByUser: toUserSummary(task.completedBy),
    canManage: canManageTask({ task, sessionUserId, isAdmin }),
  };
}
