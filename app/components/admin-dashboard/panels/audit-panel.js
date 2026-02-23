"use client";

import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { FormSelectField } from "../../form-fields";
import { auditDesktopMaxHeight, auditDesktopVisibleRows } from "../shared/constants";
import { formatAuditTimestamp } from "../shared/formatters";

export default function AuditPanel({
  auditLogs,
  filteredAuditLogs,
  auditActionFilter,
  auditActionOptions,
  onAuditActionFilterChange,
}) {
  const auditFilterOptions = [{ value: "all", label: "All actions" }].concat(
    auditActionOptions.map((action) => ({ value: action, label: action }))
  );

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Audit log</Typography>
        <Typography color="text.secondary">
          Showing {filteredAuditLogs.length} of {auditLogs.length} entries.
        </Typography>
        <FormSelectField
          label="Filter by action"
          value={auditActionFilter}
          onChange={(event) => onAuditActionFilterChange(event.target.value)}
          size="small"
          sx={{ maxWidth: 320 }}
          options={auditFilterOptions}
        />
        {filteredAuditLogs.length === 0 ? (
          <Alert severity="info">
            {auditLogs.length === 0
              ? "No audit entries yet."
              : "No audit entries match this action filter."}
          </Alert>
        ) : (
          <Box
            sx={{
              maxHeight: {
                xs: "none",
                md: filteredAuditLogs.length > auditDesktopVisibleRows ? auditDesktopMaxHeight : "none",
              },
              overflowY: {
                xs: "visible",
                md: filteredAuditLogs.length > auditDesktopVisibleRows ? "auto" : "visible",
              },
              pr: {
                xs: 0,
                md: filteredAuditLogs.length > auditDesktopVisibleRows ? 1 : 0,
              },
              scrollbarGutter: "stable",
              overscrollBehavior: "contain",
            }}
          >
            <Stack spacing={1.5}>
              {filteredAuditLogs.map((entry) => (
                <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Typography variant="subtitle2">{entry.summary}</Typography>
                      <Chip size="small" variant="outlined" label={entry.action} />
                    </Stack>
                    <Typography color="text.secondary">Actor: {entry.actorEmail || "Unknown"}</Typography>
                    <Typography color="text.secondary">
                      Target: {entry.targetType}
                      {entry.targetValue || entry.targetId
                        ? ` (${entry.targetValue || entry.targetId})`
                        : ""}
                    </Typography>
                    <Typography color="text.secondary">Time: {formatAuditTimestamp(entry.createdAt)}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
