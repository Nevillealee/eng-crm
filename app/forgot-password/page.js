"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isResending, setIsResending] = useState(false);

  const validateEmail = (value) => {
    if (!value.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    return "";
  };

  const handleResend = async () => {
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to resend verification email.");
      } else {
        setInfo("If your email is unverified, a verification link has been sent.");
      }
    } catch {
      setError("Unable to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to send password reset email.");
      } else {
        setTimeout(() => router.push("/login?reset=requested"), 1500);
        setInfo("If an account exists with that email, a password reset link has been sent.");
      }
    } catch {
      setError("Unable to send password reset email.");
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
              <Typography variant="h4">Reset your password</Typography>
              <Typography color="text.secondary">
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                  error={!!emailError}
                  helperText={emailError || ""}
                  autoComplete="email"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !email || !!emailError}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    or
                  </Typography>
                </Divider>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  disabled={isResending || !email || !!emailError}
                  onClick={handleResend}
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </Button>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    <Link href="/login">Return to sign in</Link>
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}