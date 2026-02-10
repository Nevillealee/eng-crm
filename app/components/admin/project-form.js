"use client";

import { Autocomplete, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

export default function ProjectForm({
  loading,
  saving,
  editingProjectId,
  showCancel = false,
  cancelLabel = "Cancel",
  form,
  statusOptions,
  currencyOptions,
  engineers,
  selectedTeam,
  onFieldChange,
  onTeamChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{editingProjectId ? "Edit project" : "Create project"}</Typography>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Project name"
            name="name"
            value={form.name}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          />
          <TextField
            label="Client name"
            name="clientName"
            value={form.clientName}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          />
          <TextField
            label="Project cost"
            name="costPhp"
            type="number"
            value={form.costPhp}
            onChange={onFieldChange}
            disabled={loading || saving}
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />
          <TextField
            select
            label="Currency"
            name="currencyCode"
            value={form.currencyCode}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          >
            {currencyOptions.map((option) => (
              <MenuItem key={option.code} value={option.code}>
                {option.code} - {option.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            name="status"
            value={form.status}
            onChange={onFieldChange}
            disabled={loading || saving}
            fullWidth
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={onFieldChange}
              disabled={loading || saving}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={onFieldChange}
              disabled={loading || saving}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <Autocomplete
            multiple
            options={engineers}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={(engineer) => {
              const name =
                engineer?.name ||
                `${engineer?.firstName || ""} ${engineer?.lastName || ""}`.trim() ||
                engineer?.email;
              const city = engineer?.city ? ` - ${engineer.city}` : "";
              return `${name}${city}`;
            }}
            value={selectedTeam}
            onChange={(_event, value) => onTeamChange(value)}
            filterSelectedOptions
            disabled={loading || saving}
            renderInput={(params) => <TextField {...params} label="Assigned engineers" fullWidth />}
          />
          <TextField
            label="Admin notes"
            name="adminNotes"
            value={form.adminNotes}
            onChange={onFieldChange}
            disabled={loading || saving}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button type="submit" variant="contained" disabled={loading || saving}>
              {saving ? "Saving..." : editingProjectId ? "Update project" : "Create project"}
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
