"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Alert, Box, Paper, Stack } from "@mui/material";
import { emptyHoliday, nextDateInputValue, skillOptionSet } from "../profile-form-shared";
import AccountNavigation from "./account-navigation";
import { formatDateLabel } from "./formatters";
import PersonalPanel from "./personal-panel";
import ProjectsPanel from "./projects-panel";
import TasksPanel from "./tasks-panel";
import { AppPageShell, workspaceFrameSx } from "../page-shell";
import { filterTasks, sortTasks } from "../tasks/shared";

function emptyTaskForm(projectId = "") {
  return {
    projectId,
    name: "",
    dueOn: "",
    notes: "",
    parentTaskId: "",
  };
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export default function EngineerAccount() {
  const [activePanel, setActivePanel] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTaskForm());
  const [taskProjectFilter, setTaskProjectFilter] = useState("all");
  const [taskCompletionFilter, setTaskCompletionFilter] = useState("all");
  const [taskDueFilter, setTaskDueFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load profile.");
        }

        if (!mounted) {
          return;
        }

        const profile = payload?.profile || {};
        const holidays = Array.isArray(profile.upcomingHolidays) ? profile.upcomingHolidays : [];

        setForm({
          firstName: typeof profile.firstName === "string" ? profile.firstName : "",
          lastName: typeof profile.lastName === "string" ? profile.lastName : "",
          city: typeof profile.city === "string" ? profile.city : "",
          skills: Array.isArray(profile.skills)
            ? profile.skills.filter((skill) => skillOptionSet.has(skill))
            : [],
          availabilityStatus: profile.availabilityStatus || "available",
          availabilityNote: profile.availabilityNote || "",
          upcomingHolidays: holidays.length ? holidays : [emptyHoliday()],
        });
        setAvatarPreview(typeof profile.image === "string" ? profile.image : "");
        setAvatarDirty(false);
        setAvatarRemoved(false);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Unable to load profile.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load projects.");
        }

        if (!mounted) {
          return;
        }

        setProjects(Array.isArray(payload?.projects) ? payload.projects : []);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Unable to load projects.");
        }
      } finally {
        if (mounted) {
          setProjectsLoading(false);
        }
      }
    }

    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load tasks.");
        }

        if (!mounted) {
          return;
        }

        setTasks(Array.isArray(payload?.tasks) ? payload.tasks : []);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Unable to load tasks.");
        }
      } finally {
        if (mounted) {
          setTasksLoading(false);
        }
      }
    }

    loadProfile();
    loadProjects();
    loadTasks();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (uploadedUrl) => {
    const normalizedUrl = typeof uploadedUrl === "string" ? uploadedUrl.trim() : "";
    if (!normalizedUrl) {
      setError("Avatar upload did not return a valid image URL.");
      return;
    }

    setAvatarPreview(normalizedUrl);
    setAvatarRemoved(false);
    setAvatarDirty(true);
    setError("");
  };

  const handleAvatarRemove = () => {
    if (!avatarPreview) {
      return;
    }

    setAvatarPreview("");
    setAvatarRemoved(true);
    setAvatarDirty(true);
  };

  const handleHolidayChange = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.upcomingHolidays];
      const current = next[index] || emptyHoliday();
      const updated = { ...current, [key]: value };
      if (key === "startDate" && !current.endDate) {
        updated.endDate = nextDateInputValue(value);
      }
      next[index] = updated;
      return { ...prev, upcomingHolidays: next };
    });
  };

  const addHoliday = () => {
    setForm((prev) => ({
      ...prev,
      upcomingHolidays: [...prev.upcomingHolidays, emptyHoliday()],
    }));
  };

  const removeHoliday = (index) => {
    setForm((prev) => {
      const next = prev.upcomingHolidays.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, upcomingHolidays: next.length ? next : [emptyHoliday()] };
    });
  };

  const resetTaskForm = (projectId = taskProjectFilter) => {
    setEditingTaskId("");
    setTaskForm(emptyTaskForm(projectId === "all" ? "" : projectId || ""));
  };

  const handleTaskFieldChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "projectId" ? { parentTaskId: "" } : {}),
    }));
  };

  const openTasksPanel = (projectId = "all") => {
    const nextProjectFilter = projectId || "all";
    setActivePanel("tasks");
    setTaskProjectFilter(nextProjectFilter);
    setTaskCompletionFilter("all");
    setTaskDueFilter("all");
    setTaskSearch("");
    setError("");
    setInfo("");
    resetTaskForm(nextProjectFilter);
  };

  const beginEditTask = (task) => {
    setActivePanel("tasks");
    setEditingTaskId(task.id);
    setTaskForm({
      projectId: task.projectId || "",
      name: task.name || "",
      dueOn: toDateInputValue(task.dueOn),
      notes: task.notes || "",
      parentTaskId: task.parentTaskId || "",
    });
    setError("");
    setInfo(`Editing task: ${task.name || "Untitled"}`);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);

    const isEditing = Boolean(editingTaskId);
    const formProjectId = taskForm.projectId || (taskProjectFilter !== "all" ? taskProjectFilter : "");

    try {
      const response = await fetch(isEditing ? `/api/tasks/${editingTaskId}` : "/api/tasks", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProjectId,
          name: taskForm.name,
          dueOn: taskForm.dueOn || null,
          notes: taskForm.notes,
          parentTaskId: taskForm.parentTaskId || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save task.");
      }

      const task = payload?.task;
      if (task) {
        setTasks((prev) => {
          const next = prev.filter((item) => item.id !== task.id);
          return [task, ...next];
        });
      }

      setInfo(isEditing ? "Task updated." : "Task created.");
      resetTaskForm(taskProjectFilter !== "all" ? taskProjectFilter : formProjectId);
    } catch (saveError) {
      setError(saveError.message || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete task.");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (editingTaskId === taskId) {
        resetTaskForm();
      }
      setInfo("Task deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete task.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskCompleted = async (task) => {
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update task.");
      }

      const updatedTask = payload?.task;
      if (updatedTask) {
        setTasks((prev) => prev.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
      }
      setInfo(task.completed ? "Task reopened." : "Task completed.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const payloadBody = {
        firstName: form.firstName,
        lastName: form.lastName,
        city: form.city,
        skills: form.skills,
        availabilityStatus: form.availabilityStatus,
        availabilityNote: form.availabilityNote,
        upcomingHolidays: form.upcomingHolidays.filter(
          (item) => item.label || item.startDate || item.endDate
        ),
      };

      if (avatarDirty) {
        payloadBody.avatar = avatarRemoved ? null : avatarPreview;
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save profile.");
      }

      const updatedImage = payload?.profile?.image;
      setAvatarPreview(typeof updatedImage === "string" ? updatedImage : "");
      setAvatarDirty(false);
      setAvatarRemoved(false);
      setInfo("Profile updated.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" });
  };

  const engineerProjectOptions = (() => {
    const byId = new Map();
    projects.forEach((project) => {
      if (project?.id) {
        byId.set(project.id, { id: project.id, name: project.name || project.id });
      }
    });
    tasks.forEach((task) => {
      if (task?.project?.id) {
        byId.set(task.project.id, { id: task.project.id, name: task.project.name || task.project.id });
      }
    });
    return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
  })();

  const taskParentOptions = (() => {
    if (!taskForm.projectId) {
      return [];
    }

    return tasks
      .filter((task) => task.projectId === taskForm.projectId && task.id !== editingTaskId)
      .sort((left, right) => left.name.localeCompare(right.name));
  })();

  const filteredTasks = sortTasks(
    filterTasks({
      tasks,
      projectId: taskProjectFilter,
      completion: taskCompletionFilter,
      due: taskDueFilter,
      query: taskSearch,
    })
  );

  return (
    <AppPageShell>
      <Paper sx={[workspaceFrameSx, { minHeight: { xs: "auto", md: 620 } }]}>
        <AccountNavigation
          activePanel={activePanel}
          saving={saving}
          onSelectPanel={setActivePanel}
          onSignOut={handleSignOut}
        />

        <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            {activePanel === "personal" ? (
              <PersonalPanel
                loading={loading}
                saving={saving}
                form={form}
                avatarPreview={avatarPreview}
                onSubmit={handleSaveProfile}
                onFieldChange={handleFieldChange}
                onAvatarUpload={handleAvatarUpload}
                onAvatarUploadError={setError}
                onAvatarRemove={handleAvatarRemove}
                onSkillsChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
                onHolidayChange={handleHolidayChange}
                onRemoveHoliday={removeHoliday}
                onAddHoliday={addHoliday}
              />
            ) : null}

            {activePanel === "projects" ? (
              <ProjectsPanel
                projectsLoading={projectsLoading}
                projects={projects}
                formatDateLabel={formatDateLabel}
                onOpenTasks={openTasksPanel}
              />
            ) : null}

            {activePanel === "tasks" ? (
              <TasksPanel
                saving={saving}
                tasksLoading={tasksLoading}
                taskForm={taskForm}
                projectOptions={engineerProjectOptions}
                filterProjectOptions={engineerProjectOptions}
                parentTaskOptions={taskParentOptions}
                filteredTasks={filteredTasks}
                editingTaskId={editingTaskId}
                taskProjectFilter={taskProjectFilter}
                taskCompletionFilter={taskCompletionFilter}
                taskDueFilter={taskDueFilter}
                taskSearch={taskSearch}
                onTaskFieldChange={handleTaskFieldChange}
                onSubmitTask={submitTask}
                onEditTask={beginEditTask}
                onDeleteTask={deleteTask}
                onToggleTaskCompleted={toggleTaskCompleted}
                onTaskProjectFilterChange={setTaskProjectFilter}
                onTaskCompletionFilterChange={setTaskCompletionFilter}
                onTaskDueFilterChange={setTaskDueFilter}
                onTaskSearchChange={setTaskSearch}
                onResetTaskForm={() => resetTaskForm()}
              />
            ) : null}
          </Stack>
        </Box>
      </Paper>
    </AppPageShell>
  );
}
