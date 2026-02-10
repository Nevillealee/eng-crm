"use client";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Alert, Box, Button, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import ProjectForm from "./project-form";

function formatDateLabel(value) {
  if (!value) {
    return "TBD";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  return parsed.toLocaleDateString();
}

function formatCurrency(value, currencyCode = "PHP") {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode || "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode || "PHP"} ${amount.toLocaleString("en")}`;
  }
}

export default function ProjectList({
  title = "Projects",
  emptyMessage = "No projects yet.",
  projects,
  loading = false,
  saving,
  onEdit,
  onArchive,
  onDelete,
  showArchiveButton = true,
  showDeleteButton = false,
  showEditButton = true,
  editingProjectId = "",
  editForm,
  statusOptions = [],
  currencyOptions = [],
  engineers = [],
  selectedTeam = [],
  onFieldChange,
  onTeamChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </Typography>
      </Stack>
      {projects.length === 0 ? <Alert severity="info">{emptyMessage}</Alert> : null}
      {projects.map((project) =>
        showEditButton &&
        editingProjectId === project.id &&
        editForm &&
        onFieldChange &&
        onTeamChange &&
        onSubmit &&
        onCancelEdit ? (
          <Paper key={project.id} variant="outlined" sx={{ p: 2 }}>
            <ProjectForm
              loading={loading}
              saving={saving}
              editingProjectId={editingProjectId}
              showCancel
              cancelLabel="Cancel edit"
              form={editForm}
              statusOptions={statusOptions}
              currencyOptions={currencyOptions}
              engineers={engineers}
              selectedTeam={selectedTeam}
              onFieldChange={onFieldChange}
              onTeamChange={onTeamChange}
              onSubmit={onSubmit}
              onCancelEdit={onCancelEdit}
            />
          </Paper>
        ) : (
          <Paper key={project.id} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Typography variant="h6">{project.name}</Typography>
                <Chip
                  size="small"
                  color={project.status === "archived" ? "default" : "primary"}
                  label={project.status}
                  sx={{ textTransform: "capitalize", width: "fit-content" }}
                />
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gap: 0.5,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                <Typography color="text.secondary">Client: {project.clientName}</Typography>
                <Typography color="text.secondary">
                  Cost: {formatCurrency(project.costPhp, project.currencyCode)}
                </Typography>
                <Typography color="text.secondary">
                  Duration: {formatDateLabel(project.startDate)} - {formatDateLabel(project.endDate)}
                </Typography>
                <Typography color="text.secondary">
                  Team:{" "}
                  {Array.isArray(project.teamMembers) && project.teamMembers.length
                    ? project.teamMembers.map((member) => member.name).join(", ")
                    : "No assigned engineers"}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Admin notes: {project.adminNotes || "None"}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent={{ sm: "flex-end" }}
              >
                {showEditButton ? (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => onEdit(project)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                ) : null}
                {showArchiveButton && project.status !== "archived" ? (
                  <Button
                    type="button"
                    color="error"
                    variant="outlined"
                    onClick={() => onArchive(project.id)}
                    disabled={saving}
                  >
                    Archive
                  </Button>
                ) : null}
                {showDeleteButton ? (
                  <IconButton
                    aria-label="Delete project permanently"
                    color="error"
                    onClick={() => onDelete?.(project.id)}
                    disabled={saving}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        )
      )}
    </Stack>
  );
}
