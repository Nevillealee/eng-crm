"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Alert, Box, Container, Paper, Stack } from "@mui/material";
import AvatarCropDialog from "../avatar-crop-dialog";
import { emptyHoliday, nextDateInputValue, skillOptionSet } from "../profile-form-shared";
import getCroppedImage from "../../signup/crop-image";
import AccountNavigation from "./account-navigation";
import { formatDateLabel } from "./formatters";
import PersonalPanel from "./personal-panel";
import ProjectsPanel from "./projects-panel";

async function toBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export default function EngineerAccount() {
  const [activePanel, setActivePanel] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [projects, setProjects] = useState([]);
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
  const [form, setForm] = useState({
    skills: [],
    availabilityStatus: "available",
    availabilityNote: "",
    upcomingHolidays: [emptyHoliday()],
  });

  const revokeAvatarPreviewObjectUrl = () => {
    if (avatarPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      avatarPreviewObjectUrlRef.current = null;
    }
  };

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
          skills: Array.isArray(profile.skills)
            ? profile.skills.filter((skill) => skillOptionSet.has(skill))
            : [],
          availabilityStatus: profile.availabilityStatus || "available",
          availabilityNote: profile.availabilityNote || "",
          upcomingHolidays: holidays.length ? holidays : [emptyHoliday()],
        });
        setAvatarPreview(typeof profile.image === "string" ? profile.image : "");
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

  useEffect(() => {
    return () => {
      if (avatarPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
        avatarPreviewObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      const avatarBase64 = avatarBlob ? await toBase64(avatarBlob) : null;
      const payloadBody = {
        skills: form.skills,
        availabilityStatus: form.availabilityStatus,
        availabilityNote: form.availabilityNote,
        upcomingHolidays: form.upcomingHolidays.filter(
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

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save profile.");
      }

      const updatedImage = payload?.profile?.image;
      revokeAvatarPreviewObjectUrl();
      setAvatarPreview(typeof updatedImage === "string" ? updatedImage : "");
      setAvatarBlob(null);
      setAvatarType("");
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
                  avatarBlob={avatarBlob}
                  onSubmit={handleSaveProfile}
                  onFieldChange={handleFieldChange}
                  onImageSelection={handleImageSelection}
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
