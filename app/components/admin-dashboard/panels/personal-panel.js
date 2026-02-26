"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Avatar,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ENGINEER_SKILL_OPTIONS } from "../../../constants/engineer-skills";
import { FormDateField, FormSelectField, FormTextField } from "../../form-fields";
import CloudinaryAvatarUploadButton from "../../cloudinary-avatar-upload-button";
import { availabilityOptions } from "../shared/constants";

const placeholderAvatar = "/images/nonbinary-avatar.svg";

export default function PersonalPanel({
  session,
  loading,
  profileSaving,
  profileForm,
  avatarPreview,
  onSavePersonalInfo,
  onProfileFieldChange,
  onAvatarUpload,
  onAvatarUploadError,
  onAvatarRemove,
  onProfileSkillsChange,
  onHolidayChange,
  onRemoveHoliday,
  onAddHoliday,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Personal information</Typography>
        <Box component="form" onSubmit={onSavePersonalInfo} noValidate>
          <Stack spacing={2}>
            <FormTextField label="Email" value={session?.user?.email || ""} disabled />
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={avatarPreview || placeholderAvatar} sx={{ width: 64, height: 64 }} />
              <CloudinaryAvatarUploadButton
                disabled={loading || profileSaving}
                onUpload={onAvatarUpload}
                onError={onAvatarUploadError}
              />
              <Button
                type="button"
                variant="text"
                color="error"
                onClick={onAvatarRemove}
                disabled={loading || profileSaving || !avatarPreview}
              >
                Remove avatar
              </Button>
            </Stack>
            <FormTextField
              label="City"
              name="city"
              value={profileForm.city}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
            />
            <Autocomplete
              multiple
              options={ENGINEER_SKILL_OPTIONS}
              value={profileForm.skills}
              onChange={(_event, value) => onProfileSkillsChange(value)}
              filterSelectedOptions
              disabled={loading || profileSaving}
              renderInput={(params) => <FormTextField {...params} label="Skills" />}
            />
            <FormSelectField
              label="Availability status"
              name="availabilityStatus"
              value={profileForm.availabilityStatus}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
              options={availabilityOptions}
            />
            <FormTextField
              label="Availability note"
              name="availabilityNote"
              value={profileForm.availabilityNote}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
              multiline
              minRows={2}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
              {profileForm.upcomingHolidays.map((holiday, index) => (
                <Stack key={`admin-holiday-${index}`} direction={{ xs: "column", md: "row" }} spacing={1}>
                  <FormTextField
                    label="Label"
                    value={holiday.label}
                    onChange={(event) => onHolidayChange(index, "label", event.target.value)}
                    disabled={loading || profileSaving}
                  />
                  <FormDateField
                    label="Start date"
                    value={holiday.startDate}
                    onChange={(event) => onHolidayChange(index, "startDate", event.target.value)}
                    disabled={loading || profileSaving}
                  />
                  <FormDateField
                    label="End date"
                    value={holiday.endDate}
                    onChange={(event) => onHolidayChange(index, "endDate", event.target.value)}
                    disabled={loading || profileSaving}
                  />
                  <IconButton
                    aria-label="Remove holiday"
                    onClick={() => onRemoveHoliday(index)}
                    disabled={loading || profileSaving}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
              <Box>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onAddHoliday}
                  disabled={loading || profileSaving}
                >
                  Add holiday
                </Button>
              </Box>
            </Stack>
            <Box>
              <Button type="submit" variant="contained" disabled={loading || profileSaving}>
                {profileSaving ? "Saving..." : "Save personal information"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
