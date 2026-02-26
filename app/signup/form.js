"use client";

import Link from "next/link";
import { Alert, Avatar, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { PASSWORD_MAX_BYTES } from "../constants/password-policy";
import CloudinaryAvatarUploadButton from "../components/cloudinary-avatar-upload-button";

const placeholderAvatar = "/images/nonbinary-avatar.svg";

export default function SignupForm({
  formState,
  fieldErrors,
  error,
  isSubmitting,
  avatarPreview,
  onSubmit,
  onFieldChange,
  onFieldBlur,
  onAvatarUpload,
  onAvatarUploadError,
}) {
  return (
    <Stack spacing={3}>
      <Stack spacing={1} alignItems="center">
        <Avatar src={avatarPreview || placeholderAvatar} sx={{ width: 96, height: 96 }} />
        <CloudinaryAvatarUploadButton
          disabled={isSubmitting}
          onUpload={onAvatarUpload}
          onError={onAvatarUploadError}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h4">Create your account</Typography>
        <Typography color="text.secondary">
          Add your details to get started with Devcombine Engineering Portal.
        </Typography>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First name"
              name="firstName"
              value={formState.firstName}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              error={!!fieldErrors.firstName}
              helperText={fieldErrors.firstName || ""}
              required
              fullWidth
            />
            <TextField
              label="Last name"
              name="lastName"
              value={formState.lastName}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              error={!!fieldErrors.lastName}
              helperText={fieldErrors.lastName || ""}
              required
              fullWidth
            />
          </Stack>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formState.email}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email || ""}
            required
            fullWidth
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formState.password}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || ""}
            slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_BYTES } }}
            required
            fullWidth
          />
          <TextField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={formState.confirmPassword}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword || ""}
            slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_BYTES } }}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Already have an account? <Link href="/login">Sign in</Link>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
