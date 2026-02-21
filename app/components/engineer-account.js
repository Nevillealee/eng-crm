"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Cropper from "react-easy-crop";
import {
  Alert,
  Avatar,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ENGINEER_SKILL_OPTIONS } from "../constants/engineer-skills";
import getCroppedImage from "../signup/crop-image";

const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "partially_allocated", label: "Partially allocated" },
  { value: "unavailable", label: "Unavailable" },
];
const skillOptionSet = new Set(ENGINEER_SKILL_OPTIONS);
const placeholderAvatar = "/images/nonbinary-avatar.svg";

function emptyHoliday() {
  return { label: "", startDate: "", endDate: "" };
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

function formatDateLabel(value) {
  if (!value) {
    return "TBD";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
        const holidays = Array.isArray(profile.upcomingHolidays)
          ? profile.upcomingHolidays
          : [];

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

  const handleCropComplete = (_, croppedPixels) => {
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

  const toBase64 = async (blob) => {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
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
    await signOut({ callbackUrl: "/login" });
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
          <Box
            sx={{
              width: { xs: "100%", md: 280 },
              borderRight: { xs: "none", md: "1px solid" },
              borderBottom: { xs: "1px solid", md: "none" },
              borderColor: "divider",
              p: 3,
            }}
          >
            <Stack sx={{ minHeight: { md: 560 } }} spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="overline" color="text.secondary">
                  Devcombine Engineering Portal
                </Typography>
                <Typography variant="h6">Account</Typography>
              </Stack>
              <Button
                type="button"
                variant={activePanel === "personal" ? "contained" : "text"}
                onClick={() => setActivePanel("personal")}
                disabled={saving}
              >
                Personal information
              </Button>
              <Button
                type="button"
                variant={activePanel === "projects" ? "contained" : "text"}
                onClick={() => setActivePanel("projects")}
                disabled={saving}
              >
                Projects
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button type="button" variant="outlined" onClick={handleSignOut}>
                Sign out
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
            <Stack spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {info ? <Alert severity="success">{info}</Alert> : null}

              {activePanel === "personal" ? (
                <Box component="form" onSubmit={handleSaveProfile} noValidate>
                  <Stack spacing={2}>
                    <Typography variant="h5">Personal information</Typography>
                    <Typography color="text.secondary">
                      Update your skillset and availability details.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={avatarPreview || placeholderAvatar}
                        sx={{ width: 64, height: 64 }}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        component="label"
                        disabled={loading || saving}
                      >
                        Upload avatar
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          onChange={handleImageSelection}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        color="error"
                        onClick={handleAvatarRemove}
                        disabled={loading || saving || (!avatarPreview && !avatarBlob)}
                      >
                        Remove avatar
                      </Button>
                    </Stack>
                    <Autocomplete
                      multiple
                      options={ENGINEER_SKILL_OPTIONS}
                      value={form.skills}
                      onChange={(_, value) =>
                        setForm((prev) => ({ ...prev, skills: value }))
                      }
                      filterSelectedOptions
                      disabled={loading || saving}
                      renderInput={(params) => (
                        <TextField {...params} label="Skills" fullWidth />
                      )}
                    />
                    <TextField
                      select
                      label="Availability status"
                      name="availabilityStatus"
                      value={form.availabilityStatus}
                      onChange={handleFieldChange}
                      disabled={loading || saving}
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
                      value={form.availabilityNote}
                      onChange={handleFieldChange}
                      disabled={loading || saving}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
                      {form.upcomingHolidays.map((holiday, index) => (
                        <Stack
                          key={`holiday-${index}`}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                        >
                          <TextField
                            label="Label"
                            value={holiday.label}
                            onChange={(event) =>
                              handleHolidayChange(index, "label", event.target.value)
                            }
                            disabled={loading || saving}
                            fullWidth
                          />
                          <TextField
                            label="Start date"
                            type="date"
                            value={holiday.startDate}
                            onChange={(event) =>
                              handleHolidayChange(index, "startDate", event.target.value)
                            }
                            disabled={loading || saving}
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            label="End date"
                            type="date"
                            value={holiday.endDate}
                            onChange={(event) =>
                              handleHolidayChange(index, "endDate", event.target.value)
                            }
                            disabled={loading || saving}
                            InputLabelProps={{ shrink: true }}
                          />
                          <IconButton
                            aria-label="Remove holiday"
                            onClick={() => removeHoliday(index)}
                            disabled={loading || saving}
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
                          disabled={loading || saving}
                        >
                          Add holiday
                        </Button>
                      </Box>
                    </Stack>
                    <Box>
                      <Button type="submit" variant="contained" disabled={loading || saving}>
                        {saving ? "Saving..." : "Save profile"}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              ) : null}

              {activePanel === "projects" ? (
                <Box>
                  <Stack spacing={2}>
                    <Typography variant="h5">Projects</Typography>
                    <Typography color="text.secondary">
                      Ongoing projects assigned to you.
                    </Typography>
                    {projectsLoading ? (
                      <Typography color="text.secondary">Loading projects...</Typography>
                    ) : null}
                    {!projectsLoading && projects.length === 0 ? (
                      <Alert severity="info">No ongoing projects assigned yet.</Alert>
                    ) : null}
                    {!projectsLoading && projects.length > 0
                      ? projects.map((project) => (
                          <Paper
                            key={project.id}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Stack spacing={1}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                justifyContent="space-between"
                              >
                                <Typography variant="h6">{project.name}</Typography>
                                <Chip
                                  size="small"
                                  color="primary"
                                  label={project.status}
                                  sx={{ textTransform: "capitalize", width: "fit-content" }}
                                />
                              </Stack>
                              <Typography color="text.secondary">
                                Client: {project.clientName}
                              </Typography>
                              <Typography color="text.secondary">
                                Duration: {formatDateLabel(project.startDate)} -{" "}
                                {formatDateLabel(project.endDate)}
                              </Typography>
                              <Typography color="text.secondary">
                                Team:{" "}
                                {Array.isArray(project.teamMembers) && project.teamMembers.length
                                  ? project.teamMembers.map((member) => member.name).join(", ")
                                  : "No team members assigned"}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))
                      : null}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Container>
      <Dialog
        open={cropDialogOpen}
        onClose={handleCropCancel}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Adjust your avatar</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ position: "relative", height: 300, bgcolor: "grey.100", borderRadius: 1 }}>
            {selectedImage ? (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            ) : null}
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Zoom</Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) => setZoom(Array.isArray(value) ? value[0] : value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel}>Cancel</Button>
          <Button onClick={handleCropSave} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
