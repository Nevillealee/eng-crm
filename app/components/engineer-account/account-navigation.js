"use client";

import { Box, Button, Stack, Typography } from "@mui/material";

export default function AccountNavigation({ activePanel, saving, onSelectPanel, onSignOut }) {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 280 },
        borderRight: { xs: "none", md: "1px solid" },
        borderBottom: { xs: "1px solid", md: "none" },
        borderColor: "divider",
        p: 3,
      }}
    >
      <Stack sx={{ minHeight: { md: 560 } }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            Devcombine Engineering Portal
          </Typography>
          <Typography variant="h6">Account</Typography>
        </Stack>
        <Button
          type="button"
          variant={activePanel === "personal" ? "contained" : "text"}
          onClick={() => onSelectPanel("personal")}
          disabled={saving}
        >
          Personal information
        </Button>
        <Button
          type="button"
          variant={activePanel === "projects" ? "contained" : "text"}
          onClick={() => onSelectPanel("projects")}
          disabled={saving}
        >
          Projects
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button type="button" variant="outlined" onClick={onSignOut}>
          Sign out
        </Button>
      </Stack>
    </Box>
  );
}
