"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  PROFILE_AVAILABILITY_NOTE_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
  PROFILE_HOLIDAY_LABEL_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
} from "../../constants/text-limits";
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
  const profile = form && typeof form === "object" ? form : {};
  const holidayItems = Array.isArray(profile.upcomingHolidays) ? profile.upcomingHolidays : [];
  const selectedSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const firstName = typeof profile.firstName === "string" ? profile.firstName : "";
  const lastName = typeof profile.lastName === "string" ? profile.lastName : "";
  const city = typeof profile.city === "string" ? profile.city : "";
  const availabilityStatus =
    typeof profile.availabilityStatus === "string" ? profile.availabilityStatus : "";
  const availabilityNote = typeof profile.availabilityNote === "string" ? profile.availabilityNote : "";

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h5">Personal information</Typography>
          <Typography color="text.secondary">Update your skillset and availability details.</Typography>
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              alt={`${firstName} ${lastName}`.trim() || "Engineer avatar"}
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
              disabled={loading || saving}
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
              disabled={loading || saving || !avatarPreview}
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
            onChange={onFieldChange}
            disabled={loading || saving}
            slotProps={{ htmlInput: { maxLength: PROFILE_NAME_MAX_LENGTH } }}
          />
          <FormTextField
            label="Last name"
            name="lastName"
            value={lastName}
            onChange={onFieldChange}
            disabled={loading || saving}
            slotProps={{ htmlInput: { maxLength: PROFILE_NAME_MAX_LENGTH } }}
          />
        </Stack>
        <FormTextField
          label="Location"
          name="city"
          value={city}
          onChange={onFieldChange}
          disabled={loading || saving}
          slotProps={{ htmlInput: { maxLength: PROFILE_CITY_MAX_LENGTH } }}
        />
        <Autocomplete
          multiple
          options={engineerSkillOptions}
          value={selectedSkills}
          onChange={(_, value) => onSkillsChange(value)}
          filterSelectedOptions
          disabled={loading || saving}
          renderInput={(params) => <FormTextField {...params} label="Skills" />}
        />
        <FormSelectField
          label="Availability status"
          name="availabilityStatus"
          value={availabilityStatus}
          onChange={onFieldChange}
          disabled={loading || saving}
          options={availabilityOptions}
        />
        <FormTextField
          label="Availability note"
          name="availabilityNote"
          value={availabilityNote}
          onChange={onFieldChange}
          disabled={loading || saving}
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
              disabled={loading || saving}
              sx={stackedActionButtonSx}
            >
              Add holiday
            </Button>
          </Stack>
          {holidayItems.length ? (
            holidayItems.map((holiday, index) => (
              <Box key={`holiday-${index}`} sx={holidayRowSx}>
                <FormTextField
                  label="Label"
                  value={typeof holiday?.label === "string" ? holiday.label : ""}
                  onChange={(event) => onHolidayChange(index, "label", event.target.value)}
                  disabled={loading || saving}
                  sx={holidayLabelFieldSx}
                  slotProps={{ htmlInput: { maxLength: PROFILE_HOLIDAY_LABEL_MAX_LENGTH } }}
                />
                <FormDateField
                  label="Start date"
                  value={typeof holiday?.startDate === "string" ? holiday.startDate : ""}
                  onChange={(event) => onHolidayChange(index, "startDate", event.target.value)}
                  disabled={loading || saving}
                  sx={holidayDateFieldSx}
                />
                <FormDateField
                  label="End date"
                  value={typeof holiday?.endDate === "string" ? holiday.endDate : ""}
                  onChange={(event) => onHolidayChange(index, "endDate", event.target.value)}
                  disabled={loading || saving}
                  sx={holidayDateFieldSx}
                />
                <IconButton
                  aria-label="Remove holiday"
                  onClick={() => onRemoveHoliday(index)}
                  disabled={loading || saving}
                  sx={holidayRemoveButtonSx}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            ))
          ) : (
            <Typography color="text.secondary">
              No upcoming time off scheduled. Add a holiday to keep your availability current.
            </Typography>
          )}
        </Stack>
        <Box>
          <Button type="submit" variant="contained" disabled={loading || saving} sx={stackedActionButtonSx}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
