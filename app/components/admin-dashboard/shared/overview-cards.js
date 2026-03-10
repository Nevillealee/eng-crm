"use client";

import { Box, ButtonBase, Paper, Stack, Typography } from "@mui/material";

export default function OverviewCards({
  engineerCount,
  projectCount,
  availableEngineerCount,
  onOpenEngineers,
  onOpenProjects,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <ButtonBase
        type="button"
        onClick={() => onOpenEngineers("all")}
        sx={{ borderRadius: 2, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            width: "100%",
            minHeight: { xs: 112, sm: 124 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: { xs: 24, sm: 28 },
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Engineers
            </Typography>
            <Typography variant="h4">{engineerCount}</Typography>
          </Stack>
        </Paper>
      </ButtonBase>

      <ButtonBase
        type="button"
        onClick={onOpenProjects}
        sx={{ borderRadius: 2, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            width: "100%",
            minHeight: { xs: 112, sm: 124 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: { xs: 24, sm: 28 },
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Projects
            </Typography>
            <Typography variant="h4">{projectCount}</Typography>
          </Stack>
        </Paper>
      </ButtonBase>

      <ButtonBase
        type="button"
        onClick={() => onOpenEngineers("available")}
        sx={{ borderRadius: 2, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            width: "100%",
            minHeight: { xs: 112, sm: 124 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: { xs: 24, sm: 28 },
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Available engineers
            </Typography>
            <Typography variant="h4">{availableEngineerCount}</Typography>
          </Stack>
        </Paper>
      </ButtonBase>
    </Box>
  );
}
