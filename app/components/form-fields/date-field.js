"use client";

import { TextField } from "@mui/material";

function withShrunkLabel(slotProps) {
  const resolvedSlotProps = slotProps || {};
  const inputLabelProps = resolvedSlotProps.inputLabel || {};

  return {
    ...resolvedSlotProps,
    inputLabel: {
      shrink: true,
      ...inputLabelProps,
    },
  };
}

export default function FormDateField({ slotProps, ...props }) {
  return <TextField type="date" {...props} slotProps={withShrunkLabel(slotProps)} />;
}
