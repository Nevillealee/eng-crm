"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import MenuIcon from "@mui/icons-material/Menu";
import { Alert, Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { emptyHoliday, nextDateInputValue, skillOptionSet } from "../profile-form-shared";
import AuditPanel from "./panels/audit-panel";
import DashboardPanel from "./panels/dashboard-panel";
import EngineersPanel from "./panels/engineers-panel";
import PersonalPanel from "./panels/personal-panel";
import ProjectsPanel from "./panels/projects-panel";
import TasksPanel from "./panels/tasks-panel";
import { AppPageShell, workspaceFrameSx } from "../page-shell";
import { filterEngineers } from "./shared/engineer-filters";
import AdminDashboardNavigation from "./shared/navigation";
import OverviewCards from "./shared/overview-cards";
import { filterTasks, sortTasks, taskUserLabel } from "../tasks/shared";

function engineerDisplayName(engineer) {
  if (!engineer || typeof engineer !== "object") {
    return "";
  }

  return (
    engineer.name ||
    `${engineer.firstName || ""} ${engineer.lastName || ""}`.trim() ||
    engineer.email ||
    ""
  );
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

function emptyProjectForm() {
  return {
    name: "",
    clientName: "",
    costPhp: "0",
    currencyCode: "PHP",
    startDate: "",
    endDate: "",
    adminNotes: "",
    teamMemberIds: [],
  };
}

function emptyTaskForm(projectId = "", assigneeId = "") {
  return {
    projectId,
    name: "",
    assigneeId,
    dueOn: "",
    notes: "",
    parentTaskId: "",
    completed: false,
  };
}

function withEngineerDrafts(engineers) {
  return engineers.map((engineer) => ({
    ...engineer,
    image: typeof engineer.image === "string" ? engineer.image.trim() : null,
    cityDraft: typeof engineer.city === "string" ? engineer.city : "",
    monthlySalaryPhpDraft:
      typeof engineer.monthlySalaryPhp === "number" ? String(engineer.monthlySalaryPhp) : "",
    salaryNotesDraft: engineer.salaryNotes || "",
  }));
}

export default function AdminDashboard({ session }) {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm());
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTaskForm("", session?.user?.id || ""));
  const [taskProjectFilter, setTaskProjectFilter] = useState("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("all");
  const [taskCompletionFilter, setTaskCompletionFilter] = useState("all");
  const [taskDueFilter, setTaskDueFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [engineerSearch, setEngineerSearch] = useState("");
  const [engineerCityFilter, setEngineerCityFilter] = useState("all");
  const [engineerAvailabilityFilter, setEngineerAvailabilityFilter] = useState("all");
  const [salarySavingEngineerId, setSalarySavingEngineerId] = useState("");
  const [editingEngineerCompId, setEditingEngineerCompId] = useState("");
  const [expandedHolidayEngineerId, setExpandedHolidayEngineerId] = useState("");
  const [expandedProjectsEngineerId, setExpandedProjectsEngineerId] = useState("");
  const [projectSortBy, setProjectSortBy] = useState("date");
  const [projectSortDirection, setProjectSortDirection] = useState("desc");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const availableEngineerCount = useMemo(
    () => engineers.filter((item) => item.availabilityStatus === "available").length,
    [engineers]
  );

  const selectedTeam = useMemo(() => {
    const selectedIds = new Set(projectForm.teamMemberIds);
    return engineers.filter((engineer) => selectedIds.has(engineer.id));
  }, [engineers, projectForm.teamMemberIds]);

  const assignableEngineers = useMemo(() => {
    const byId = new Map();

    engineers
      .filter((engineer) => engineer.availabilityStatus === "available")
      .forEach((engineer) => byId.set(engineer.id, engineer));

    selectedTeam.forEach((engineer) => byId.set(engineer.id, engineer));

    return [...byId.values()].sort((left, right) =>
      engineerDisplayName(left).localeCompare(engineerDisplayName(right))
    );
  }, [engineers, selectedTeam]);

  const cityFilterOptions = useMemo(
    () =>
      [...new Set(engineers.map((engineer) => engineer.city).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [engineers]
  );

  const filteredEngineers = useMemo(() => {
    return filterEngineers({
      engineers,
      query: engineerSearch,
      cityFilter: engineerCityFilter,
      availabilityFilter: engineerAvailabilityFilter,
    });
  }, [engineers, engineerSearch, engineerCityFilter, engineerAvailabilityFilter]);

  const activeProjects = useMemo(
    () => projects.filter((project) => String(project.status || "").toLowerCase() !== "archived"),
    [projects]
  );

  const archivedProjects = useMemo(
    () => projects.filter((project) => String(project.status || "").toLowerCase() === "archived"),
    [projects]
  );

  const sortedActiveProjects = useMemo(() => {
    const direction = projectSortDirection === "asc" ? 1 : -1;

    return [...activeProjects].sort((a, b) => {
      if (projectSortBy === "cost") {
        return (Number(a.costPhp || 0) - Number(b.costPhp || 0)) * direction;
      }

      const aDate = new Date(a.startDate || a.createdAt || 0).getTime();
      const bDate = new Date(b.startDate || b.createdAt || 0).getTime();
      return (aDate - bDate) * direction;
    });
  }, [activeProjects, projectSortBy, projectSortDirection]);

  const sortedArchivedProjects = useMemo(
    () =>
      [...archivedProjects].sort((a, b) => {
        const aDate = new Date(a.startDate || a.createdAt || 0).getTime();
        const bDate = new Date(b.startDate || b.createdAt || 0).getTime();
        return bDate - aDate;
      }),
    [archivedProjects]
  );

  const taskProjectOptions = useMemo(() => {
    return [...projects]
      .map((project) => ({
        id: project.id,
        name: project.name || project.id,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [projects]);

  const taskFilterAssigneeOptions = useMemo(() => {
    const byId = new Map();

    if (session?.user?.id) {
      byId.set(session.user.id, {
        id: session.user.id,
        name: session.user.name || session.user.email || "Me",
      });
    }

    engineers.forEach((engineer) => {
      byId.set(engineer.id, {
        id: engineer.id,
        name: engineerDisplayName(engineer),
      });
    });

    tasks.forEach((task) => {
      if (task?.assignee) {
        byId.set(task.assignee, {
          id: task.assignee,
          name: taskUserLabel(task.assigneeUser, task.assignee),
        });
      }
    });

    return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [engineers, session, tasks]);

  const taskAssigneeOptions = useMemo(() => {
    const byId = new Map();

    if (session?.user?.id) {
      byId.set(session.user.id, {
        id: session.user.id,
        name: session.user.name || session.user.email || "Me",
      });
    }

    const selectedProject = projects.find((project) => project.id === taskForm.projectId);
    if (Array.isArray(selectedProject?.teamMembers)) {
      selectedProject.teamMembers.forEach((member) => {
        byId.set(member.id, {
          id: member.id,
          name: member.name || member.email || member.id,
        });
      });
    }

    if (taskForm.assigneeId && !byId.has(taskForm.assigneeId)) {
      const fallbackTask = tasks.find((task) => task.assignee === taskForm.assigneeId);
      byId.set(taskForm.assigneeId, {
        id: taskForm.assigneeId,
        name: taskUserLabel(fallbackTask?.assigneeUser, taskForm.assigneeId),
      });
    }

    return [...byId.values()].sort((left, right) => {
      if (left.id === session?.user?.id) {
        return -1;
      }
      if (right.id === session?.user?.id) {
        return 1;
      }
      return left.name.localeCompare(right.name);
    });
  }, [projects, session, taskForm.assigneeId, taskForm.projectId, tasks]);

  const taskParentOptions = useMemo(() => {
    if (!taskForm.projectId) {
      return [];
    }

    return tasks
      .filter((task) => task.projectId === taskForm.projectId && task.id !== editingTaskId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [editingTaskId, taskForm.projectId, tasks]);

  const filteredTasks = useMemo(() => {
    return sortTasks(
      filterTasks({
        tasks,
        projectId: taskProjectFilter,
        assigneeId: taskAssigneeFilter,
        completion: taskCompletionFilter,
        due: taskDueFilter,
        query: taskSearch,
      })
    );
  }, [
    taskAssigneeFilter,
    taskCompletionFilter,
    taskDueFilter,
    taskProjectFilter,
    taskSearch,
    tasks,
  ]);

  const auditActionOptions = useMemo(() => {
    const actions = [...new Set(auditLogs.map((entry) => entry.action).filter(Boolean))];
    return actions.sort((left, right) => left.localeCompare(right));
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    if (auditActionFilter === "all") {
      return auditLogs;
    }
    return auditLogs.filter((entry) => entry.action === auditActionFilter);
  }, [auditActionFilter, auditLogs]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setError("");

      try {
        const [engineerResponse, projectsResponse, tasksResponse, profileResponse, auditLogResponse] = await Promise.all([
          fetch("/api/admin/engineers"),
          fetch("/api/projects"),
          fetch("/api/tasks"),
          fetch("/api/profile"),
          fetch("/api/admin/audit-logs?limit=100"),
        ]);

        const engineerPayload = await engineerResponse.json().catch(() => ({}));
        const projectsPayload = await projectsResponse.json().catch(() => ({}));
        const tasksPayload = await tasksResponse.json().catch(() => ({}));
        const profilePayload = await profileResponse.json().catch(() => ({}));
        const auditLogPayload = await auditLogResponse.json().catch(() => ({}));

        if (!engineerResponse.ok) {
          throw new Error(engineerPayload?.error || "Unable to load engineers.");
        }

        if (!projectsResponse.ok) {
          throw new Error(projectsPayload?.error || "Unable to load projects.");
        }

        if (!tasksResponse.ok) {
          throw new Error(tasksPayload?.error || "Unable to load tasks.");
        }

        if (!profileResponse.ok) {
          throw new Error(profilePayload?.error || "Unable to load profile.");
        }

        if (!auditLogResponse.ok) {
          throw new Error(auditLogPayload?.error || "Unable to load audit log.");
        }

        if (!mounted) {
          return;
        }

        const profile = profilePayload?.profile || {};
        const holidays = Array.isArray(profile.upcomingHolidays) ? profile.upcomingHolidays : [];

        setEngineers(
          withEngineerDrafts(Array.isArray(engineerPayload?.engineers) ? engineerPayload.engineers : [])
        );
        setProjects(Array.isArray(projectsPayload?.projects) ? projectsPayload.projects : []);
        setTasks(Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : []);
        setAuditLogs(Array.isArray(auditLogPayload?.logs) ? auditLogPayload.logs : []);
        setProfileForm({
          firstName: typeof profile.firstName === "string" ? profile.firstName : "",
          lastName: typeof profile.lastName === "string" ? profile.lastName : "",
          city: profile.city || "",
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
          setError(loadError.message || "Unable to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" });
  };

  const handleNavigationSignOut = async () => {
    setMobileNavOpen(false);
    await handleSignOut();
  };

  const downloadAdminCsv = (path) => {
    if (typeof window === "undefined") {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = path;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleProjectFieldChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "startDate" && !prev.endDate) {
        next.endDate = nextDateInputValue(value);
      }
      return next;
    });
  };

  const handleProjectTeamChange = (value) => {
    setProjectForm((prev) => ({
      ...prev,
      teamMemberIds: value.map((item) => item.id),
    }));
  };

  const resetProjectForm = () => {
    setEditingProjectId("");
    setProjectForm(emptyProjectForm());
  };

  const openCreateProjectForm = () => {
    resetProjectForm();
    setShowCreateProjectForm(true);
    setError("");
    setInfo("");
  };

  const closeCreateProjectForm = () => {
    setShowCreateProjectForm(false);
    resetProjectForm();
  };

  const beginEdit = (project) => {
    setActivePanel("projects");
    setShowCreateProjectForm(false);
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name || "",
      clientName: project.clientName || "",
      costPhp: String(project.costPhp ?? 0),
      currencyCode: project.currencyCode || "PHP",
      startDate: toDateInputValue(project.startDate),
      endDate: toDateInputValue(project.endDate),
      adminNotes: project.adminNotes || "",
      teamMemberIds: Array.isArray(project.teamMembers)
        ? project.teamMembers.map((member) => member.id)
        : [],
    });
    setError("");
    setInfo(`Editing project: ${project.name || "Untitled"}`);
  };

  const submitProject = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const payload = {
        name: projectForm.name,
        clientName: projectForm.clientName,
        costPhp: projectForm.costPhp,
        currencyCode: projectForm.currencyCode,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || null,
        adminNotes: projectForm.adminNotes,
        teamMemberIds: projectForm.teamMemberIds,
      };

      const isEditing = Boolean(editingProjectId);
      const response = await fetch(isEditing ? `/api/projects/${editingProjectId}` : "/api/projects", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Unable to save project.");
      }

      const project = body?.project;
      if (project) {
        setProjects((prev) => {
          const next = prev.filter((item) => item.id !== project.id);
          return [project, ...next];
        });
      }

      setInfo(isEditing ? "Project updated." : "Project created.");
      resetProjectForm();
      if (!isEditing) {
        setShowCreateProjectForm(false);
      }
    } catch (saveError) {
      setError(saveError.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  };

  const archiveProject = async (projectId) => {
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Unable to archive project.");
      }

      const project = body?.project;
      if (project) {
        setProjects((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === project.id);
          if (existingIndex === -1) {
            return [project, ...prev];
          }
          const next = [...prev];
          next[existingIndex] = project;
          return next;
        });
      }

      if (editingProjectId === projectId) {
        resetProjectForm();
      }

      setInfo("Project archived.");
    } catch (archiveError) {
      setError(archiveError.message || "Unable to archive project.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (projectId) => {
    setError("");
    setInfo("");
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Unable to delete project.");
      }

      setProjects((prev) => prev.filter((item) => item.id !== projectId));

      if (editingProjectId === projectId) {
        resetProjectForm();
      }

      setInfo("Project deleted permanently.");
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete project.");
    } finally {
      setSaving(false);
    }
  };

  const updateEngineerDraft = (engineerId, key, value) => {
    setEngineers((prev) =>
      prev.map((engineer) => (engineer.id === engineerId ? { ...engineer, [key]: value } : engineer))
    );
  };

  const beginEditEngineerComp = (engineerId) => {
    setEngineers((prev) =>
      prev.map((engineer) =>
        engineer.id === engineerId
          ? {
              ...engineer,
              cityDraft: engineer.city || "",
              monthlySalaryPhpDraft:
                typeof engineer.monthlySalaryPhp === "number"
                  ? String(engineer.monthlySalaryPhp)
                  : "",
              salaryNotesDraft: engineer.salaryNotes || "",
            }
          : engineer
      )
    );
    setEditingEngineerCompId(engineerId);
  };

  const cancelEditEngineerComp = (engineerId) => {
    setEngineers((prev) =>
      prev.map((engineer) =>
        engineer.id === engineerId
          ? {
              ...engineer,
              cityDraft: engineer.city || "",
              monthlySalaryPhpDraft:
                typeof engineer.monthlySalaryPhp === "number"
                  ? String(engineer.monthlySalaryPhp)
                  : "",
              salaryNotesDraft: engineer.salaryNotes || "",
            }
          : engineer
      )
    );
    setEditingEngineerCompId("");
  };

  const saveEngineerCompensation = async (engineerId) => {
    const engineer = engineers.find((item) => item.id === engineerId);
    if (!engineer) {
      return;
    }

    setError("");
    setInfo("");
    setSalarySavingEngineerId(engineerId);

    try {
      const response = await fetch(`/api/admin/engineers/${engineerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: engineer.cityDraft,
          monthlySalaryPhp:
            engineer.monthlySalaryPhpDraft === "" ? null : engineer.monthlySalaryPhpDraft,
          salaryNotes: engineer.salaryNotesDraft,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || "Unable to update engineer salary.");
      }

      const updated = body?.engineer;
      if (updated) {
        setEngineers((prev) =>
          prev.map((item) =>
            item.id === engineerId
              ? {
                  ...item,
                  city: updated.city,
                  cityDraft: updated.city || "",
                  monthlySalaryPhp: updated.monthlySalaryPhp,
                  salaryNotes: updated.salaryNotes,
                  monthlySalaryPhpDraft:
                    typeof updated.monthlySalaryPhp === "number"
                      ? String(updated.monthlySalaryPhp)
                      : "",
                  salaryNotesDraft: updated.salaryNotes || "",
                }
              : item
          )
        );
      }

      setInfo("Engineer details updated.");
      setEditingEngineerCompId("");
    } catch (saveError) {
      setError(saveError.message || "Unable to update engineer details.");
    } finally {
      setSalarySavingEngineerId("");
    }
  };

  const toggleEngineerHolidays = (engineerId) => {
    setExpandedHolidayEngineerId((prev) => (prev === engineerId ? "" : engineerId));
  };

  const toggleEngineerProjects = (engineerId) => {
    setExpandedProjectsEngineerId((prev) => (prev === engineerId ? "" : engineerId));
  };

  const handleTaskFieldChange = (event) => {
    const nextValue =
      event?.target?.type === "checkbox" ? Boolean(event.target.checked) : event?.target?.value;
    const { name } = event.target;

    setTaskForm((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "projectId"
        ? {
            parentTaskId: "",
            assigneeId: session?.user?.id || "",
          }
        : {}),
    }));
  };

  const resetTaskForm = (projectId = taskProjectFilter, assigneeId = session?.user?.id || "") => {
    setEditingTaskId("");
    setTaskForm(emptyTaskForm(projectId === "all" ? "" : projectId || "", assigneeId));
  };

  const openCreateTaskForm = (projectId = taskProjectFilter) => {
    setActivePanel("tasks");
    setShowCreateTaskForm(true);
    resetTaskForm(projectId, session?.user?.id || "");
    setError("");
    setInfo("");
  };

  const closeCreateTaskForm = () => {
    setShowCreateTaskForm(false);
    resetTaskForm();
  };

  const beginEditTask = (task) => {
    setActivePanel("tasks");
    setShowCreateTaskForm(false);
    setEditingTaskId(task.id);
    setTaskForm({
      projectId: task.projectId || "",
      name: task.name || "",
      assigneeId: task.assignee || "",
      dueOn: toDateInputValue(task.dueOn),
      notes: task.notes || "",
      parentTaskId: task.parentTaskId || "",
      completed: Boolean(task.completed),
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
          assigneeId: taskForm.assigneeId || session?.user?.id || "",
          dueOn: taskForm.dueOn || null,
          notes: taskForm.notes,
          parentTaskId: taskForm.parentTaskId || null,
          completed: taskForm.completed,
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
      resetTaskForm(taskProjectFilter !== "all" ? taskProjectFilter : formProjectId, session?.user?.id || "");
      if (!isEditing) {
        setShowCreateTaskForm(false);
      }
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

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
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
    setProfileForm((prev) => {
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
    setProfileForm((prev) => ({
      ...prev,
      upcomingHolidays: [...prev.upcomingHolidays, emptyHoliday()],
    }));
  };

  const removeHoliday = (index) => {
    setProfileForm((prev) => {
      const next = prev.upcomingHolidays.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, upcomingHolidays: next.length ? next : [emptyHoliday()] };
    });
  };

  const savePersonalInfo = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setProfileSaving(true);

    try {
      const payloadBody = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        city: profileForm.city,
        skills: profileForm.skills,
        availabilityStatus: profileForm.availabilityStatus,
        availabilityNote: profileForm.availabilityNote,
        upcomingHolidays: profileForm.upcomingHolidays.filter(
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
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Unable to save profile.");
      }

      const updatedImage = body?.profile?.image;
      setAvatarPreview(typeof updatedImage === "string" ? updatedImage : "");
      setAvatarDirty(false);
      setAvatarRemoved(false);
      setInfo("Personal information updated.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const openEngineersPanel = (availabilityFilter = "all") => {
    setActivePanel("engineers");
    setEngineerSearch("");
    setEngineerCityFilter("all");
    setEngineerAvailabilityFilter(availabilityFilter);
  };

  const openProjectsPanel = () => {
    setActivePanel("projects");
  };

  const openTasksPanel = ({ projectId = "all", assigneeId = "all", infoMessage = "" } = {}) => {
    setActivePanel("tasks");
    setMobileNavOpen(false);
    setShowCreateTaskForm(false);
    setTaskProjectFilter(projectId || "all");
    setTaskAssigneeFilter(assigneeId || "all");
    setTaskCompletionFilter("all");
    setTaskDueFilter("all");
    setTaskSearch("");
    resetTaskForm(projectId || "all", session?.user?.id || "");
    setError("");
    setInfo(infoMessage);
  };

  const selectPanel = (panelId) => {
    setActivePanel(panelId);
    setMobileNavOpen(false);

    if (panelId === "engineers") {
      fetch("/api/admin/engineers")
        .then((response) =>
          response
            .json()
            .catch(() => ({}))
            .then((payload) => ({ response, payload }))
        )
        .then(({ response, payload }) => {
          if (!response.ok) {
            throw new Error(payload?.error || "Unable to load engineers.");
          }
          setEngineers(
            withEngineerDrafts(Array.isArray(payload?.engineers) ? payload.engineers : [])
          );
        })
        .catch((loadError) => {
          setError(loadError.message || "Unable to load engineers.");
        });
    }
  };

  const disabled = saving || profileSaving;

  return (
    <AppPageShell>
      <Paper sx={[workspaceFrameSx, { minHeight: { xs: "auto", md: 700 } }]}>
          <AdminDashboardNavigation
            activePanel={activePanel}
            mobileNavOpen={mobileNavOpen}
            disabled={disabled}
            onCloseMobileNav={() => setMobileNavOpen(false)}
            onSelectPanel={selectPanel}
            onSignOut={handleNavigationSignOut}
          />

          <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ display: { xs: "flex", md: "none" } }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Devcombine Engineering Portal
                  </Typography>
                  <Typography variant="h6">Admin</Typography>
                </Stack>
                <IconButton
                  aria-label="Open navigation menu"
                  onClick={() => setMobileNavOpen(true)}
                  disabled={disabled}
                >
                  <MenuIcon />
                </IconButton>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h4">Admin dashboard</Typography>
                <Typography color="text.secondary">
                  Welcome, {session?.user?.name || session?.user?.email}. Manage projects and staffing.
                </Typography>
              </Stack>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {info ? <Alert severity="success">{info}</Alert> : null}

              <OverviewCards
                engineerCount={engineers.length}
                projectCount={projects.length}
                availableEngineerCount={availableEngineerCount}
                onOpenEngineers={openEngineersPanel}
                onOpenProjects={openProjectsPanel}
              />

              {activePanel === "dashboard" ? <DashboardPanel /> : null}

              {activePanel === "engineers" ? (
                <EngineersPanel
                  loading={loading}
                  salarySavingEngineerId={salarySavingEngineerId}
                  engineerSearch={engineerSearch}
                  engineerCityFilter={engineerCityFilter}
                  engineerAvailabilityFilter={engineerAvailabilityFilter}
                  cityFilterOptions={cityFilterOptions}
                  filteredEngineers={filteredEngineers}
                  projects={projects}
                  editingEngineerCompId={editingEngineerCompId}
                  expandedHolidayEngineerId={expandedHolidayEngineerId}
                  expandedProjectsEngineerId={expandedProjectsEngineerId}
                  onExportCsv={downloadAdminCsv}
                  onEngineerSearchChange={setEngineerSearch}
                  onEngineerCityFilterChange={setEngineerCityFilter}
                  onEngineerAvailabilityFilterChange={setEngineerAvailabilityFilter}
                  onToggleHoliday={toggleEngineerHolidays}
                  onToggleProjects={toggleEngineerProjects}
                  onProjectClick={beginEdit}
                  onViewTasks={(engineerId) =>
                    openTasksPanel({
                      assigneeId: engineerId,
                      infoMessage: "Showing tasks assigned to this engineer.",
                    })
                  }
                  onBeginEditComp={beginEditEngineerComp}
                  onUpdateEngineerDraft={updateEngineerDraft}
                  onSaveEngineerComp={saveEngineerCompensation}
                  onCancelEditComp={cancelEditEngineerComp}
                />
              ) : null}

              {activePanel === "personal" ? (
                <PersonalPanel
                  session={session}
                  loading={loading}
                  profileSaving={profileSaving}
                  profileForm={profileForm}
                  avatarPreview={avatarPreview}
                  onSavePersonalInfo={savePersonalInfo}
                  onProfileFieldChange={handleProfileFieldChange}
                  onAvatarUpload={handleAvatarUpload}
                  onAvatarUploadError={setError}
                  onAvatarRemove={handleAvatarRemove}
                  onProfileSkillsChange={(skills) =>
                    setProfileForm((prev) => ({ ...prev, skills }))
                  }
                  onHolidayChange={handleHolidayChange}
                  onRemoveHoliday={removeHoliday}
                  onAddHoliday={addHoliday}
                />
              ) : null}

              {activePanel === "projects" ? (
                <ProjectsPanel
                  loading={loading}
                  saving={saving}
                  showCreateProjectForm={showCreateProjectForm}
                  projectForm={projectForm}
                  assignableEngineers={assignableEngineers}
                  selectedTeam={selectedTeam}
                  sortedActiveProjects={sortedActiveProjects}
                  sortedArchivedProjects={sortedArchivedProjects}
                  editingProjectId={editingProjectId}
                  projectSortBy={projectSortBy}
                  projectSortDirection={projectSortDirection}
                  onExportCsv={downloadAdminCsv}
                  onOpenCreateProjectForm={openCreateProjectForm}
                  onCloseCreateProjectForm={closeCreateProjectForm}
                  onProjectFieldChange={handleProjectFieldChange}
                  onProjectTeamChange={handleProjectTeamChange}
                  onSubmitProject={submitProject}
                  onSortByChange={setProjectSortBy}
                  onSortDirectionChange={setProjectSortDirection}
                  onEditProject={beginEdit}
                  onOpenProjectTasks={(project) =>
                    openTasksPanel({
                      projectId: project?.id || "all",
                      infoMessage: project ? `Showing tasks for ${project.name}.` : "",
                    })
                  }
                  onArchiveProject={archiveProject}
                  onDeleteProject={deleteProject}
                  onResetProjectForm={resetProjectForm}
                />
              ) : null}

              {activePanel === "tasks" ? (
                <TasksPanel
                  loading={loading}
                  saving={saving}
                  showCreateTaskForm={showCreateTaskForm}
                  taskForm={taskForm}
                  projectOptions={taskProjectOptions}
                  assigneeOptions={taskAssigneeOptions}
                  filterAssigneeOptions={taskFilterAssigneeOptions}
                  parentTaskOptions={taskParentOptions}
                  filteredTasks={filteredTasks}
                  editingTaskId={editingTaskId}
                  taskProjectFilter={taskProjectFilter}
                  taskAssigneeFilter={taskAssigneeFilter}
                  taskCompletionFilter={taskCompletionFilter}
                  taskDueFilter={taskDueFilter}
                  taskSearch={taskSearch}
                  onOpenCreateTaskForm={() => openCreateTaskForm()}
                  onCloseCreateTaskForm={closeCreateTaskForm}
                  onTaskFieldChange={handleTaskFieldChange}
                  onSubmitTask={submitTask}
                  onEditTask={beginEditTask}
                  onDeleteTask={deleteTask}
                  onToggleTaskCompleted={toggleTaskCompleted}
                  onTaskProjectFilterChange={setTaskProjectFilter}
                  onTaskAssigneeFilterChange={setTaskAssigneeFilter}
                  onTaskCompletionFilterChange={setTaskCompletionFilter}
                  onTaskDueFilterChange={setTaskDueFilter}
                  onTaskSearchChange={setTaskSearch}
                  onResetTaskForm={() => resetTaskForm()}
                />
              ) : null}

              {activePanel === "audit" ? (
                <AuditPanel
                  auditLogs={auditLogs}
                  filteredAuditLogs={filteredAuditLogs}
                  auditActionFilter={auditActionFilter}
                  auditActionOptions={auditActionOptions}
                  onAuditActionFilterChange={setAuditActionFilter}
                />
              ) : null}
            </Stack>
          </Box>
      </Paper>
    </AppPageShell>
  );
}
