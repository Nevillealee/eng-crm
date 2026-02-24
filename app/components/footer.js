"use client";

import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 8,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Devcombine Engineering Portal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A powerful customer relationship management tool designed for engineering teams.
                Simple, secure, and built for speed.
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                Product
              </Typography>
              <Link href="#" color="text.secondary" underline="hover">
                Features
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Pricing
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Integrations
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Changelog
              </Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                Support
              </Typography>
              <Link href="#" color="text.secondary" underline="hover">
                Documentation
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                API Reference
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Help Center
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Contact Us
              </Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                Legal
              </Typography>
              <Link href="#" color="text.secondary" underline="hover">
                Privacy Policy
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Terms of Service
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Cookie Policy
              </Link>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                &copy; {new Date().getFullYear()} Devcombine Engineering Portal. All rights reserved.
                <br />
                Trusted by engineering teams worldwide.
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
