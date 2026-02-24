"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_ERROR,
} from "../constants/password-policy";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value, currentPassword) => {
    if (name === "password") {
      if (!value) return "Password is required.";
      if (value.length < PASSWORD_MIN_LENGTH) return PASSWORD_MIN_LENGTH_ERROR;
      return "";
    }
    if (name === "confirmPassword") {
      const pw = currentPassword ?? password;
      return value === pw ? "" : "Passwords do not match.";
    }
    return "";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    const newErrors = {
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };
    setFieldErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to reset password.");
      } else {
        setInfo("Password reset successful. Redirecting to sign in...");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch {
      setError("Unable to reset password.");
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
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4">Create a new password</Typography>
              <Typography color="text.secondary">
                Enter your new password to complete the reset process.
              </Typography>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: "",
                      confirmPassword: confirmPassword
                        ? e.target.value === confirmPassword ? "" : "Passwords do not match."
                        : prev.confirmPassword,
                    }));
                  }}
                  onBlur={(e) => setFieldErrors((prev) => ({ ...prev, password: validateField("password", e.target.value) }))}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || ""}
                  autoComplete="new-password"
                  slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_BYTES } }}
                  required
                  fullWidth
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  onBlur={(e) => setFieldErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", e.target.value) }))}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword || ""}
                  autoComplete="new-password"
                  slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_BYTES } }}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Reset password"}
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Remember your password? <Link href="/login">Sign in</Link>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
