"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormDateField, FormTextField } from "../form-fields";
import { availabilityOptions, engineerSkillOptions } from "../profile-form-shared";

const holidayLabelFieldSx = {
  flex: { md: "1 1 200px" },
  minWidth: { md: 160 },
  maxWidth: { md: 220 },
};
const holidayDateFieldSx = {
  flex: { md: "0 1 180px" },
  minWidth: { md: 170 },
};

export default function OnboardingStepContent({
  step,
  form,
  loading,
  saving,
  onSkillsChange,
  onFieldChange,
  onHolidayChange,
  onRemoveHoliday,
  onAddHoliday,
}) {
  if (step === 1) {
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormTextField
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={onFieldChange}
            disabled={loading || saving}
          />
          <FormTextField
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={onFieldChange}
            disabled={loading || saving}
          />
        </Stack>
        <FormTextField
          label="Location"
          name="city"
          value={form.city}
          onChange={onFieldChange}
          disabled={loading || saving}
        />
        <Autocomplete
          multiple
          options={engineerSkillOptions}
          value={form.skills}
          onChange={(_event, value) => onSkillsChange(value)}
          filterSelectedOptions
          disabled={loading || saving}
          renderInput={(params) => <FormTextField {...params} label="Skills" />}
        />
      </Stack>
    );
  }

  if (step === 2) {
    return (
      <Stack spacing={2}>
        <TextField
          select
          label="Availability status"
          name="availabilityStatus"
          value={form.availabilityStatus}
          onChange={onFieldChange}
          disabled={loading || saving}
          fullWidth
        >
          {availabilityOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <FormTextField
          label="Availability note"
          name="availabilityNote"
          value={form.availabilityNote}
          onChange={onFieldChange}
          disabled={loading || saving}
          multiline
          minRows={2}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
      {form.upcomingHolidays.map((holiday, index) => (
        <Stack key={`holiday-${index}`} direction={{ xs: "column", md: "row" }} spacing={1}>
          <FormTextField
            label="Label"
            value={holiday.label}
            onChange={(event) => onHolidayChange(index, "label", event.target.value)}
            disabled={loading || saving}
            sx={holidayLabelFieldSx}
          />
          <FormDateField
            label="Start date"
            value={holiday.startDate}
            onChange={(event) => onHolidayChange(index, "startDate", event.target.value)}
            disabled={loading || saving}
            sx={holidayDateFieldSx}
          />
          <FormDateField
            label="End date"
            value={holiday.endDate}
            onChange={(event) => onHolidayChange(index, "endDate", event.target.value)}
            disabled={loading || saving}
            sx={holidayDateFieldSx}
          />
          <IconButton
            aria-label="Remove holiday"
            onClick={() => onRemoveHoliday(index)}
            disabled={loading || saving}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      <Box>
        <Button type="button" variant="outlined" onClick={onAddHoliday} disabled={loading || saving}>
          Add holiday
        </Button>
      </Box>
    </Stack>
  );
}
