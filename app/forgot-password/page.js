import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={2}>
            <Typography variant="h4">Reset your password</Typography>
            <Typography color="text.secondary">
              Password recovery is handled by your ENG CRM administrator.
              Please contact support to reset your access.
            </Typography>
            <Link href="/login">Return to sign in</Link>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}