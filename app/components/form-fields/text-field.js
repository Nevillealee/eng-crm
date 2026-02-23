"use client";

import { TextField } from "@mui/material";

export default function FormTextField({ fullWidth = true, ...props }) {
  return <TextField {...props} fullWidth={fullWidth} />;
}
