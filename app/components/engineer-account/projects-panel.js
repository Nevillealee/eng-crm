"use client";

import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";

export default function ProjectsPanel({ projectsLoading, projects, formatDateLabel }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Projects</Typography>
      <Typography color="text.secondary">Ongoing projects assigned to you.</Typography>
      {projectsLoading ? <Typography color="text.secondary">Loading projects...</Typography> : null}
      {!projectsLoading && projects.length === 0 ? (
        <Alert severity="info">No ongoing projects assigned yet.</Alert>
      ) : null}
      {!projectsLoading && projects.length > 0
        ? projects.map((project) => (
            <Paper key={project.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                  <Typography variant="h6">{project.name}</Typography>
                  <Chip
                    size="small"
                    color="primary"
                    label={project.status}
                    sx={{ textTransform: "capitalize", width: "fit-content" }}
                  />
                </Stack>
                <Typography color="text.secondary">Client: {project.clientName}</Typography>
                <Typography color="text.secondary">
                  Duration: {formatDateLabel(project.startDate)} - {formatDateLabel(project.endDate)}
                </Typography>
                <Typography color="text.secondary">
                  Team:{" "}
                  {Array.isArray(project.teamMembers) && project.teamMembers.length
                    ? project.teamMembers.map((member) => member.name).join(", ")
                    : "No team members assigned"}
                </Typography>
              </Stack>
            </Paper>
          ))
        : null}
    </Stack>
  );
}
