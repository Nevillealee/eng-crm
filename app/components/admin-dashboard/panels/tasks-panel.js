"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import TaskForm from "../../admin/task-form";
import TaskList from "../../admin/task-list";
import { FormSelectField, FormTextField } from "../../form-fields";
import {
  taskApprovalFilterOptions,
  taskCompletionFilterOptions,
  taskDueFilterOptions,
} from "../../tasks/shared";

export default function TasksPanel({
  loading,
  saving,
  showCreateTaskForm,
  taskForm,
  projectOptions,
  assigneeOptions,
  filterAssigneeOptions,
  parentTaskOptions,
  filteredTasks,
  editingTaskId,
  taskProjectFilter,
  taskAssigneeFilter,
  taskApprovalFilter,
  taskCompletionFilter,
  taskDueFilter,
  taskSearch,
  onOpenCreateTaskForm,
  onCloseCreateTaskForm,
  onTaskFieldChange,
  onSubmitTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompleted,
  onTaskProjectFilterChange,
  onTaskAssigneeFilterChange,
  onTaskApprovalFilterChange,
  onTaskCompletionFilterChange,
  onTaskDueFilterChange,
  onTaskSearchChange,
  onResetTaskForm,
}) {
  const projectFilterOptions = [{ value: "all", label: "All projects" }].concat(
    projectOptions.map((project) => ({ value: project.id, label: project.name }))
  );
  const assigneeFilterOptions = [{ value: "all", label: "All assignees" }].concat(
    filterAssigneeOptions.map((assignee) => ({ value: assignee.id, label: assignee.name }))
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
            <Typography variant="h5">Tasks</Typography>
            {!showCreateTaskForm ? (
              <Button
                type="button"
                variant="contained"
                onClick={onOpenCreateTaskForm}
                disabled={loading || saving}
              >
                Create task
              </Button>
            ) : null}
          </Stack>
          <Typography color="text.secondary">
            Manage project tasks, assignments, completion, and approvals.
          </Typography>
          {showCreateTaskForm ? (
            <TaskForm
              loading={loading}
              saving={saving}
              editingTaskId=""
              showCancel
              cancelLabel="Cancel"
              form={taskForm}
              projectOptions={projectOptions}
              assigneeOptions={assigneeOptions}
              parentTaskOptions={parentTaskOptions}
              onFieldChange={onTaskFieldChange}
              onSubmit={onSubmitTask}
              onCancelEdit={onCloseCreateTaskForm}
            />
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
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
              options={projectFilterOptions}
              sx={{ minWidth: { md: 220 } }}
            />
            <FormSelectField
              label="Assignee"
              value={taskAssigneeFilter}
              onChange={(event) => onTaskAssigneeFilterChange(event.target.value)}
              options={assigneeFilterOptions}
              sx={{ minWidth: { md: 220 } }}
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormSelectField
              label="Approval"
              value={taskApprovalFilter}
              onChange={(event) => onTaskApprovalFilterChange(event.target.value)}
              options={taskApprovalFilterOptions}
              sx={{ minWidth: { md: 220 } }}
            />
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
      </Paper>

      <TaskList
        title="Visible tasks"
        emptyMessage="No tasks match current filters."
        tasks={filteredTasks}
        loading={loading}
        saving={saving}
        editingTaskId={editingTaskId}
        editForm={taskForm}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        parentTaskOptions={parentTaskOptions}
        onFieldChange={onTaskFieldChange}
        onSubmit={onSubmitTask}
        onCancelEdit={onResetTaskForm}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onToggleCompleted={onToggleTaskCompleted}
      />
    </Stack>
  );
}
