"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Paper } from "@mui/material";
import SignupForm from "./form";
import { validateSignupField, validateSignupForm } from "./validation";

export default function SignupPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password" && formState.confirmPassword) {
      const mismatch = formState.confirmPassword !== value ? "Passwords do not match." : "";
      setFieldErrors((prev) => ({ ...prev, confirmPassword: mismatch }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const err = validateSignupField(name, value, formState);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleAvatarUpload = (uploadedUrl) => {
    const normalizedUrl = typeof uploadedUrl === "string" ? uploadedUrl.trim() : "";
    if (!normalizedUrl) {
      setError("Avatar upload did not return a valid image URL.");
      return;
    }

    setAvatarUrl(normalizedUrl);
    setAvatarPreview(normalizedUrl);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const newErrors = validateSignupForm(formState);
    setFieldErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          avatar: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const safeError =
          response.status >= 500
            ? "Sign-up is temporarily unavailable. Please try again in a few minutes."
            : payload?.error || "Unable to create account.";
        setError(safeError);
        return;
      }

      router.push("/login?signup=success");
      router.refresh();
    } catch {
      setError("Sign-up is temporarily unavailable. Please try again in a few minutes.");
    } finally {
      setIsSubmitting(false);
    }
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
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 6 } }}>
          <SignupForm
            formState={formState}
            fieldErrors={fieldErrors}
            error={error}
            isSubmitting={isSubmitting}
            avatarPreview={avatarPreview}
            onSubmit={handleSubmit}
            onFieldChange={handleChange}
            onFieldBlur={handleBlur}
            onAvatarUpload={handleAvatarUpload}
            onAvatarUploadError={setError}
          />
        </Paper>
      </Container>
    </Box>
  );
}
