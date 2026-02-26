"use client";

import { Button } from "@mui/material";
import { CldUploadWidget } from "next-cloudinary";

const avatarUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

const avatarWidgetOptions = {
  multiple: false,
  maxFiles: 1,
  resourceType: "image",
  clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
  maxFileSize: 2 * 1024 * 1024,
};

function resolveUploadUrl(result) {
  const info = result?.info;
  if (!info || typeof info !== "object") {
    return "";
  }

  if (typeof info.secure_url === "string") {
    return info.secure_url.trim();
  }

  if (typeof info.url === "string") {
    return info.url.trim();
  }

  return "";
}

export default function CloudinaryAvatarUploadButton({
  disabled = false,
  label = "Upload avatar",
  onUpload,
  onError,
}) {
  if (!avatarUploadPreset) {
    return (
      <Button
        type="button"
        variant="outlined"
        disabled={disabled}
        onClick={() =>
          onError?.("Avatar upload is unavailable. Missing configuration.s")
        }
      >
        {label}
      </Button>
    );
  }

  return (
    <CldUploadWidget
      uploadPreset={avatarUploadPreset}
      options={avatarWidgetOptions}
      onSuccess={(result) => {
        const uploadedUrl = resolveUploadUrl(result);
        if (!uploadedUrl) {
          onError?.("Avatar upload did not return a valid image URL.");
          return;
        }
        onUpload?.(uploadedUrl);
      }}
      onError={(uploadError) => {
        const errorMessage =
          (uploadError && typeof uploadError === "object" && "message" in uploadError
            ? String(uploadError.message || "")
            : "") || "Avatar upload failed. Please try again.";
        onError?.(errorMessage);
      }}
      onQueuesEnd={(_result, { widget }) => {
        widget.close();
      }}
    >
      {({ open }) => (
        <Button type="button" variant="outlined" disabled={disabled} onClick={() => open()}>
          {label}
        </Button>
      )}
    </CldUploadWidget>
  );
}
