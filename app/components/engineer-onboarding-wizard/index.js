"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Alert, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { emptyHoliday, nextDateInputValue } from "../profile-form-shared";
import { MAX_ONBOARDING_STEP, MIN_ONBOARDING_STEP } from "./constants";
import {
  clampOnboardingStep,
  createOnboardingForm,
  fetchOnboardingProfilePayload,
  normalizeOnboardingProfile,
  persistOnboardingProfile,
} from "./profile";
import OnboardingStepContent from "./step-content";

function validateBeforeStepChange(step, form) {
  if (step === MIN_ONBOARDING_STEP && form.skills.length === 0) {
    return "Add at least one skill before continuing.";
  }
  return "";
}

function validateBeforeFinish(form) {
  if (form.skills.length === 0) {
    return "At least one skill is required to finish onboarding.";
  }
  return "";
}

export default function EngineerOnboardingWizard({ initialStep = MIN_ONBOARDING_STEP }) {
  const router = useRouter();
  const [step, setStep] = useState(clampOnboardingStep(initialStep));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState(createOnboardingForm);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const payload = await fetchOnboardingProfilePayload();
        if (!mounted) {
          return;
        }

        const profile = payload.profile || {};
        setForm(normalizeOnboardingProfile(profile));

        if (profile.onboardingCompleted) {
          router.replace("/engineer/account");
          return;
        }

        if (Number.isInteger(profile.onboardingStep)) {
          setStep(clampOnboardingStep(profile.onboardingStep));
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

  const moveToStep = async (targetStep) => {
    setSaving(true);
    try {
      await persistOnboardingProfile(form, targetStep, false);
      setStep(targetStep);
      setInfo(targetStep > step ? "Progress saved." : "");
    } catch (saveError) {
      setError(saveError.message || "Unable to save onboarding data.");
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    setError("");
    setInfo("");
    const validationError = validateBeforeStepChange(step, form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const targetStep = Math.min(step + 1, MAX_ONBOARDING_STEP);
    await moveToStep(targetStep);
  };

  const goBack = async () => {
    setError("");
    setInfo("");
    const targetStep = Math.max(step - 1, MIN_ONBOARDING_STEP);
    await moveToStep(targetStep);
  };

  const finishOnboarding = async () => {
    setError("");
    setInfo("");
    const validationError = validateBeforeFinish(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await persistOnboardingProfile(form, MAX_ONBOARDING_STEP, true);
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
                Step {step} of {MAX_ONBOARDING_STEP}. Complete onboarding to access your engineer
                account page.
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            <Stack spacing={2}>
              <OnboardingStepContent
                step={step}
                form={form}
                loading={loading}
                saving={saving}
                onSkillsChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
                onFieldChange={handleFieldChange}
                onHolidayChange={handleHolidayChange}
                onRemoveHoliday={removeHoliday}
                onAddHoliday={addHoliday}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={goBack}
                  disabled={loading || saving || step === MIN_ONBOARDING_STEP}
                >
                  Back
                </Button>
                {step < MAX_ONBOARDING_STEP ? (
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
