"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#007aff",
    },
    background: {
      default: "#f5f5f7",
      paper: "#ffffff",
    },
    text: {
      primary: "#1d1d1f",
      secondary: "#6e6e73",
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Helvetica Neue", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingInline: 28,
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}