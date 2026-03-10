"use client";

import { alpha, ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      light: "#dbe5f4",
      main: "#345b93",
      dark: "#27466f",
      contrastText: "#fcfdff",
    },
    background: {
      default: "#eef3f8",
      paper: "#fcfdff",
      subtle: "#dde7f4",
    },
    text: {
      primary: "#172033",
      secondary: "#5d6878",
    },
    divider: "#d3dceb",
  },
  typography: {
    fontFamily: '"Space Grotesk", "Helvetica Neue", "Arial", sans-serif',
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.12em",
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.015em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          backgroundImage: "none",
        },
        outlined: ({ theme: currentTheme }) => ({
          borderColor: alpha(currentTheme.palette.primary.main, 0.12),
        }),
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme: currentTheme }) => ({
          transition: currentTheme.transitions.create(
            ["background-color", "border-color", "box-shadow", "color", "transform"],
            { duration: 160 }
          ),
          "&.Mui-focusVisible": {
            outline: `3px solid ${alpha(currentTheme.palette.primary.main, 0.24)}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: currentTheme }) => ({
          borderRadius: 16,
          backgroundColor: alpha(currentTheme.palette.background.paper, 0.94),
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: currentTheme.palette.divider,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: currentTheme.palette.primary.light,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: currentTheme.palette.primary.main,
            borderWidth: 1.5,
          },
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 14,
          paddingInline: 18,
          paddingBlock: 10,
        },
        contained: {
          boxShadow: "none",
        },
        outlined: {
          borderWidth: 1.5,
        },
        text: {
          paddingInline: 12,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme: currentTheme }) => ({
          textUnderlineOffset: 3,
          textDecorationColor: alpha(currentTheme.palette.primary.main, 0.32),
        }),
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
