"use client";

import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function formatLastLogin(value) {
  if (!value) {
    return "Never";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Never";
  }
  return parsed.toLocaleString();
}

function formatMonthlySalaryPhp(value) {
  if (typeof value !== "number") {
    return "Not set";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHolidayDate(value) {
  if (typeof value !== "string") {
    return "TBD";
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  return parsed.toLocaleDateString();
}

export default function EngineerCard({
  engineer,
  projects,
  isEditingComp,
  isHolidayExpanded,
  isProjectsExpanded,
  isSalarySaving,
  availabilityColor,
  availabilityLabel,
  onToggleHoliday,
  onToggleProjects,
  onProjectClick,
  onBeginEditComp,
  onUpdateEngineerDraft,
  onSaveEngineerComp,
  onCancelEditComp,
}) {
  const holidayItems = Array.isArray(engineer.upcomingHolidays) ? engineer.upcomingHolidays : [];
  const now = new Date();
  const engineerActiveProjects = projects.filter(
    (project) =>
      project.status !== "archived" &&
      (!project.endDate || new Date(project.endDate) >= now) &&
      Array.isArray(project.teamMembers) &&
      project.teamMembers.some((member) => member.id === engineer.id)
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="flex-start"
          sx={{ minWidth: 0 }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: 0, flex: 1 }}
          >
            <Avatar src={engineer.avatarSrc || engineer.image || undefined}>
              {(engineer.firstName || engineer.email || "U").slice(0, 1).toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" sx={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                {engineer.name ||
                  `${engineer.firstName || ""} ${engineer.lastName || ""}`.trim() ||
                  engineer.email}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
              >
                {engineer.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            size="small"
            color={availabilityColor || "default"}
            label={`Availability: ${availabilityLabel}`}
          />
          {engineer.city ? <Chip size="small" variant="outlined" label={`City: ${engineer.city}`} /> : null}
        </Stack>
        <Typography color="text.secondary">
          Skills: {Array.isArray(engineer.skills) && engineer.skills.length ? engineer.skills.join(", ") : "None"}
        </Typography>
        {engineer.availabilityNote ? (
          <Typography color="text.secondary">Availability note: {engineer.availabilityNote}</Typography>
        ) : null}
        <Stack spacing={0.5}>
          <Button
            type="button"
            variant="text"
            onClick={onToggleHoliday}
            sx={{ alignSelf: "flex-start", px: 0, minWidth: 0, textTransform: "none" }}
          >
            Upcoming holidays: {holidayItems.length}
          </Button>
          <Collapse in={isHolidayExpanded} timeout="auto" unmountOnExit>
            {holidayItems.length ? (
              <Stack spacing={0.5}>
                {holidayItems.map((holiday, index) => (
                  <Typography
                    key={`engineer-holiday-${engineer.id}-${index}`}
                    color="text.secondary"
                    sx={{ pl: 1 }}
                  >
                    {(holiday?.label || "Holiday").trim()}: {formatHolidayDate(holiday?.startDate)} -{" "}
                    {formatHolidayDate(holiday?.endDate)}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ pl: 1 }}>
                No upcoming holidays
              </Typography>
            )}
          </Collapse>
        </Stack>
        <Stack spacing={0.5}>
          <Button
            type="button"
            variant="text"
            onClick={onToggleProjects}
            sx={{ alignSelf: "flex-start", px: 0, minWidth: 0, textTransform: "none" }}
          >
            Current projects: {engineerActiveProjects.length}
          </Button>
          <Collapse in={isProjectsExpanded} timeout="auto" unmountOnExit>
            {engineerActiveProjects.length ? (
              <Stack spacing={0.5}>
                {engineerActiveProjects.map((project) => (
                  <ButtonBase
                    key={`engineer-project-${engineer.id}-${project.id}`}
                    onClick={() => onProjectClick(project)}
                    sx={{ justifyContent: "flex-start", pl: 1, borderRadius: 1 }}
                  >
                    <Typography color="primary" sx={{ textDecoration: "underline", cursor: "pointer" }}>
                      {project.name}
                    </Typography>
                  </ButtonBase>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ pl: 1 }}>
                No active projects
              </Typography>
            )}
          </Collapse>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }}>
          <Typography color="text.secondary">Last login: {formatLastLogin(engineer.lastLogin)}</Typography>
          <Typography color="text.secondary">Last login IP: {engineer.lastLoginIp || "N/A"}</Typography>
        </Stack>
        {!isEditingComp ? (
          <Stack spacing={1}>
            <Typography color="text.secondary">
              Monthly salary (PHP): {formatMonthlySalaryPhp(engineer.monthlySalaryPhp)}
            </Typography>
            <Typography color="text.secondary">Salary notes: {engineer.salaryNotes || "None"}</Typography>
            <Box>
              <Button type="button" variant="outlined" onClick={onBeginEditComp}>
                Edit
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Monthly salary (PHP)"
              type="number"
              value={engineer.monthlySalaryPhpDraft}
              onChange={(event) =>
                onUpdateEngineerDraft(engineer.id, "monthlySalaryPhpDraft", event.target.value)
              }
              inputProps={{ min: 0, step: 1 }}
              sx={{ minWidth: { sm: 220 } }}
            />
            <TextField
              label="Salary notes"
              value={engineer.salaryNotesDraft}
              onChange={(event) => onUpdateEngineerDraft(engineer.id, "salaryNotesDraft", event.target.value)}
              fullWidth
            />
            <Button type="button" variant="outlined" onClick={onSaveEngineerComp} disabled={isSalarySaving}>
              {isSalarySaving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="text" onClick={onCancelEditComp} disabled={isSalarySaving}>
              Cancel
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
