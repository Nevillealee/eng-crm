"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Avatar,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FormDateField, FormSelectField, FormTextField } from "../form-fields";
import CloudinaryAvatarUploadButton from "../cloudinary-avatar-upload-button";
import { availabilityOptions, engineerSkillOptions } from "../profile-form-shared";

const placeholderAvatar = "/images/nonbinary-avatar.svg";

export default function PersonalPanel({
  loading,
  saving,
  form,
  avatarPreview,
  onSubmit,
  onFieldChange,
  onAvatarUpload,
  onAvatarUploadError,
  onAvatarRemove,
  onSkillsChange,
  onHolidayChange,
  onRemoveHoliday,
  onAddHoliday,
}) {
  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5">Personal information</Typography>
        <Typography color="text.secondary">Update your skillset and availability details.</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={avatarPreview || placeholderAvatar} sx={{ width: 64, height: 64 }} />
          <CloudinaryAvatarUploadButton
            disabled={loading || saving}
            onUpload={onAvatarUpload}
            onError={onAvatarUploadError}
          />
          <Button
            type="button"
            variant="text"
            color="error"
            onClick={onAvatarRemove}
            disabled={loading || saving || !avatarPreview}
          >
            Remove avatar
          </Button>
        </Stack>
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
          onChange={(_, value) => onSkillsChange(value)}
          filterSelectedOptions
          disabled={loading || saving}
          renderInput={(params) => <FormTextField {...params} label="Skills" />}
        />
        <FormSelectField
          label="Availability status"
          name="availabilityStatus"
          value={form.availabilityStatus}
          onChange={onFieldChange}
          disabled={loading || saving}
          options={availabilityOptions}
        />
        <FormTextField
          label="Availability note"
          name="availabilityNote"
          value={form.availabilityNote}
          onChange={onFieldChange}
          disabled={loading || saving}
          multiline
          minRows={2}
        />
        <Stack spacing={1}>
          <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
          {form.upcomingHolidays.map((holiday, index) => (
            <Stack key={`holiday-${index}`} direction={{ xs: "column", md: "row" }} spacing={1}>
              <FormTextField
                label="Label"
                value={holiday.label}
                onChange={(event) => onHolidayChange(index, "label", event.target.value)}
                disabled={loading || saving}
              />
              <FormDateField
                label="Start date"
                value={holiday.startDate}
                onChange={(event) => onHolidayChange(index, "startDate", event.target.value)}
                disabled={loading || saving}
              />
              <FormDateField
                label="End date"
                value={holiday.endDate}
                onChange={(event) => onHolidayChange(index, "endDate", event.target.value)}
                disabled={loading || saving}
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
        <Box>
          <Button type="submit" variant="contained" disabled={loading || saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
