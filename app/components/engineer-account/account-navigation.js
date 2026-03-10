"use client";

import { Box, Button, Stack, Typography } from "@mui/material";

const navButtonSx = {
  justifyContent: "flex-start",
  px: 2,
};

export default function AccountNavigation({ activePanel, saving, onSelectPanel, onSignOut }) {
  return (
    <>
      <Box
        component="nav"
        aria-label="Engineer account navigation"
        sx={{
          display: { xs: "block", md: "none" },
          position: "sticky",
          top: 0,
          zIndex: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 2,
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Stack spacing={0.25}>
              <Typography variant="overline" color="text.secondary">
                Devcombine Engineering Portal
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                Engineer account
              </Typography>
            </Stack>
            <Button type="button" variant="text" onClick={onSignOut} disabled={saving}>
              Sign out
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              overflowX: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Button
              type="button"
              variant={activePanel === "personal" ? "contained" : "outlined"}
              onClick={() => onSelectPanel("personal")}
              disabled={saving}
              sx={{ flex: 1, minWidth: 136 }}
            >
              Personal
            </Button>
            <Button
              type="button"
              variant={activePanel === "projects" ? "contained" : "outlined"}
              onClick={() => onSelectPanel("projects")}
              disabled={saving}
              sx={{ flex: 1, minWidth: 120 }}
            >
              Projects
            </Button>
            <Button
              type="button"
              variant={activePanel === "tasks" ? "contained" : "outlined"}
              onClick={() => onSelectPanel("tasks")}
              disabled={saving}
              sx={{ flex: 1, minWidth: 108 }}
            >
              Tasks
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        component="nav"
        aria-label="Engineer account navigation"
        sx={{
          display: { xs: "none", md: "block" },
          width: 280,
          borderRight: "1px solid",
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
            fullWidth
            sx={navButtonSx}
          >
            Personal information
          </Button>
          <Button
            type="button"
            variant={activePanel === "projects" ? "contained" : "text"}
            onClick={() => onSelectPanel("projects")}
            disabled={saving}
            fullWidth
            sx={navButtonSx}
          >
            Projects
          </Button>
          <Button
            type="button"
            variant={activePanel === "tasks" ? "contained" : "text"}
            onClick={() => onSelectPanel("tasks")}
            disabled={saving}
            fullWidth
            sx={navButtonSx}
          >
            Tasks
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button type="button" variant="outlined" onClick={onSignOut} fullWidth sx={navButtonSx}>
            Sign out
          </Button>
        </Stack>
      </Box>
    </>
  );
}
