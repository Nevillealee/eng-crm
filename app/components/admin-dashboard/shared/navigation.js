"use client";

import { Box, Button, Drawer, Stack, Typography } from "@mui/material";
import { navigationItems } from "./constants";

export default function AdminDashboardNavigation({
  activePanel,
  mobileNavOpen,
  disabled,
  onCloseMobileNav,
  onSelectPanel,
  onSignOut,
}) {
  return (
    <>
      <Drawer anchor="left" open={mobileNavOpen} onClose={onCloseMobileNav}>
        <Box sx={{ width: 280, p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">
                Devcombine Engineering Portal
              </Typography>
              <Typography variant="h6">Admin</Typography>
            </Stack>
            {navigationItems.map((item) => (
              <Button
                key={`mobile-nav-${item.id}`}
                type="button"
                variant={activePanel === item.id ? "contained" : "text"}
                onClick={() => onSelectPanel(item.id)}
                disabled={disabled}
              >
                {item.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outlined"
              onClick={onSignOut}
              fullWidth
              sx={{ mt: "auto", mb: 1 }}
            >
              Sign out
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignSelf: "stretch",
          width: 280,
          minHeight: { md: "100%" },
          borderRight: "1px solid",
          borderBottom: "none",
          borderColor: "divider",
          p: 3,
        }}
      >
        <Stack sx={{ flex: 1, minHeight: { md: "100%" } }} spacing={2} useFlexGap>
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Devcombine Engineering Portal
            </Typography>
            <Typography variant="h6">Admin</Typography>
          </Stack>
          {navigationItems.map((item) => (
            <Button
              key={`desktop-nav-${item.id}`}
              type="button"
              variant={activePanel === item.id ? "contained" : "text"}
              onClick={() => onSelectPanel(item.id)}
              disabled={disabled}
            >
              {item.label}
            </Button>
          ))}
          <Button type="button" variant="outlined" onClick={onSignOut} fullWidth sx={{ mt: "auto", mb: 1 }}>
            Sign out
          </Button>
        </Stack>
      </Box>
    </>
  );
}
