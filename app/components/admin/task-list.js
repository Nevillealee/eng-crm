"use client";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Alert, Button, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import TaskForm from "./task-form";
import {
  formatTaskDateLabel,
  taskCompletionColor,
  taskUserLabel,
} from "../tasks/shared";

function parentLabel(task) {
  if (!task?.parent) {
    return "Project root";
  }

  if (task.parent.resourceType === "task") {
    return task.parent.name;
  }

  return task.parent.name || "Project root";
}

export default function TaskList({
  title = "Tasks",
  emptyMessage = "No tasks yet.",
  tasks,
  loading = false,
  saving = false,
  editingTaskId = "",
  editForm,
  projectOptions = [],
  assigneeOptions = [],
  parentTaskOptions = [],
  onFieldChange,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
  onToggleCompleted,
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
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </Typography>
      </Stack>
      {tasks.length === 0 ? <Alert severity="info">{emptyMessage}</Alert> : null}
      {tasks.map((task) =>
        editingTaskId === task.id && editForm && onFieldChange && onSubmit && onCancelEdit ? (
          <Paper key={task.id} variant="outlined" sx={{ p: 2 }}>
            <TaskForm
              loading={loading}
              saving={saving}
              editingTaskId={editingTaskId}
              showCancel
              cancelLabel="Cancel edit"
              form={editForm}
              projectOptions={projectOptions}
              assigneeOptions={assigneeOptions}
              parentTaskOptions={parentTaskOptions}
              onFieldChange={onFieldChange}
              onSubmit={onSubmit}
              onCancelEdit={onCancelEdit}
            />
          </Paper>
        ) : (
          <Paper key={task.id} variant="outlined" sx={{ p: 2 }}>
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
                  onClick={() => onEdit(task)}
                  disabled={saving}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => onToggleCompleted(task)}
                  disabled={saving}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {task.completed ? "Reopen" : "Complete"}
                </Button>
                <IconButton
                  aria-label="Delete task"
                  color="error"
                  onClick={() => onDelete(task.id)}
                  disabled={saving}
                  sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                >
                  <DeleteForeverIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        )
      )}
    </Stack>
  );
}
