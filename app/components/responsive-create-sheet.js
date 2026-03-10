"use client";

import { Box, Drawer } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function ResponsiveCreateSheet({ open, onClose, children }) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  if (!open) {
    return null;
  }

  if (!isCompact) {
    return children;
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "min(88vh, 760px)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 1.5, pb: 3, overflowY: "auto" }}>
        <Box
          sx={{
            width: 44,
            height: 4,
            mx: "auto",
            mb: 2,
            borderRadius: 999,
            bgcolor: "divider",
          }}
        />
        {children}
      </Box>
    </Drawer>
  );
}
