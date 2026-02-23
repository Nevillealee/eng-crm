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
        gap: { xs: 1.25, sm: 2 },
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      }}
    >
      <ButtonBase
        type="button"
        onClick={() => onOpenEngineers("all")}
        sx={{ borderRadius: 1, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.25, sm: 2 },
            width: "100%",
            height: { xs: 105, sm: 120 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ minHeight: { xs: 34, sm: 40 }, lineHeight: 1.2, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
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
        sx={{ borderRadius: 1, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.25, sm: 2 },
            width: "100%",
            height: { xs: 105, sm: 120 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ minHeight: { xs: 34, sm: 40 }, lineHeight: 1.2, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
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
        sx={{ borderRadius: 1, textAlign: "left", width: "100%", minWidth: 0 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.25, sm: 2 },
            width: "100%",
            height: { xs: 105, sm: 120 },
            transition: "border-color 180ms ease, box-shadow 180ms ease",
            "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          }}
        >
          <Stack sx={{ height: "100%" }} justifyContent="space-between">
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ minHeight: { xs: 34, sm: 40 }, lineHeight: 1.2, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
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
