import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import { Box } from "@mui/material";
import "./globals.css";
import ThemeRegistry from "./theme-registry";

export const metadata = {
  title: "Devcombine Engineering Portal",
  description: "Secure login for Devcombine Engineering Portal",
};

const skipLinkSx = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1400,
  px: 2,
  py: 1.25,
  borderRadius: 1.5,
  bgcolor: "text.primary",
  color: "background.paper",
  textDecoration: "none",
  transform: "translateY(-160%)",
  transition: "transform 160ms ease",
  "&:focus": {
    transform: "translateY(0)",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Box component="a" href="#main-content" sx={skipLinkSx}>
            Skip to content
          </Box>
          <Box component="main" id="main-content" sx={{ minHeight: "100vh" }}>
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
