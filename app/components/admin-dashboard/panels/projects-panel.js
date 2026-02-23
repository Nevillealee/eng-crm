"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import { PROJECT_CURRENCIES } from "../../../constants/project-currencies";
import ProjectForm from "../../admin/project-form";
import { FormSelectField } from "../../form-fields";
import ProjectList from "../../admin/project-list";
import {
  projectSortByOptions,
  projectSortDirectionOptions,
  projectStatusOptions,
} from "../shared/constants";

export default function ProjectsPanel({
  loading,
  saving,
  showCreateProjectForm,
  projectForm,
  assignableEngineers,
  selectedTeam,
  sortedActiveProjects,
  sortedArchivedProjects,
  editingProjectId,
  projectSortBy,
  projectSortDirection,
  onExportCsv,
  onOpenCreateProjectForm,
  onCloseCreateProjectForm,
  onProjectFieldChange,
  onProjectTeamChange,
  onSubmitProject,
  onSortByChange,
  onSortDirectionChange,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onResetProjectForm,
}) {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Typography variant="h5">Projects</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => onExportCsv("/api/admin/export/projects")}
                disabled={loading || saving}
              >
                Export CSV
              </Button>
              {!showCreateProjectForm ? (
                <Button
                  type="button"
                  variant="contained"
                  onClick={onOpenCreateProjectForm}
                  disabled={loading || saving}
                >
                  Create project
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {showCreateProjectForm ? (
            <ProjectForm
              loading={loading}
              saving={saving}
              editingProjectId=""
              showCancel
              cancelLabel="Cancel"
              form={projectForm}
              statusOptions={projectStatusOptions}
              currencyOptions={PROJECT_CURRENCIES}
              engineers={assignableEngineers}
              selectedTeam={selectedTeam}
              onFieldChange={onProjectFieldChange}
              onTeamChange={onProjectTeamChange}
              onSubmit={onSubmitProject}
              onCancelEdit={onCloseCreateProjectForm}
            />
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
          <FormSelectField
            label="Sort by"
            value={projectSortBy}
            onChange={(event) => onSortByChange(event.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            options={projectSortByOptions}
          />
          <FormSelectField
            label="Direction"
            value={projectSortDirection}
            onChange={(event) => onSortDirectionChange(event.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            options={projectSortDirectionOptions}
          />
        </Stack>
      </Paper>

      <ProjectList
        title="Active projects"
        emptyMessage="No active projects."
        projects={sortedActiveProjects}
        saving={saving}
        onEdit={onEditProject}
        onArchive={onArchiveProject}
        loading={loading}
        editingProjectId={editingProjectId}
        editForm={projectForm}
        statusOptions={projectStatusOptions}
        currencyOptions={PROJECT_CURRENCIES}
        engineers={assignableEngineers}
        selectedTeam={selectedTeam}
        onFieldChange={onProjectFieldChange}
        onTeamChange={onProjectTeamChange}
        onSubmit={onSubmitProject}
        onCancelEdit={onResetProjectForm}
      />

      <ProjectList
        title="Archived projects"
        emptyMessage="No archived projects."
        projects={sortedArchivedProjects}
        saving={saving}
        onEdit={onEditProject}
        onArchive={onArchiveProject}
        showArchiveButton={false}
        showEditButton={false}
        showDeleteButton
        onDelete={onDeleteProject}
      />
    </Stack>
  );
}
