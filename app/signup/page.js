"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarType, setAvatarType] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
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
      const previewUrl = URL.createObjectURL(blob);
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

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
                Add your details to get started with ENG CRM.
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
                    required
                    fullWidth
                  />
                  <TextField
                    label="Last name"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleChange}
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
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={formState.confirmPassword}
                  onChange={handleChange}
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
      <Dialog open={cropDialogOpen} onClose={handleCropCancel} fullWidth>
        <DialogTitle>Adjust your avatar</DialogTitle>
        <DialogContent>
          <Box sx={{ position: "relative", width: "100%", height: 320 }}>
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </Box>
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Zoom
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) =>
                setZoom(Array.isArray(value) ? value[0] : value)
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel}>Cancel</Button>
          <Button onClick={handleCropSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
