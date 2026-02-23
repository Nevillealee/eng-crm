"use client";

import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import EngineerCard from "../../admin/engineer-card";
import { FormSelectField, FormTextField } from "../../form-fields";
import { availabilityColorByValue, availabilityOptions } from "../shared/constants";
import { availabilityLabel } from "../shared/formatters";

export default function EngineersPanel({
  loading,
  salarySavingEngineerId,
  engineerSearch,
  engineerCityFilter,
  engineerAvailabilityFilter,
  cityFilterOptions,
  filteredEngineers,
  projects,
  editingEngineerCompId,
  expandedHolidayEngineerId,
  expandedProjectsEngineerId,
  onExportCsv,
  onEngineerSearchChange,
  onEngineerCityFilterChange,
  onEngineerAvailabilityFilterChange,
  onToggleHoliday,
  onToggleProjects,
  onProjectClick,
  onBeginEditComp,
  onUpdateEngineerDraft,
  onSaveEngineerComp,
  onCancelEditComp,
}) {
  const cityOptions = [{ value: "all", label: "All cities" }].concat(
    cityFilterOptions.map((city) => ({ value: city, label: city }))
  );
  const availabilityFilterOptions = [{ value: "all", label: "All statuses" }].concat(
    availabilityOptions
  );

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography variant="h5">Engineers</Typography>
          <Button
            type="button"
            variant="outlined"
            onClick={() => onExportCsv("/api/admin/export/engineers")}
            disabled={loading || salarySavingEngineerId !== ""}
          >
            Export CSV
          </Button>
        </Stack>
        <Typography color="text.secondary">
          Review staffing, compensation, and recent engineer activity details.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormTextField
            label="Search engineers"
            value={engineerSearch}
            onChange={(event) => onEngineerSearchChange(event.target.value)}
          />
          <FormSelectField
            label="City"
            value={engineerCityFilter}
            onChange={(event) => onEngineerCityFilterChange(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
            options={cityOptions}
          />
          <FormSelectField
            label="Availability"
            value={engineerAvailabilityFilter}
            onChange={(event) => onEngineerAvailabilityFilterChange(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
            options={availabilityFilterOptions}
          />
        </Stack>

        {filteredEngineers.length === 0 ? (
          <Alert severity="info">No engineers match current filters.</Alert>
        ) : null}

        {filteredEngineers.map((engineer) => (
          <EngineerCard
            key={engineer.id}
            engineer={engineer}
            projects={projects}
            isEditingComp={editingEngineerCompId === engineer.id}
            isHolidayExpanded={expandedHolidayEngineerId === engineer.id}
            isProjectsExpanded={expandedProjectsEngineerId === engineer.id}
            isSalarySaving={salarySavingEngineerId === engineer.id}
            availabilityColor={availabilityColorByValue[engineer.availabilityStatus] || "default"}
            availabilityLabel={availabilityLabel(engineer.availabilityStatus)}
            onToggleHoliday={() => onToggleHoliday(engineer.id)}
            onToggleProjects={() => onToggleProjects(engineer.id)}
            onProjectClick={onProjectClick}
            onBeginEditComp={() => onBeginEditComp(engineer.id)}
            onUpdateEngineerDraft={onUpdateEngineerDraft}
            onSaveEngineerComp={() => onSaveEngineerComp(engineer.id)}
            onCancelEditComp={() => onCancelEditComp(engineer.id)}
          />
        ))}
      </Stack>
    </Paper>
  );
}
