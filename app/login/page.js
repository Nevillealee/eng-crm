"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/");
  const [signupStatus, setSignupStatus] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Support current `redirectTo` plus legacy `callbackUrl` links.
    setRedirectTo(params.get("redirectTo") || params.get("callbackUrl") || "/");
    setSignupStatus(params.get("signup") || "");
  }, []);

  useEffect(() => {
    if (signupStatus === "success") {
      setInfo("Account created. Check your email for a verification link before signing in.");
    }
  }, [signupStatus]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formState.email,
        password: formState.password,
        rememberMe: formState.rememberMe ? "true" : "false",
        redirectTo,
      });

      if (result?.error) {
        if (result.error === "Configuration") {
          setError("Sign-in is temporarily unavailable. Please try again in a few minutes.");
          return;
        }
        setError(
          "Sign-in failed. Check your email and password, and verify your email if you recently signed up."
        );
        return;
      }

      router.push(result?.url || redirectTo);
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again in a few minutes.");
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
              <Typography variant="overline" color="text.secondary">
                Devcombine Engineering Portal
              </Typography>
              <Typography variant="h4">Welcome back</Typography>
              <Typography color="text.secondary">
                Sign in with your assigned credentials to continue.
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
                  value={formState.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="rememberMe"
                      checked={formState.rememberMe}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  }
                  label="Remember me"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    New here?{" "}
                    <Link href="/signup">Create an account</Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <Link href="/forgot-password">Forgot password?</Link>
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
