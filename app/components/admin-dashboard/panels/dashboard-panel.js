"use client";

import { Paper, Stack, Typography } from "@mui/material";

export default function DashboardPanel() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography color="text.secondary">
          Use the sidebar to switch between profile and project management.
        </Typography>
      </Stack>
    </Paper>
  );
}
