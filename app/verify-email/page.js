"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  const queryString = useMemo(() => {
    if (!token || !email) {
      return null;
    }
    return `token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }, [token, email]);

  useEffect(() => {
    if (!queryString) {
      setStatus("error");
      setMessage("Missing verification details. Please check your email link.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`/api/verify-email?${queryString}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus("error");
          setMessage(payload?.error || "Unable to verify email.");
          return;
        }
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      } catch {
        setStatus("error");
        setMessage("Unable to verify email.");
      }
    };

    verify();
  }, [queryString]);

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
