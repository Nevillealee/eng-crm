"use client";

export const taskCompletionFilterOptions = [
  { value: "all", label: "All tasks" },
  { value: "open", label: "Open tasks" },
  { value: "completed", label: "Completed tasks" },
];

export const taskDueFilterOptions = [
  { value: "all", label: "All due dates" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "no_due_date", label: "No due date" },
];

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfNextUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
}

export function formatTaskDateLabel(value) {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleDateString() : "No due date";
}

export function taskCompletionColor(completed) {
  return completed ? "success" : "default";
}

export function taskUserLabel(user, fallback = "") {
  if (!user || typeof user !== "object") {
    return fallback;
  }

  return user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || fallback;
}

export function filterTasks({
  tasks,
  projectId = "all",
  assigneeId = "all",
  completion = "all",
  due = "all",
  query = "",
}) {
  const now = new Date();
  const startToday = startOfUtcDay(now);
  const startTomorrow = startOfNextUtcDay(now);
  const normalizedQuery = String(query || "").trim().toLowerCase();

  return tasks.filter((task) => {
    if (projectId !== "all" && task.projectId !== projectId) {
      return false;
    }

    if (assigneeId !== "all" && task.assignee !== assigneeId) {
      return false;
    }

    if (completion === "open" && task.completed) {
      return false;
    }

    if (completion === "completed" && !task.completed) {
      return false;
    }

    const dueDate = toDate(task.dueOn);
    if (due === "overdue" && (!dueDate || dueDate >= now)) {
      return false;
    }

    if (due === "due_today" && (!dueDate || dueDate < startToday || dueDate >= startTomorrow)) {
      return false;
    }

    if (due === "upcoming" && (!dueDate || dueDate < startTomorrow)) {
      return false;
    }

    if (due === "no_due_date" && dueDate) {
      return false;
    }

    if (normalizedQuery && !String(task.name || "").toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    return true;
  });
}

export function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    if (Boolean(left.completed) !== Boolean(right.completed)) {
      return left.completed ? 1 : -1;
    }

    const leftDue = toDate(left.dueOn);
    const rightDue = toDate(right.dueOn);

    if (leftDue && rightDue) {
      const dateDiff = leftDue.getTime() - rightDue.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
    } else if (leftDue) {
      return -1;
    } else if (rightDue) {
      return 1;
    }

    const leftCreated = toDate(left.createdAt);
    const rightCreated = toDate(right.createdAt);
    return (rightCreated?.getTime() || 0) - (leftCreated?.getTime() || 0);
  });
}
