"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  PROFILE_AVAILABILITY_NOTE_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
  PROFILE_HOLIDAY_LABEL_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
} from "../../../constants/text-limits";
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
const holidayRowSx = {
  display: "grid",
  gap: 1,
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr)) auto",
    md: "minmax(0, 1.15fr) repeat(2, minmax(0, 180px)) auto",
  },
  alignItems: { xs: "start", md: "center" },
};
const holidayLabelFieldSx = {
  gridColumn: { xs: "1 / -1", md: "auto" },
};
const holidayDateFieldSx = {
  minWidth: 0,
};
const holidayRemoveButtonSx = {
  justifySelf: "flex-end",
  alignSelf: { xs: "center", md: "center" },
};
const stackedActionButtonSx = {
  width: { xs: "100%", sm: "auto" },
};
const removeAvatarButtonSx = {
  ...stackedActionButtonSx,
  justifyContent: { xs: "flex-start", sm: "center" },
};

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
  const profile = profileForm && typeof profileForm === "object" ? profileForm : {};
  const holidayItems = Array.isArray(profile.upcomingHolidays) ? profile.upcomingHolidays : [];
  const selectedSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const firstName = typeof profile.firstName === "string" ? profile.firstName : "";
  const lastName = typeof profile.lastName === "string" ? profile.lastName : "";
  const city = typeof profile.city === "string" ? profile.city : "";
  const availabilityStatus =
    typeof profile.availabilityStatus === "string" ? profile.availabilityStatus : "";
  const availabilityNote = typeof profile.availabilityNote === "string" ? profile.availabilityNote : "";

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Typography variant="h5">Personal information</Typography>
        <Box component="form" onSubmit={onSavePersonalInfo} noValidate>
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            <FormTextField label="Email" value={session?.user?.email || ""} disabled />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  alt={
                    `${firstName} ${lastName}`.trim() || "Admin avatar"
                  }
                  src={avatarPreview || placeholderAvatar}
                  sx={{ width: { xs: 56, sm: 64 }, height: { xs: 56, sm: 64 } }}
                />
                <Typography color="text.secondary">Profile avatar</Typography>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <CloudinaryAvatarUploadButton
                  disabled={loading || profileSaving}
                  fullWidth
                  sx={stackedActionButtonSx}
                  onUpload={onAvatarUpload}
                  onError={onAvatarUploadError}
                />
                <Button
                  type="button"
                  variant="text"
                  color="error"
                  onClick={onAvatarRemove}
                  disabled={loading || profileSaving || !avatarPreview}
                  sx={removeAvatarButtonSx}
                >
                  Remove avatar
                </Button>
              </Stack>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField
                label="First name"
                name="firstName"
                value={firstName}
                onChange={onProfileFieldChange}
                disabled={loading || profileSaving}
                slotProps={{ htmlInput: { maxLength: PROFILE_NAME_MAX_LENGTH } }}
              />
              <FormTextField
                label="Last name"
                name="lastName"
                value={lastName}
                onChange={onProfileFieldChange}
                disabled={loading || profileSaving}
                slotProps={{ htmlInput: { maxLength: PROFILE_NAME_MAX_LENGTH } }}
              />
            </Stack>
            <FormTextField
              label="City"
              name="city"
              value={city}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
              slotProps={{ htmlInput: { maxLength: PROFILE_CITY_MAX_LENGTH } }}
            />
            <Autocomplete
              multiple
              options={ENGINEER_SKILL_OPTIONS}
              value={selectedSkills}
              onChange={(_event, value) => onProfileSkillsChange(value)}
              filterSelectedOptions
              disabled={loading || profileSaving}
              renderInput={(params) => <FormTextField {...params} label="Skills" />}
            />
            <FormSelectField
              label="Availability status"
              name="availabilityStatus"
              value={availabilityStatus}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
              options={availabilityOptions}
            />
            <FormTextField
              label="Availability note"
              name="availabilityNote"
              value={availabilityNote}
              onChange={onProfileFieldChange}
              disabled={loading || profileSaving}
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: PROFILE_AVAILABILITY_NOTE_MAX_LENGTH } }}
            />
            <Stack spacing={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Typography variant="subtitle2">Upcoming holidays / time off</Typography>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onAddHoliday}
                  disabled={loading || profileSaving}
                  sx={stackedActionButtonSx}
                >
                  Add holiday
                </Button>
              </Stack>
              {holidayItems.length ? (
                holidayItems.map((holiday, index) => (
                  <Box key={`admin-holiday-${index}`} sx={holidayRowSx}>
                    <FormTextField
                      label="Label"
                      value={typeof holiday?.label === "string" ? holiday.label : ""}
                      onChange={(event) => onHolidayChange(index, "label", event.target.value)}
                      disabled={loading || profileSaving}
                      sx={holidayLabelFieldSx}
                      slotProps={{ htmlInput: { maxLength: PROFILE_HOLIDAY_LABEL_MAX_LENGTH } }}
                    />
                    <FormDateField
                      label="Start date"
                      value={typeof holiday?.startDate === "string" ? holiday.startDate : ""}
                      onChange={(event) => onHolidayChange(index, "startDate", event.target.value)}
                      disabled={loading || profileSaving}
                      sx={holidayDateFieldSx}
                    />
                    <FormDateField
                      label="End date"
                      value={typeof holiday?.endDate === "string" ? holiday.endDate : ""}
                      onChange={(event) => onHolidayChange(index, "endDate", event.target.value)}
                      disabled={loading || profileSaving}
                      sx={holidayDateFieldSx}
                    />
                    <IconButton
                      aria-label="Remove holiday"
                      onClick={() => onRemoveHoliday(index)}
                      disabled={loading || profileSaving}
                      sx={holidayRemoveButtonSx}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">
                  No upcoming time off scheduled. Add a holiday to keep staffing plans accurate.
                </Typography>
              )}
            </Stack>
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || profileSaving}
                sx={stackedActionButtonSx}
              >
                {profileSaving ? "Saving..." : "Save personal information"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
