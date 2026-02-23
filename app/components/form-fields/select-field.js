"use client";

import { MenuItem, TextField } from "@mui/material";

export default function FormSelectField({
  options = [],
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  getOptionKey,
  fullWidth = true,
  ...props
}) {
  return (
    <TextField select {...props} fullWidth={fullWidth}>
      {options.map((option, index) => {
        const optionValue = getOptionValue(option);
        const optionKey = getOptionKey ? getOptionKey(option, index) : String(optionValue);

        return (
          <MenuItem key={optionKey} value={optionValue}>
            {getOptionLabel(option)}
          </MenuItem>
        );
      })}
    </TextField>
  );
}
