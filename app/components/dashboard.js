"use client";

import { signOut } from "next-auth/react";
import {
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { CenteredPageShell } from "./page-shell";

export default function Dashboard({ session }) {
  const handleSignOut = async () => {
    await signOut({ redirectTo: "/login" });
  };

  return (
    <CenteredPageShell maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Devcombine Engineering Portal
          </Typography>
          <Typography variant="h4">Engineer account</Typography>
          <Typography color="text.secondary">
            Welcome, {session?.user?.name || session?.user?.email}. You are signed in as an
            engineer.
          </Typography>
        </Stack>
        <div>
          <Button variant="outlined" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Stack>
    </CenteredPageShell>
  );
}
