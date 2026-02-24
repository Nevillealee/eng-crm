"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

function resolveVerificationParams() {
  if (typeof window === "undefined") {
    return { verificationParams: null, hasSensitiveUrlParams: false };
  }

  const queryParams = new URLSearchParams(window.location.search);
  const queryToken = queryParams.get("token") || "";
  const queryEmail = queryParams.get("email") || "";

  let hashToken = "";
  let hashEmail = "";
  const fragment = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  if (fragment) {
    const fragmentParams = new URLSearchParams(fragment);
    hashToken = fragmentParams.get("token") || "";
    hashEmail = fragmentParams.get("email") || "";
  }

  const token = hashToken || queryToken;
  const email = (hashEmail || queryEmail).trim().toLowerCase();
  const verificationParams = token ? (email ? { token, email } : { token }) : null;

  return {
    verificationParams,
    hasSensitiveUrlParams: Boolean(token || email),
  };
}

function VerifyEmailContent() {
  const { verificationParams, hasSensitiveUrlParams } = useMemo(
    () => resolveVerificationParams(),
    []
  );
  const [status, setStatus] = useState(verificationParams ? "loading" : "error");
  const [message, setMessage] = useState(
    verificationParams
      ? "Verifying your email..."
      : "Missing verification details. Please check your email link."
  );

  useEffect(() => {
    if (!hasSensitiveUrlParams) {
      return;
    }

    // Remove sensitive token material from browser URL/history.
    window.history.replaceState(null, "", window.location.pathname);
  }, [hasSensitiveUrlParams]);

  useEffect(() => {
    if (!verificationParams) {
      return;
    }

    let isMounted = true;

    const verify = async () => {
      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verificationParams),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (isMounted) {
            setStatus("error");
            setMessage(payload?.error || "Unable to verify email.");
          }
          return;
        }
        if (isMounted) {
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setMessage("Unable to verify email.");
        }
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [verificationParams]);

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
          <Stack spacing={2}>
            <Typography variant="h4">Email verification</Typography>
            <Typography color={status === "error" ? "error" : "text.secondary"}>
              {message}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button component={Link} href="/login" variant="contained">
                Go to sign in
              </Button>
              {status === "error" ? (
                <Button component={Link} href="/signup" variant="outlined">
                  Create a new account
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
