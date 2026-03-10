"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import { CenteredPageShell } from "../components/page-shell";

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
    <CenteredPageShell>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Devcombine Engineering Portal
          </Typography>
          <Typography variant="h4">Email verification</Typography>
        </Stack>
        <Typography color={status === "error" ? "error" : "text.secondary"}>
          {message}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
    </CenteredPageShell>
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
