"use client";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  formatTaskDateLabel,
  taskCompletionColor,
  taskCompletionFilterOptions,
  taskDueFilterOptions,
  taskUserLabel,
} from "../tasks/shared";
import CompactPanelSection from "../compact-panel-section";
import { FormDateField, FormSelectField, FormTextField } from "../form-fields";

function parentLabel(task) {
  if (!task?.parent) {
    return "Project root";
  }

  if (task.parent.resourceType === "task") {
    return task.parent.name;
  }

  return task.parent.name || "Project root";
}

function hasTaskDraft(taskForm, editingTaskId) {
  return Boolean(
    editingTaskId ||
      taskForm.projectId ||
      taskForm.name.trim() ||
      taskForm.dueOn ||
      taskForm.parentTaskId ||
      taskForm.notes.trim()
  );
}

export default function TasksPanel({
  saving,
  tasksLoading,
  taskForm,
  projectOptions,
  filterProjectOptions,
  parentTaskOptions,
  filteredTasks,
  editingTaskId,
  taskProjectFilter,
  taskCompletionFilter,
  taskDueFilter,
  taskSearch,
  onTaskFieldChange,
  onSubmitTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompleted,
  onTaskProjectFilterChange,
  onTaskCompletionFilterChange,
  onTaskDueFilterChange,
  onTaskSearchChange,
  onResetTaskForm,
}) {
  const projectFilterItems = [{ value: "all", label: "All projects" }].concat(
    filterProjectOptions.map((project) => ({ value: project.id, label: project.name }))
  );
  const draftOpen = hasTaskDraft(taskForm, editingTaskId);
  const activeFilterCount = [
    taskProjectFilter !== "all",
    taskCompletionFilter !== "all",
    taskDueFilter !== "all",
    taskSearch.trim() !== "",
  ].filter(Boolean).length;

  return (
    <Stack spacing={2}>
      <CompactPanelSection
        title={editingTaskId ? "Edit task" : "Create task"}
        description="Create self-assigned tasks for your projects and manage tasks you own or are assigned to."
        summary={draftOpen ? "Draft in progress" : "Open when you need a new task"}
        defaultExpandedMobile={draftOpen}
      >
        <Stack component="form" spacing={2} onSubmit={onSubmitTask} noValidate>
          <FormSelectField
            label="Project"
            name="projectId"
            value={taskForm.projectId}
            onChange={onTaskFieldChange}
            options={[{ value: "", label: "Select project" }].concat(
              projectOptions.map((project) => ({ value: project.id, label: project.name }))
            )}
            disabled={saving}
          />
          <FormTextField
            label="Task name"
            name="name"
            value={taskForm.name}
            onChange={onTaskFieldChange}
            disabled={saving}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormDateField
              label="Due date"
              name="dueOn"
              value={taskForm.dueOn}
              onChange={onTaskFieldChange}
              disabled={saving}
              fullWidth
            />
            <TextField
              select
              label="Parent task"
              name="parentTaskId"
              value={taskForm.parentTaskId}
              onChange={onTaskFieldChange}
              disabled={saving}
              fullWidth
            >
              <MenuItem value="">No parent</MenuItem>
              {parentTaskOptions.map((task) => (
                <MenuItem key={task.id} value={task.id}>
                  {task.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <FormTextField
            label="Notes"
            name="notes"
            value={taskForm.notes}
            onChange={onTaskFieldChange}
            disabled={saving}
            multiline
            minRows={3}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button type="submit" variant="contained" disabled={saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {saving ? "Saving..." : editingTaskId ? "Update task" : "Create task"}
            </Button>
            {editingTaskId ? (
              <Button
                type="button"
                variant="outlined"
                onClick={onResetTaskForm}
                disabled={saving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Cancel edit
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CompactPanelSection>

      <CompactPanelSection
        title="My tasks"
        summary={activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}` : "Search and narrow your task list"}
        defaultExpandedMobile={activeFilterCount > 0}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormTextField
              label="Search tasks"
              value={taskSearch}
              onChange={(event) => onTaskSearchChange(event.target.value)}
            />
            <FormSelectField
              label="Project"
              value={taskProjectFilter}
              onChange={(event) => onTaskProjectFilterChange(event.target.value)}
              options={projectFilterItems}
              sx={{ minWidth: { md: 220 } }}
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormSelectField
              label="Completion"
              value={taskCompletionFilter}
              onChange={(event) => onTaskCompletionFilterChange(event.target.value)}
              options={taskCompletionFilterOptions}
              sx={{ minWidth: { md: 220 } }}
            />
            <FormSelectField
              label="Due"
              value={taskDueFilter}
              onChange={(event) => onTaskDueFilterChange(event.target.value)}
              options={taskDueFilterOptions}
              sx={{ minWidth: { md: 220 } }}
            />
          </Stack>
        </Stack>
      </CompactPanelSection>

      {tasksLoading ? <Typography color="text.secondary">Loading tasks...</Typography> : null}
      {!tasksLoading && filteredTasks.length === 0 ? (
        <Alert severity="info">No tasks match current filters.</Alert>
      ) : null}
      {!tasksLoading
        ? filteredTasks.map((task) => (
            <Paper key={task.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ sm: "center" }}
                >
                  <Typography variant="h6">{task.name}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      size="small"
                      color={taskCompletionColor(task.completed)}
                      label={task.completed ? "Completed" : "Open"}
                    />
                  </Stack>
                </Stack>
                <Typography color="text.secondary">Project: {task.project?.name || "Unknown project"}</Typography>
                <Typography color="text.secondary">
                  Assignee: {taskUserLabel(task.assigneeUser, task.assignee)}
                </Typography>
                <Typography color="text.secondary">
                  Assigned by: {taskUserLabel(task.assignedByUser, task.assignedBy)}
                </Typography>
                <Typography color="text.secondary">Due: {formatTaskDateLabel(task.dueOn)}</Typography>
                <Typography color="text.secondary">Parent: {parentLabel(task)}</Typography>
                <Typography color="text.secondary">Notes: {task.notes || "None"}</Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent={{ sm: "flex-end" }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => onEditTask(task)}
                    disabled={saving}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => onToggleTaskCompleted(task)}
                    disabled={saving}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    {task.completed ? "Reopen" : "Complete"}
                  </Button>
                  <IconButton
                    aria-label="Delete task"
                    color="error"
                    onClick={() => onDeleteTask(task.id)}
                    disabled={saving}
                    sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))
        : null}
    </Stack>
  );
}
