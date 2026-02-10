"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Container,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuIcon from "@mui/icons-material/Menu";
import { ENGINEER_SKILL_OPTIONS } from "../constants/engineer-skills";
import { PROJECT_CURRENCIES } from "../constants/project-currencies";
import ProjectForm from "./admin/project-form";
import ProjectList from "./admin/project-list";

const statusOptions = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "partially_allocated", label: "Partially allocated" },
  { value: "unavailable", label: "Unavailable" },
];

const availabilityColorByValue = {
  available: "success",
  partially_allocated: "warning",
  unavailable: "default",
};

function availabilityLabel(value) {
  return availabilityOptions.find((option) => option.value === value)?.label || "Unknown";
}

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

const projectSortByOptions = [
  { value: "date", label: "Date" },
  { value: "cost", label: "Cost" },
];

const projectSortDirectionOptions = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const AUDIT_DESKTOP_VISIBLE_ROWS = 4;
const AUDIT_ROW_ESTIMATED_HEIGHT = 108;
const AUDIT_ROW_GAP = 12;
const AUDIT_DESKTOP_MAX_HEIGHT =
  AUDIT_DESKTOP_VISIBLE_ROWS * AUDIT_ROW_ESTIMATED_HEIGHT +
  (AUDIT_DESKTOP_VISIBLE_ROWS - 1) * AUDIT_ROW_GAP;

const skillOptionSet = new Set(ENGINEER_SKILL_OPTIONS);

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

function nextDateInputValue(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map((item) => Number.parseInt(item, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

function emptyProjectForm() {
  return {
    name: "",
    clientName: "",
    costPhp: "0",
    currencyCode: "PHP",
    status: "ongoing",
    startDate: "",
    endDate: "",
    adminNotes: "",
    teamMemberIds: [],
  };
}

function emptyHoliday() {
  return { label: "", startDate: "", endDate: "" };
}

function withEngineerDrafts(engineers) {
  return engineers.map((engineer) => ({
    ...engineer,
    monthlySalaryPhpDraft:
      typeof engineer.monthlySalaryPhp === "number" ? String(engineer.monthlySalaryPhp) : "",
    salaryNotesDraft: engineer.salaryNotes || "",
  }));
}

function formatLastLogin(value) {
  if (!value) {
    return "Never";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Never";
  }
  return parsed.toLocaleString();
}

function formatMonthlySalaryPhp(value) {
  if (typeof value !== "number") {
    return "Not set";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAuditTimestamp(value) {
  if (!value) {
    return "Unknown";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }
  return parsed.toLocaleString();
}

function formatHolidayDate(value) {
  if (typeof value !== "string") {
    return "TBD";
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  return parsed.toLocaleDateString();
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm());
  const [engineerSearch, setEngineerSearch] = useState("");
  const [engineerCityFilter, setEngineerCityFilter] = useState("all");
  const [engineerAvailabilityFilter, setEngineerAvailabilityFilter] = useState("all");
  const [salarySavingEngineerId, setSalarySavingEngineerId] = useState("");
  const [editingEngineerCompId, setEditingEngineerCompId] = useState("");
  const [expandedHolidayEngineerId, setExpandedHolidayEngineerId] = useState("");
  const [projectSortBy, setProjectSortBy] = useState("date");
  const [projectSortDirection, setProjectSortDirection] = useState("desc");
  const [profileForm, setProfileForm] = useState({
    city: "",
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  });
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
      [...new Set(engineers.map((engineer) => engineer.city).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [engineers]
  );

  const filteredEngineers = useMemo(() => {
    const query = engineerSearch.trim().toLowerCase();
    return engineers.filter((engineer) => {
      if (engineerCityFilter !== "all" && (engineer.city || "") !== engineerCityFilter) {
        return false;
      }
      if (
        engineerAvailabilityFilter !== "all" &&
        (engineer.availabilityStatus || "") !== engineerAvailabilityFilter
      ) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [
        engineer.email,
        engineer.firstName,
        engineer.lastName,
        engineer.name,
        engineer.city,
        ...(Array.isArray(engineer.skills) ? engineer.skills : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
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
        const [engineerResponse, projectsResponse, profileResponse, auditLogResponse] = await Promise.all([
          fetch("/api/admin/engineers"),
          fetch("/api/projects"),
          fetch("/api/profile"),
          fetch("/api/admin/audit-logs?limit=100"),
        ]);

        const engineerPayload = await engineerResponse.json().catch(() => ({}));
        const projectsPayload = await projectsResponse.json().catch(() => ({}));
        const profilePayload = await profileResponse.json().catch(() => ({}));
        const auditLogPayload = await auditLogResponse.json().catch(() => ({}));

        if (!engineerResponse.ok) {
          throw new Error(engineerPayload?.error || "Unable to load engineers.");
        }

        if (!projectsResponse.ok) {
          throw new Error(projectsPayload?.error || "Unable to load projects.");
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
        const holidays = Array.isArray(profile.upcomingHolidays)
          ? profile.upcomingHolidays
          : [];

        setEngineers(
          withEngineerDrafts(Array.isArray(engineerPayload?.engineers) ? engineerPayload.engineers : [])
        );
        setProjects(Array.isArray(projectsPayload?.projects) ? projectsPayload.projects : []);
        setAuditLogs(Array.isArray(auditLogPayload?.logs) ? auditLogPayload.logs : []);
        setProfileForm({
          city: profile.city || "",
          skills: Array.isArray(profile.skills)
            ? profile.skills.filter((skill) => skillOptionSet.has(skill))
            : [],
          availabilityStatus: profile.availabilityStatus || "available",
          availabilityNote: profile.availabilityNote || "",
          upcomingHolidays: holidays.length ? holidays : [emptyHoliday()],
        });
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
    await signOut({ callbackUrl: "/login" });
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
      status: project.status || "ongoing",
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
        status: projectForm.status,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || null,
        adminNotes: projectForm.adminNotes,
        teamMemberIds: projectForm.teamMemberIds,
      };

      const isEditing = Boolean(editingProjectId);
      const response = await fetch(
        isEditing ? `/api/projects/${editingProjectId}` : "/api/projects",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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
        body: JSON.stringify({ status: "archived" }),
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
      prev.map((engineer) =>
        engineer.id === engineerId ? { ...engineer, [key]: value } : engineer
      )
    );
  };

  const beginEditEngineerComp = (engineerId) => {
    setEngineers((prev) =>
      prev.map((engineer) =>
        engineer.id === engineerId
          ? {
              ...engineer,
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
          monthlySalaryPhp: engineer.monthlySalaryPhpDraft === "" ? null : engineer.monthlySalaryPhpDraft,
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

      setInfo("Engineer compensation updated.");
      setEditingEngineerCompId("");
    } catch (saveError) {
      setError(saveError.message || "Unable to update engineer salary.");
    } finally {
      setSalarySavingEngineerId("");
    }
  };

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
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
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: profileForm.city,
          skills: profileForm.skills,
          availabilityStatus: profileForm.availabilityStatus,
          availabilityNote: profileForm.availabilityNote,
          upcomingHolidays: profileForm.upcomingHolidays.filter(
            (item) => item.label || item.startDate || item.endDate
          ),
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Unable to save profile.");
      }

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

  const navigationItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "engineers", label: "Engineers" },
    { id: "personal", label: "Personal information" },
    { id: "projects", label: "Projects" },
    { id: "audit", label: "Audit log" },
  ];

  const selectPanel = (panelId) => {
    setActivePanel(panelId);
    setMobileNavOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background: "linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <Box sx={{ width: 280, p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack spacing={0.5}>
                <Typography variant="overline" color="text.secondary">
                  ENG CRM
                </Typography>
                <Typography variant="h6">Admin</Typography>
              </Stack>
              {navigationItems.map((item) => (
                <Button
                  key={`mobile-nav-${item.id}`}
                  type="button"
                  variant={activePanel === item.id ? "contained" : "text"}
                  onClick={() => selectPanel(item.id)}
                  disabled={saving || profileSaving}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleSignOut();
                }}
                fullWidth
                sx={{ mt: "auto", mb: 1 }}
              >
                Sign out
              </Button>
            </Stack>
          </Box>
        </Drawer>
        <Paper
          sx={{
            display: "flex",
            alignItems: "stretch",
            minHeight: { xs: "auto", md: 700 },
            overflow: "hidden",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignSelf: "stretch",
              width: 280,
              minHeight: { md: "100%" },
              borderRight: "1px solid",
              borderBottom: "none",
              borderColor: "divider",
              p: 3,
            }}
          >
            <Stack
              sx={{ flex: 1, minHeight: { md: "100%" } }}
              spacing={2}
              useFlexGap
            >
              <Stack spacing={0.5}>
                <Typography variant="overline" color="text.secondary">
                  ENG CRM
                </Typography>
                <Typography variant="h6">Admin</Typography>
              </Stack>
              {navigationItems.map((item) => (
                <Button
                  key={`desktop-nav-${item.id}`}
                  type="button"
                  variant={activePanel === item.id ? "contained" : "text"}
                  onClick={() => setActivePanel(item.id)}
                  disabled={saving || profileSaving}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outlined"
                onClick={handleSignOut}
                fullWidth
                sx={{ mt: "auto", mb: 1 }}
              >
                Sign out
              </Button>
            </Stack>
          </Box>

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
                    ENG CRM
                  </Typography>
                  <Typography variant="h6">Admin</Typography>
                </Stack>
                <IconButton
                  aria-label="Open navigation menu"
                  onClick={() => setMobileNavOpen(true)}
                  disabled={saving || profileSaving}
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

              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 1.25, sm: 2 },
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                <ButtonBase
                  type="button"
                  onClick={() => openEngineersPanel("all")}
                  sx={{
                    borderRadius: 4,
                    textAlign: "left",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 1.25, sm: 2 },
                      width: "100%",
                      height: { xs: 105, sm: 120 },
                      transition: "border-color 180ms ease, box-shadow 180ms ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                    }}
                  >
                    <Stack sx={{ height: "100%" }} justifyContent="space-between">
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{
                          minHeight: { xs: 34, sm: 40 },
                          lineHeight: 1.2,
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        }}
                      >
                        Engineers
                      </Typography>
                      <Typography variant="h4">{engineers.length}</Typography>
                    </Stack>
                  </Paper>
                </ButtonBase>
                <ButtonBase
                  type="button"
                  onClick={openProjectsPanel}
                  sx={{
                    borderRadius: 4,
                    textAlign: "left",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 1.25, sm: 2 },
                      width: "100%",
                      height: { xs: 105, sm: 120 },
                      transition: "border-color 180ms ease, box-shadow 180ms ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                    }}
                  >
                    <Stack sx={{ height: "100%" }} justifyContent="space-between">
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{
                          minHeight: { xs: 34, sm: 40 },
                          lineHeight: 1.2,
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        }}
                      >
                        Projects
                      </Typography>
                      <Typography variant="h4">{projects.length}</Typography>
                    </Stack>
                  </Paper>
                </ButtonBase>
                <ButtonBase
                  type="button"
                  onClick={() => openEngineersPanel("available")}
                  sx={{
                    borderRadius: 4,
                    textAlign: "left",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 1.25, sm: 2 },
                      width: "100%",
                      height: { xs: 105, sm: 120 },
                      transition: "border-color 180ms ease, box-shadow 180ms ease",
                      "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                    }}
                  >
                    <Stack sx={{ height: "100%" }} justifyContent="space-between">
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{
                          minHeight: { xs: 34, sm: 40 },
                          lineHeight: 1.2,
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        }}
                      >
                        Available engineers
                      </Typography>
                      <Typography variant="h4">{availableEngineerCount}</Typography>
                    </Stack>
                  </Paper>
                </ButtonBase>
              </Box>

              {activePanel === "dashboard" ? (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={1}>
                    <Typography variant="h5">Dashboard</Typography>
                    <Typography color="text.secondary">
                      Use the sidebar to switch between profile and project management.
                    </Typography>
                  </Stack>
                </Paper>
              ) : null}

              {activePanel === "engineers" ? (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Typography variant="h5">Engineers</Typography>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => downloadAdminCsv("/api/admin/export/engineers")}
                        disabled={loading || salarySavingEngineerId !== ""}
                      >
                        Export CSV
                      </Button>
                    </Stack>
                    <Typography color="text.secondary">
                      Review staffing, compensation, and recent engineer activity details.
                    </Typography>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Search engineers"
                        value={engineerSearch}
                        onChange={(event) => setEngineerSearch(event.target.value)}
                        fullWidth
                      />
                      <TextField
                        select
                        label="City"
                        value={engineerCityFilter}
                        onChange={(event) => setEngineerCityFilter(event.target.value)}
                        sx={{ minWidth: { md: 220 } }}
                      >
                        <MenuItem value="all">All cities</MenuItem>
                        {cityFilterOptions.map((city) => (
                          <MenuItem key={city} value={city}>
                            {city}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Availability"
                        value={engineerAvailabilityFilter}
                        onChange={(event) => setEngineerAvailabilityFilter(event.target.value)}
                        sx={{ minWidth: { md: 220 } }}
                      >
                        <MenuItem value="all">All statuses</MenuItem>
                        {availabilityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>

                    {filteredEngineers.length === 0 ? (
                      <Alert severity="info">No engineers match current filters.</Alert>
                    ) : null}

                    {filteredEngineers.map((engineer) => (
                      <Paper key={engineer.id} variant="outlined" sx={{ p: 2 }}>
                        {(() => {
                          const isEditingComp = editingEngineerCompId === engineer.id;
                          const holidayItems = Array.isArray(engineer.upcomingHolidays)
                            ? engineer.upcomingHolidays
                            : [];
                          const isHolidayExpanded = expandedHolidayEngineerId === engineer.id;
                          return (
                        <Stack spacing={1.5}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            justifyContent="flex-start"
                            sx={{ minWidth: 0 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{ minWidth: 0, flex: 1 }}
                            >
                              <Avatar src={engineer.image || undefined}>
                                {(engineer.firstName || engineer.email || "U").slice(0, 1).toUpperCase()}
                              </Avatar>
                              <Stack sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="h6"
                                  sx={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                                >
                                  {engineer.name ||
                                    `${engineer.firstName || ""} ${engineer.lastName || ""}`.trim() ||
                                    engineer.email}
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  sx={{ overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
                                >
                                  {engineer.email}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                              size="small"
                              color={availabilityColorByValue[engineer.availabilityStatus] || "default"}
                              label={`Availability: ${availabilityLabel(engineer.availabilityStatus)}`}
                            />
                            {engineer.city ? (
                              <Chip size="small" variant="outlined" label={`City: ${engineer.city}`} />
                            ) : null}
                          </Stack>
                          <Typography color="text.secondary">
                            Skills:{" "}
                            {Array.isArray(engineer.skills) && engineer.skills.length
                              ? engineer.skills.join(", ")
                              : "None"}
                          </Typography>
                          {engineer.availabilityNote ? (
                            <Typography color="text.secondary">
                              Availability note: {engineer.availabilityNote}
                            </Typography>
                          ) : null}
                          <Stack spacing={0.5}>
                            <Button
                              type="button"
                              variant="text"
                              onClick={() =>
                                setExpandedHolidayEngineerId((prev) =>
                                  prev === engineer.id ? "" : engineer.id
                                )
                              }
                              sx={{
                                alignSelf: "flex-start",
                                px: 0,
                                minWidth: 0,
                                textTransform: "none",
                              }}
                            >
                              Upcoming holidays: {holidayItems.length}
                            </Button>
                            <Collapse in={isHolidayExpanded} timeout="auto" unmountOnExit>
                              {holidayItems.length ? (
                                <Stack spacing={0.5}>
                                  {holidayItems.map((holiday, index) => (
                                    <Typography
                                      key={`engineer-holiday-${engineer.id}-${index}`}
                                      color="text.secondary"
                                      sx={{ pl: 1 }}
                                    >
                                      {(holiday?.label || "Holiday").trim()}:{" "}
                                      {formatHolidayDate(holiday?.startDate)} -{" "}
                                      {formatHolidayDate(holiday?.endDate)}
                                    </Typography>
                                  ))}
                                </Stack>
                              ) : (
                                <Typography color="text.secondary" sx={{ pl: 1 }}>
                                  No upcoming holidays
                                </Typography>
                              )}
                            </Collapse>
                          </Stack>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }}>
                            <Typography color="text.secondary">
                              Last login: {formatLastLogin(engineer.lastLogin)}
                            </Typography>
                            <Typography color="text.secondary">
                              Last login IP: {engineer.lastLoginIp || "N/A"}
                            </Typography>
                          </Stack>
                          {!isEditingComp ? (
                            <Stack spacing={1}>
                              <Typography color="text.secondary">
                                Monthly salary (PHP): {formatMonthlySalaryPhp(engineer.monthlySalaryPhp)}
                              </Typography>
                              <Typography color="text.secondary">
                                Salary notes: {engineer.salaryNotes || "None"}
                              </Typography>
                              <Box>
                                <Button
                                  type="button"
                                  variant="outlined"
                                  onClick={() => beginEditEngineerComp(engineer.id)}
                                >
                                  Edit
                                </Button>
                              </Box>
                            </Stack>
                          ) : (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                              <TextField
                                label="Monthly salary (PHP)"
                                type="number"
                                value={engineer.monthlySalaryPhpDraft}
                                onChange={(event) =>
                                  updateEngineerDraft(
                                    engineer.id,
                                    "monthlySalaryPhpDraft",
                                    event.target.value
                                  )
                                }
                                inputProps={{ min: 0, step: 1 }}
                                sx={{ minWidth: { sm: 220 } }}
                              />
                              <TextField
                                label="Salary notes"
                                value={engineer.salaryNotesDraft}
                                onChange={(event) =>
                                  updateEngineerDraft(engineer.id, "salaryNotesDraft", event.target.value)
                                }
                                fullWidth
                              />
                              <Button
                                type="button"
                                variant="outlined"
                                onClick={() => saveEngineerCompensation(engineer.id)}
                                disabled={salarySavingEngineerId === engineer.id}
                              >
                                {salarySavingEngineerId === engineer.id ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                type="button"
                                variant="text"
                                onClick={() => cancelEditEngineerComp(engineer.id)}
                                disabled={salarySavingEngineerId === engineer.id}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          )}
                        </Stack>
                          );
                        })()}
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              ) : null}

              {activePanel === "personal" ? (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h5">Personal information</Typography>
                    <Box component="form" onSubmit={savePersonalInfo} noValidate>
                      <Stack spacing={2}>
                        <TextField label="Email" value={session?.user?.email || ""} disabled fullWidth />
                        <TextField
                          label="City"
                          name="city"
                          value={profileForm.city}
                          onChange={handleProfileFieldChange}
                          disabled={loading || profileSaving}
                          fullWidth
                        />
                        <Autocomplete
                          multiple
                          options={ENGINEER_SKILL_OPTIONS}
                          value={profileForm.skills}
                          onChange={(_event, value) =>
                            setProfileForm((prev) => ({ ...prev, skills: value }))
                          }
                          filterSelectedOptions
                          disabled={loading || profileSaving}
                          renderInput={(params) => <TextField {...params} label="Skills" fullWidth />}
                        />
                        <TextField
                          select
                          label="Availability status"
                          name="availabilityStatus"
                          value={profileForm.availabilityStatus}
                          onChange={handleProfileFieldChange}
                          disabled={loading || profileSaving}
                          fullWidth
                        >
                          {availabilityOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Availability note"
                          name="availabilityNote"
                          value={profileForm.availabilityNote}
                          onChange={handleProfileFieldChange}
                          disabled={loading || profileSaving}
                          multiline
                          minRows={2}
                          fullWidth
                        />
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
                          {profileForm.upcomingHolidays.map((holiday, index) => (
                            <Stack
                              key={`admin-holiday-${index}`}
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                            >
                              <TextField
                                label="Label"
                                value={holiday.label}
                                onChange={(event) =>
                                  handleHolidayChange(index, "label", event.target.value)
                                }
                                disabled={loading || profileSaving}
                                fullWidth
                              />
                              <TextField
                                label="Start date"
                                type="date"
                                value={holiday.startDate}
                                onChange={(event) =>
                                  handleHolidayChange(index, "startDate", event.target.value)
                                }
                                disabled={loading || profileSaving}
                                InputLabelProps={{ shrink: true }}
                              />
                              <TextField
                                label="End date"
                                type="date"
                                value={holiday.endDate}
                                onChange={(event) =>
                                  handleHolidayChange(index, "endDate", event.target.value)
                                }
                                disabled={loading || profileSaving}
                                InputLabelProps={{ shrink: true }}
                              />
                              <IconButton
                                aria-label="Remove holiday"
                                onClick={() => removeHoliday(index)}
                                disabled={loading || profileSaving}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Stack>
                          ))}
                          <Box>
                            <Button
                              type="button"
                              variant="outlined"
                              onClick={addHoliday}
                              disabled={loading || profileSaving}
                            >
                              Add holiday
                            </Button>
                          </Box>
                        </Stack>
                        <Box>
                          <Button type="submit" variant="contained" disabled={loading || profileSaving}>
                            {profileSaving ? "Saving..." : "Save personal information"}
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              ) : null}

              {activePanel === "projects" ? (
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "center" }}
                      >
                        <Typography variant="h5">Projects</Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() => downloadAdminCsv("/api/admin/export/projects")}
                            disabled={loading || saving}
                          >
                            Export CSV
                          </Button>
                          {!showCreateProjectForm ? (
                            <Button
                              type="button"
                              variant="contained"
                              onClick={openCreateProjectForm}
                              disabled={loading || saving}
                            >
                              Create project
                            </Button>
                          ) : null}
                        </Stack>
                      </Stack>
                      {showCreateProjectForm ? (
                        <ProjectForm
                          loading={loading}
                          saving={saving}
                          editingProjectId=""
                          showCancel
                          cancelLabel="Cancel"
                          form={projectForm}
                          statusOptions={statusOptions}
                          currencyOptions={PROJECT_CURRENCIES}
                          engineers={assignableEngineers}
                          selectedTeam={selectedTeam}
                          onFieldChange={handleProjectFieldChange}
                          onTeamChange={(value) =>
                            setProjectForm((prev) => ({
                              ...prev,
                              teamMemberIds: value.map((item) => item.id),
                            }))
                          }
                          onSubmit={submitProject}
                          onCancelEdit={closeCreateProjectForm}
                        />
                      ) : null}
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Typography variant="subtitle1">Sort active projects</Typography>
                      <TextField
                        select
                        label="Sort by"
                        value={projectSortBy}
                        onChange={(event) => setProjectSortBy(event.target.value)}
                        size="small"
                        sx={{ minWidth: 160 }}
                      >
                        {projectSortByOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Direction"
                        value={projectSortDirection}
                        onChange={(event) => setProjectSortDirection(event.target.value)}
                        size="small"
                        sx={{ minWidth: 160 }}
                      >
                        {projectSortDirectionOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Paper>
                  <ProjectList
                    title="Active projects"
                    emptyMessage="No active projects."
                    projects={sortedActiveProjects}
                    saving={saving}
                    onEdit={beginEdit}
                    onArchive={archiveProject}
                    loading={loading}
                    editingProjectId={editingProjectId}
                    editForm={projectForm}
                    statusOptions={statusOptions}
                    currencyOptions={PROJECT_CURRENCIES}
                    engineers={assignableEngineers}
                    selectedTeam={selectedTeam}
                    onFieldChange={handleProjectFieldChange}
                    onTeamChange={(value) =>
                      setProjectForm((prev) => ({
                        ...prev,
                        teamMemberIds: value.map((item) => item.id),
                      }))
                    }
                    onSubmit={submitProject}
                    onCancelEdit={resetProjectForm}
                  />
                  <ProjectList
                    title="Archived projects"
                    emptyMessage="No archived projects."
                    projects={sortedArchivedProjects}
                    saving={saving}
                    onEdit={beginEdit}
                    onArchive={archiveProject}
                    showArchiveButton={false}
                    showEditButton={false}
                    showDeleteButton
                    onDelete={deleteProject}
                  />
                </Stack>
              ) : null}

              {activePanel === "audit" ? (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h5">Audit log</Typography>
                    <Typography color="text.secondary">
                      Showing {filteredAuditLogs.length} of {auditLogs.length} entries.
                    </Typography>
                    <TextField
                      select
                      label="Filter by action"
                      value={auditActionFilter}
                      onChange={(event) => setAuditActionFilter(event.target.value)}
                      size="small"
                      sx={{ maxWidth: 320 }}
                    >
                      <MenuItem value="all">All actions</MenuItem>
                      {auditActionOptions.map((action) => (
                        <MenuItem key={action} value={action}>
                          {action}
                        </MenuItem>
                      ))}
                    </TextField>
                    {filteredAuditLogs.length === 0 ? (
                      <Alert severity="info">
                        {auditLogs.length === 0
                          ? "No audit entries yet."
                          : "No audit entries match this action filter."}
                      </Alert>
                    ) : (
                      <Box
                        sx={{
                          maxHeight: {
                            xs: "none",
                            md:
                              filteredAuditLogs.length > AUDIT_DESKTOP_VISIBLE_ROWS
                                ? AUDIT_DESKTOP_MAX_HEIGHT
                                : "none",
                          },
                          overflowY: {
                            xs: "visible",
                            md:
                              filteredAuditLogs.length > AUDIT_DESKTOP_VISIBLE_ROWS
                                ? "auto"
                                : "visible",
                          },
                          pr: {
                            xs: 0,
                            md: filteredAuditLogs.length > AUDIT_DESKTOP_VISIBLE_ROWS ? 1 : 0,
                          },
                          scrollbarGutter: "stable",
                          overscrollBehavior: "contain",
                        }}
                      >
                        <Stack spacing={1.5}>
                          {filteredAuditLogs.map((entry) => (
                            <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
                              <Stack spacing={1}>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
                                  justifyContent="space-between"
                                  alignItems={{ xs: "flex-start", sm: "center" }}
                                >
                                  <Typography variant="subtitle2">{entry.summary}</Typography>
                                  <Chip size="small" variant="outlined" label={entry.action} />
                                </Stack>
                                <Typography color="text.secondary">
                                  Actor: {entry.actorEmail || "Unknown"}
                                </Typography>
                                <Typography color="text.secondary">
                                  Target: {entry.targetType}
                                  {(entry.targetValue || entry.targetId)
                                    ? ` (${entry.targetValue || entry.targetId})`
                                    : ""}
                                </Typography>
                                <Typography color="text.secondary">
                                  Time: {formatAuditTimestamp(entry.createdAt)}
                                </Typography>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
