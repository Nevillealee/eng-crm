"use client";

import { signOut } from "next-auth/react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function Dashboard({ session }) {
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
              <Typography variant="h4">
                Engineer account
              </Typography>
              <Typography color="text.secondary">
                Welcome, {session?.user?.name || session?.user?.email}. You are signed in as an engineer.
              </Typography>
            </Stack>
            <Box>
              <Button variant="outlined" onClick={handleSignOut}>
                Sign out
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
