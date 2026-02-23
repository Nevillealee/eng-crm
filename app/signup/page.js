"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Paper } from "@mui/material";
import AvatarCropDialog from "../components/avatar-crop-dialog";
import { blobToBase64 } from "../components/profile-form-shared";
import getCroppedImage from "./crop-image";
import SignupForm from "./form";
import { validateSignupField, validateSignupForm } from "./validation";

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password" && formState.confirmPassword) {
      const mismatch = formState.confirmPassword !== value ? "Passwords do not match." : "";
      setFieldErrors((prev) => ({ ...prev, confirmPassword: mismatch }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const err = validateSignupField(name, value, formState);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const newErrors = validateSignupForm(formState);
    setFieldErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const avatarBase64 = avatarBlob ? await blobToBase64(avatarBlob) : null;

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
          <SignupForm
            formState={formState}
            fieldErrors={fieldErrors}
            error={error}
            isSubmitting={isSubmitting}
            avatarPreview={avatarPreview}
            onSubmit={handleSubmit}
            onFieldChange={handleChange}
            onFieldBlur={handleBlur}
            onImageSelection={handleImageSelection}
          />
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
