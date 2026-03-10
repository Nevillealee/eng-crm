"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import { PROJECT_CURRENCIES } from "../../../constants/project-currencies";
import ProjectForm from "../../admin/project-form";
import CompactPanelSection from "../../compact-panel-section";
import { FormSelectField } from "../../form-fields";
import ProjectList from "../../admin/project-list";
import ResponsiveCreateSheet from "../../responsive-create-sheet";
import {
  projectSortByOptions,
  projectSortDirectionOptions,
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
  onOpenProjectTasks,
  onArchiveProject,
  onDeleteProject,
  onResetProjectForm,
}) {
  const createProjectForm = (
    <ProjectForm
      loading={loading}
      saving={saving}
      editingProjectId=""
      showCancel
      cancelLabel="Cancel"
      form={projectForm}
      currencyOptions={PROJECT_CURRENCIES}
      engineers={assignableEngineers}
      selectedTeam={selectedTeam}
      onFieldChange={onProjectFieldChange}
      onTeamChange={onProjectTeamChange}
      onSubmit={onSubmitProject}
      onCancelEdit={onCloseCreateProjectForm}
    />
  );

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
                onClick={() => onOpenProjectTasks?.()}
                disabled={loading || saving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Open tasks
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => onExportCsv("/api/admin/export/projects")}
                disabled={loading || saving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Export CSV
              </Button>
              {!showCreateProjectForm ? (
                <Button
                  type="button"
                  variant="contained"
                  onClick={onOpenCreateProjectForm}
                  disabled={loading || saving}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Create project
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <ResponsiveCreateSheet open={showCreateProjectForm} onClose={onCloseCreateProjectForm}>
            {createProjectForm}
          </ResponsiveCreateSheet>
        </Stack>
      </Paper>

      <CompactPanelSection
        title="Project controls"
        summary={`Sorted by ${projectSortBy} ${projectSortDirection}`}
      >
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
      </CompactPanelSection>

      <ProjectList
        title="Current and completed projects"
        emptyMessage="No current or completed projects."
        projects={sortedActiveProjects}
        saving={saving}
        onEdit={onEditProject}
        onViewTasks={onOpenProjectTasks}
        onArchive={onArchiveProject}
        loading={loading}
        editingProjectId={editingProjectId}
        editForm={projectForm}
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
        onViewTasks={onOpenProjectTasks}
        onArchive={onArchiveProject}
        showArchiveButton={false}
        showEditButton={false}
        showDeleteButton
        onDelete={onDeleteProject}
      />
    </Stack>
  );
}
