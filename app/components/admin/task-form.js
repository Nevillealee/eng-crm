"use client";

import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { taskApprovalStatusOptions } from "../tasks/shared";

export default function TaskForm({
  loading,
  saving,
  editingTaskId,
  showCancel = false,
  cancelLabel = "Cancel",
  form,
  projectOptions,
  assigneeOptions,
  parentTaskOptions,
  onFieldChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{editingTaskId ? "Edit task" : "Create task"}</Typography>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            select
            label="Project"
            name="projectId"
            value={form.projectId}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          >
            <MenuItem value="">Select project</MenuItem>
            {projectOptions.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Task name"
            name="name"
            value={form.name}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          />
          <TextField
            select
            label="Assignee"
            name="assigneeId"
            value={form.assigneeId}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          >
            <MenuItem value="">Select assignee</MenuItem>
            {assigneeOptions.map((assignee) => (
              <MenuItem key={assignee.id} value={assignee.id}>
                {assignee.name}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Due date"
              name="dueOn"
              type="date"
              value={form.dueOn}
              onChange={onFieldChange}
              disabled={loading || saving}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              select
              label="Parent task"
              name="parentTaskId"
              value={form.parentTaskId}
              onChange={onFieldChange}
              disabled={loading || saving}
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
          <TextField
            select
            label="Approval status"
            name="approvalStatus"
            value={form.approvalStatus}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          >
            {taskApprovalStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                name="completed"
                checked={Boolean(form.completed)}
                onChange={onFieldChange}
                disabled={loading || saving}
              />
            }
            label="Completed"
          />
          <TextField
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={onFieldChange}
            disabled={loading || saving}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button type="submit" variant="contained" disabled={loading || saving}>
              {saving ? "Saving..." : editingTaskId ? "Update task" : "Create task"}
            </Button>
            {showCancel ? (
              <Button type="button" variant="outlined" onClick={onCancelEdit} disabled={saving}>
                {cancelLabel}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
