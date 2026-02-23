export const navigationItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "engineers", label: "Engineers" },
  { id: "personal", label: "Personal information" },
  { id: "projects", label: "Projects" },
  { id: "audit", label: "Audit log" },
];

export const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "partially_allocated", label: "Partially allocated" },
  { value: "unavailable", label: "Unavailable" },
];

export const availabilityColorByValue = {
  available: "success",
  partially_allocated: "warning",
  unavailable: "default",
};

export const projectStatusOptions = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export const projectSortByOptions = [
  { value: "date", label: "Date" },
  { value: "cost", label: "Cost" },
];

export const projectSortDirectionOptions = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export const auditDesktopVisibleRows = 4;
const auditRowEstimatedHeight = 108;
const auditRowGap = 12;

export const auditDesktopMaxHeight =
  auditDesktopVisibleRows * auditRowEstimatedHeight +
  (auditDesktopVisibleRows - 1) * auditRowGap;
