"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  availabilityOptions,
  engineerSkillOptions,
  emptyHoliday,
  nextDateInputValue,
  skillOptionSet,
} from "./profile-form-shared";

export default function EngineerOnboardingWizard({ initialStep = 1 }) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 3));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
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
          throw new Error(payload?.error || "Unable to load onboarding data.");
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

        if (profile.onboardingCompleted) {
          router.replace("/engineer/account");
          return;
        }

        if (Number.isInteger(profile.onboardingStep)) {
          setStep(Math.min(Math.max(profile.onboardingStep, 1), 3));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Unable to load onboarding data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const persistProfile = async ({ nextStep, complete }) => {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: form.skills,
        availabilityStatus: form.availabilityStatus,
        availabilityNote: form.availabilityNote,
        upcomingHolidays: form.upcomingHolidays.filter(
          (item) => item.label || item.startDate || item.endDate
        ),
        onboardingStep: nextStep,
        onboardingCompleted: complete,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || "Unable to save onboarding data.");
    }
  };

  const goNext = async () => {
    setError("");
    setInfo("");

    if (step === 1 && form.skills.length === 0) {
      setError("Add at least one skill before continuing.");
      return;
    }

    const targetStep = Math.min(step + 1, 3);
    setSaving(true);
    try {
      await persistProfile({ nextStep: targetStep, complete: false });
      setStep(targetStep);
      setInfo("Progress saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save onboarding data.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = async () => {
    const targetStep = Math.max(step - 1, 1);
    setError("");
    setInfo("");
    setSaving(true);
    try {
      await persistProfile({ nextStep: targetStep, complete: false });
      setStep(targetStep);
    } catch (saveError) {
      setError(saveError.message || "Unable to save onboarding data.");
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    setError("");
    setInfo("");

    if (form.skills.length === 0) {
      setError("At least one skill is required to finish onboarding.");
      return;
    }

    setSaving(true);
    try {
      await persistProfile({ nextStep: 3, complete: true });
      // Use hard navigation so server-side gate checks the freshly persisted onboarding state.
      window.location.assign("/engineer/account");
    } catch (saveError) {
      setError(saveError.message || "Unable to finish onboarding.");
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
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)",
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Devcombine Engineering Portal
              </Typography>
              <Typography variant="h4">Engineer onboarding</Typography>
              <Typography color="text.secondary">
                Step {step} of 3. Complete onboarding to access your engineer account page.
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <Stack spacing={2}>
              {step === 1 ? (
                <Stack spacing={2}>
                  <Autocomplete
                    multiple
                    options={engineerSkillOptions}
                    value={form.skills}
                    onChange={(_, value) => setForm((prev) => ({ ...prev, skills: value }))}
                    filterSelectedOptions
                    disabled={loading || saving}
                    renderInput={(params) => <TextField {...params} label="Skills" fullWidth />}
                  />
                </Stack>
              ) : null}

              {step === 2 ? (
                <Stack spacing={2}>
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
                </Stack>
              ) : null}

              {step === 3 ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
                  {form.upcomingHolidays.map((holiday, index) => (
                    <Stack key={`holiday-${index}`} direction={{ xs: "column", md: "row" }} spacing={1}>
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
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                      <TextField
                        label="End date"
                        type="date"
                        value={holiday.endDate}
                        onChange={(event) =>
                          handleHolidayChange(index, "endDate", event.target.value)
                        }
                        disabled={loading || saving}
                        slotProps={{ inputLabel: { shrink: true } }}
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
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={goBack}
                  disabled={loading || saving || step === 1}
                >
                  Back
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={goNext}
                    disabled={loading || saving}
                  >
                    {saving ? "Saving..." : "Continue"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={finishOnboarding}
                    disabled={loading || saving}
                  >
                    {saving ? "Saving profile..." : "Save profile"}
                  </Button>
                )}
                <Button type="button" variant="text" onClick={handleSignOut} disabled={saving}>
                  Sign out
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
