import { alpha } from "@mui/material/styles";
import { Box, Container, Paper } from "@mui/material";

export const shellBackgroundSx = {
  minHeight: "100vh",
  background: (theme) =>
    `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.subtle} 100%)`,
};

export const centeredPageSx = {
  ...shellBackgroundSx,
  display: "flex",
  alignItems: "center",
  py: { xs: 4, md: 6 },
};

export const centeredSurfaceSx = {
  p: { xs: 4, md: 5 },
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
  boxShadow: (theme) => `0 20px 48px ${alpha(theme.palette.primary.dark, 0.12)}`,
};

export const workspacePageSx = {
  ...shellBackgroundSx,
  py: { xs: 3, md: 5 },
};

export const workspaceFrameSx = {
  display: "flex",
  alignItems: "stretch",
  overflow: { xs: "visible", md: "hidden" },
  flexDirection: { xs: "column", md: "row" },
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
  boxShadow: (theme) => `0 24px 64px ${alpha(theme.palette.primary.dark, 0.14)}`,
};

export function CenteredPageShell({ children, maxWidth = "sm", paperSx = null }) {
  return (
    <Box sx={centeredPageSx}>
      <Container maxWidth={maxWidth}>
        <Paper sx={[centeredSurfaceSx, paperSx]}>{children}</Paper>
      </Container>
    </Box>
  );
}

export function AppPageShell({ children, maxWidth = "lg", sx = null }) {
  return (
    <Box sx={[workspacePageSx, sx]}>
      <Container maxWidth={maxWidth}>{children}</Container>
    </Box>
  );
}
