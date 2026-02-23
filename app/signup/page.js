"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AvatarCropDialog from "../components/avatar-crop-dialog";
import getCroppedImage from "./crop-image";

const placeholderAvatar = "/images/nonbinary-avatar.svg";

export default function SignupPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarType, setAvatarType] = useState("");
  const avatarPreviewObjectUrlRef = useRef(null);

  const revokeAvatarPreviewObjectUrl = () => {
    if (avatarPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
      avatarPreviewObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewObjectUrlRef.current);
        avatarPreviewObjectUrlRef.current = null;
      }
    };
  }, []);

  const validateField = (name, value, currentForm) => {
    switch (name) {
      case "firstName":
      case "lastName":
        return value.trim() ? "" : "This field is required.";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (Buffer.byteLength(value) > 32) return "Password must be 32 characters or fewer.";
        return "";
      case "confirmPassword": {
        const pw = currentForm ? currentForm.password : formState.password;
        return value === pw ? "" : "Passwords do not match.";
      }
      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear the field error as soon as the user starts typing
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    // Also re-validate confirmPassword live when password changes
    if (name === "password" && formState.confirmPassword) {
      const mismatch = formState.confirmPassword !== value ? "Passwords do not match." : "";
      setFieldErrors((prev) => ({ ...prev, confirmPassword: mismatch }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
        setCropDialogOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setSelectedImage("");
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      return;
    }
    try {
      const blob = await getCroppedImage(selectedImage, croppedAreaPixels);
      revokeAvatarPreviewObjectUrl();
      const previewUrl = URL.createObjectURL(blob);
      avatarPreviewObjectUrlRef.current = previewUrl;
      setAvatarBlob(blob);
      setAvatarPreview(previewUrl);
      setAvatarType("image/png");
      setCropDialogOpen(false);
      setSelectedImage("");
    } catch {
      setError("Unable to process the image. Please try another file.");
      setCropDialogOpen(false);
    }
  };

  const toBase64 = async (blob) => {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validate all fields before submitting
    const fields = ["firstName", "lastName", "email", "password", "confirmPassword"];
    const newErrors = {};
    for (const field of fields) {
      newErrors[field] = validateField(field, formState[field]);
    }
    setFieldErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);

    try {
      const avatarBase64 = avatarBlob ? await toBase64(avatarBlob) : null;

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          avatar: avatarBase64,
          avatarType: avatarBase64 ? avatarType : null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const safeError =
          response.status >= 500
            ? "Sign-up is temporarily unavailable. Please try again in a few minutes."
            : payload?.error || "Unable to create account.";
        setError(safeError);
        return;
      }

      revokeAvatarPreviewObjectUrl();
      router.push("/login?signup=success");
      router.refresh();
    } catch {
      setError("Sign-up is temporarily unavailable. Please try again in a few minutes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={3}>
            <Stack spacing={1} alignItems="center">
              <Avatar
                src={avatarPreview || placeholderAvatar}
                sx={{ width: 96, height: 96 }}
              />
              <Button variant="outlined" component="label">
                Upload avatar
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageSelection}
                />
              </Button>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h4">Create your account</Typography>
              <Typography color="text.secondary">
                Add your details to get started with Devcombine Engineering Portal.
              </Typography>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First name"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!fieldErrors.firstName}
                    helperText={fieldErrors.firstName || ""}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Last name"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || ""}
                  slotProps={{ htmlInput: { maxLength: 32 } }}
                  required
                  fullWidth
                />
                <TextField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={formState.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword || ""}
                  slotProps={{ htmlInput: { maxLength: 32 } }}
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Already have an account? <Link href="/login">Sign in</Link>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
      <AvatarCropDialog
        open={cropDialogOpen}
        image={selectedImage}
        crop={crop}
        zoom={zoom}
        onClose={handleCropCancel}
        onApply={handleCropSave}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
        applyLabel="Save"
      />
    </Box>
  );
}
