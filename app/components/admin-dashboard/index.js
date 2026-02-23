"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import MenuIcon from "@mui/icons-material/Menu";
import { Alert, Box, Container, IconButton, Paper, Stack, Typography } from "@mui/material";
import AvatarCropDialog from "../avatar-crop-dialog";
import {
  blobToBase64,
  emptyHoliday,
  nextDateInputValue,
  skillOptionSet,
} from "../profile-form-shared";
import getCroppedImage from "../../signup/crop-image";
import AuditPanel from "./panels/audit-panel";
import DashboardPanel from "./panels/dashboard-panel";
import EngineersPanel from "./panels/engineers-panel";
import PersonalPanel from "./panels/personal-panel";
import ProjectsPanel from "./panels/projects-panel";
import { filterEngineers } from "./shared/engineer-filters";
import AdminDashboardNavigation from "./shared/navigation";
import OverviewCards from "./shared/overview-cards";

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
    status: "ongoing",
    startDate: "",
    endDate: "",
    adminNotes: "",
    teamMemberIds: [],
  };
}

function withEngineerDrafts(engineers) {
  return engineers.map((engineer) => ({
    ...engineer,
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
  const [expandedProjectsEngineerId, setExpandedProjectsEngineerId] = useState("");
  const [projectSortBy, setProjectSortBy] = useState("date");
  const [projectSortDirection, setProjectSortDirection] = useState("desc");
  const [profileForm, setProfileForm] = useState({
    city: "",
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  });
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarType, setAvatarType] = useState("");
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const avatarPreviewObjectUrlRef = useRef(null);

  const revokeAvatarPreviewObjectUrl = () => {
    if (avatarPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      avatarPreviewObjectUrlRef.current = null;
    }
  };

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
        const holidays = Array.isArray(profile.upcomingHolidays) ? profile.upcomingHolidays : [];

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
        if (avatarPreviewObjectUrlRef.current) {
          URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
          avatarPreviewObjectUrlRef.current = null;
        }
        setAvatarPreview(typeof profile.image === "string" ? profile.image : "");
        setAvatarBlob(null);
        setAvatarType("");
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

  useEffect(() => {
    return () => {
      if (avatarPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
        avatarPreviewObjectUrlRef.current = null;
      }
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
      prev.map((engineer) => (engineer.id === engineerId ? { ...engineer, [key]: value } : engineer))
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

  const toggleEngineerHolidays = (engineerId) => {
    setExpandedHolidayEngineerId((prev) => (prev === engineerId ? "" : engineerId));
  };

  const toggleEngineerProjects = (engineerId) => {
    setExpandedProjectsEngineerId((prev) => (prev === engineerId ? "" : engineerId));
  };

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
        setCropDialogOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_event, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setSelectedImage("");
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      return;
    }

    try {
      const blob = await getCroppedImage(selectedImage, croppedAreaPixels);
      revokeAvatarPreviewObjectUrl();
      const previewUrl = URL.createObjectURL(blob);
      avatarPreviewObjectUrlRef.current = previewUrl;
      setAvatarBlob(blob);
      setAvatarPreview(previewUrl);
      setAvatarType("image/png");
      setAvatarRemoved(false);
      setCropDialogOpen(false);
      setSelectedImage("");
    } catch {
      setError("Unable to process the image. Please try another file.");
      setCropDialogOpen(false);
    }
  };

  const handleAvatarRemove = () => {
    revokeAvatarPreviewObjectUrl();
    setAvatarBlob(null);
    setAvatarType("");
    setAvatarPreview("");
    setAvatarRemoved(true);
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
      const avatarBase64 = avatarBlob ? await blobToBase64(avatarBlob) : null;
      const payloadBody = {
        city: profileForm.city,
        skills: profileForm.skills,
        availabilityStatus: profileForm.availabilityStatus,
        availabilityNote: profileForm.availabilityNote,
        upcomingHolidays: profileForm.upcomingHolidays.filter(
          (item) => item.label || item.startDate || item.endDate
        ),
      };

      if (avatarBase64) {
        payloadBody.avatar = avatarBase64;
        payloadBody.avatarType = avatarType || "image/png";
      } else if (avatarRemoved) {
        payloadBody.avatar = null;
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
      revokeAvatarPreviewObjectUrl();
      setAvatarPreview(typeof updatedImage === "string" ? updatedImage : "");
      setAvatarBlob(null);
      setAvatarType("");
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

  const selectPanel = (panelId) => {
    setActivePanel(panelId);
    setMobileNavOpen(false);
  };

  const disabled = saving || profileSaving;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background: "linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Paper
          sx={{
            display: "flex",
            alignItems: "stretch",
            minHeight: { xs: "auto", md: 700 },
            overflow: "hidden",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
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
                  avatarBlob={avatarBlob}
                  onSavePersonalInfo={savePersonalInfo}
                  onProfileFieldChange={handleProfileFieldChange}
                  onImageSelection={handleImageSelection}
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
                  onArchiveProject={archiveProject}
                  onDeleteProject={deleteProject}
                  onResetProjectForm={resetProjectForm}
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
      </Container>

      <AvatarCropDialog
        open={cropDialogOpen}
        image={selectedImage}
        crop={crop}
        zoom={zoom}
        onClose={handleCropCancel}
        onApply={handleCropSave}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
      />
    </Box>
  );
}
