"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Alert, Box, Container, Paper, Stack } from "@mui/material";
import { emptyHoliday, nextDateInputValue, skillOptionSet } from "../profile-form-shared";
import AccountNavigation from "./account-navigation";
import { formatDateLabel } from "./formatters";
import PersonalPanel from "./personal-panel";
import ProjectsPanel from "./projects-panel";

export default function EngineerAccount() {
  const [activePanel, setActivePanel] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [projects, setProjects] = useState([]);
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

    loadProfile();
    loadProjects();

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
            minHeight: { xs: "auto", md: 620 },
            overflow: "hidden",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
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
                />
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
