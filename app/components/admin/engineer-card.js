"use client";

import {
  ENGINEER_SALARY_NOTES_MAX_LENGTH,
  PROFILE_CITY_MAX_LENGTH,
} from "../../constants/text-limits";
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

function DetailBlock({ label, value }) {
  return (
    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        dir="auto"
        sx={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Stack>
  );
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
  onViewTasks,
  onBeginEditComp,
  onUpdateEngineerDraft,
  onSaveEngineerComp,
  onCancelEditComp,
}) {
  const engineerRecord = engineer && typeof engineer === "object" ? engineer : {};
  const holidayItems = Array.isArray(engineerRecord.upcomingHolidays)
    ? engineerRecord.upcomingHolidays
    : [];
  const projectItems = Array.isArray(projects) ? projects : [];
  const now = new Date();
  const avatarSrc =
    typeof engineerRecord.image === "string" && engineerRecord.image.trim()
      ? engineerRecord.image.trim()
      : undefined;
  const engineerDisplayName =
    engineerRecord.name ||
    `${engineerRecord.firstName || ""} ${engineerRecord.lastName || ""}`.trim() ||
    engineerRecord.email ||
    "Engineer";
  const holidayRegionId = `engineer-${engineerRecord.id || "unknown"}-holidays`;
  const projectRegionId = `engineer-${engineerRecord.id || "unknown"}-projects`;
  const engineerActiveProjects = projectItems.filter(
    (project) =>
      project.status !== "archived" &&
      (!project.endDate || new Date(project.endDate) >= now) &&
      Array.isArray(project.teamMembers) &&
      project.teamMembers.some((member) => member.id === engineerRecord.id)
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.75, sm: 2 } }}>
      <Stack spacing={1.25}>
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
            <Avatar
              alt={
                engineerDisplayName || "Engineer avatar"
              }
              src={avatarSrc}
            >
              {(engineerRecord.firstName || engineerRecord.email || "U").slice(0, 1).toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h6"
                dir="auto"
                sx={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                {engineerDisplayName}
              </Typography>
              <Typography
                dir="auto"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
              >
                {engineerRecord.email || "Email unavailable"}
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
          <Chip
            size="small"
            variant="outlined"
            label={`Location: ${engineerRecord.city || "Not set"}`}
          />
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <DetailBlock
            label="Skills"
            value={
              Array.isArray(engineerRecord.skills) && engineerRecord.skills.length
                ? engineerRecord.skills.join(", ")
                : "None"
            }
          />
          {engineerRecord.availabilityNote ? (
            <DetailBlock label="Availability note" value={engineerRecord.availabilityNote} />
          ) : null}
          <DetailBlock label="Last login" value={formatLastLogin(engineerRecord.lastLogin)} />
          <DetailBlock label="Last login IP" value={engineerRecord.lastLoginIp || "N/A"} />
        </Box>
        <Stack spacing={0.5}>
          <Button
            type="button"
            variant="text"
            onClick={onToggleHoliday}
            aria-expanded={isHolidayExpanded}
            aria-controls={holidayRegionId}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              justifyContent: "space-between",
              px: 0,
              minWidth: 0,
              textTransform: "none",
            }}
          >
            Upcoming holidays: {holidayItems.length}
          </Button>
          <Collapse in={isHolidayExpanded} timeout="auto" unmountOnExit>
            <Box id={holidayRegionId}>
              {holidayItems.length ? (
                <Stack spacing={0.5}>
                  {holidayItems.map((holiday, index) => (
                    <Typography
                      key={`engineer-holiday-${engineerRecord.id}-${index}`}
                      color="text.secondary"
                      dir="auto"
                      sx={{ pl: 1, overflowWrap: "anywhere", wordBreak: "break-word" }}
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
            </Box>
          </Collapse>
        </Stack>
        <Stack spacing={0.5}>
          <Button
            type="button"
            variant="text"
            onClick={onToggleProjects}
            aria-expanded={isProjectsExpanded}
            aria-controls={projectRegionId}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              justifyContent: "space-between",
              px: 0,
              minWidth: 0,
              textTransform: "none",
            }}
          >
            Current projects: {engineerActiveProjects.length}
          </Button>
          <Collapse in={isProjectsExpanded} timeout="auto" unmountOnExit>
            <Box id={projectRegionId}>
              {engineerActiveProjects.length ? (
                <Stack spacing={0.5}>
                  {engineerActiveProjects.map((project) => (
                    <ButtonBase
                      key={`engineer-project-${engineerRecord.id}-${project.id}`}
                      onClick={() => onProjectClick(project)}
                      sx={{
                        justifyContent: "flex-start",
                        width: "100%",
                        px: 1,
                        py: 0.75,
                        minHeight: 44,
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography
                        color="primary"
                        dir="auto"
                        sx={{
                          textDecoration: "underline",
                          cursor: "pointer",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
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
            </Box>
          </Collapse>
        </Stack>
        {!isEditingComp ? (
          <Stack spacing={1}>
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <DetailBlock
                label="Monthly salary (PHP)"
                value={formatMonthlySalaryPhp(engineerRecord.monthlySalaryPhp)}
              />
              <DetailBlock label="Salary notes" value={engineerRecord.salaryNotes || "None"} />
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => onViewTasks?.(engineerRecord.id)}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Tasks
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={onBeginEditComp}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Edit
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <TextField
                label="Location"
                value={typeof engineerRecord.cityDraft === "string" ? engineerRecord.cityDraft : ""}
                onChange={(event) =>
                  onUpdateEngineerDraft(engineerRecord.id, "cityDraft", event.target.value)
                }
                slotProps={{ htmlInput: { maxLength: PROFILE_CITY_MAX_LENGTH, dir: "auto" } }}
              />
              <TextField
                label="Monthly salary (PHP)"
                type="number"
                value={
                  typeof engineerRecord.monthlySalaryPhpDraft === "string" ||
                  typeof engineerRecord.monthlySalaryPhpDraft === "number"
                    ? engineerRecord.monthlySalaryPhpDraft
                    : ""
                }
                onChange={(event) =>
                  onUpdateEngineerDraft(engineerRecord.id, "monthlySalaryPhpDraft", event.target.value)
                }
                slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }}
              />
              <TextField
                label="Salary notes"
                value={typeof engineerRecord.salaryNotesDraft === "string" ? engineerRecord.salaryNotesDraft : ""}
                onChange={(event) =>
                  onUpdateEngineerDraft(engineerRecord.id, "salaryNotesDraft", event.target.value)
                }
                fullWidth
                sx={{ gridColumn: { sm: "1 / -1" } }}
                slotProps={{
                  htmlInput: { maxLength: ENGINEER_SALARY_NOTES_MAX_LENGTH, dir: "auto" },
                }}
              />
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                onClick={onSaveEngineerComp}
                disabled={isSalarySaving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {isSalarySaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="text"
                onClick={onCancelEditComp}
                disabled={isSalarySaving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
