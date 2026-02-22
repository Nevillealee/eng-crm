"use client";

import Cropper from "react-easy-crop";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
} from "@mui/material";

export default function AvatarCropDialog({
  open,
  image,
  crop,
  zoom,
  title = "Adjust your avatar",
  applyLabel = "Apply",
  cancelLabel = "Cancel",
  onClose,
  onApply,
  onCropChange,
  onZoomChange,
  onCropComplete,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ position: "relative", height: 300, bgcolor: "grey.100", borderRadius: 1 }}>
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography gutterBottom>Zoom</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_event, value) => onZoomChange(Array.isArray(value) ? value[0] : value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onApply} variant="contained">
          {applyLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
