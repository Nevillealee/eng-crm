const AuditPanel = require("../../../app/components/admin-dashboard/panels/audit-panel").default;
const { findFirstElement, treeText } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  const log = {
    id: "log-1",
    summary: "Archived project Phoenix.",
    action: "project.archived",
    actorEmail: "admin@example.com",
    targetType: "project",
    targetValue: "Phoenix",
    targetId: "proj-1",
    createdAt: "2026-02-01T10:00:00.000Z",
  };

  return {
    auditLogs: [log],
    filteredAuditLogs: [log],
    auditActionFilter: "all",
    auditActionOptions: ["project.archived", "project.created"],
    onAuditActionFilterChange: jest.fn(),
    ...overrides,
  };
}

describe("Given the audit panel", () => {
  it("When logs exist, then the panel shows count summary and audit entry details", () => {
    const text = treeText(AuditPanel(buildProps()));

    expect(text).toContain("Showing 1 of 1 entries.");
    expect(text).toContain("Archived project Phoenix.");
    expect(text).toContain("Actor: admin@example.com");
  });

  it("When no logs exist, then the no-audit-entries message is shown", () => {
    const text = treeText(
      AuditPanel(
        buildProps({
          auditLogs: [],
          filteredAuditLogs: [],
          auditActionOptions: [],
        })
      )
    );

    expect(text).toContain("No audit entries yet.");
  });

  it("When logs exist but no entries match the selected action, then filtered-empty message is shown", () => {
    const text = treeText(
      AuditPanel(
        buildProps({
          filteredAuditLogs: [],
          auditActionFilter: "project.created",
        })
      )
    );

    expect(text).toContain("No audit entries match this action filter.");
  });

  it("When filter selection changes, then the action filter callback receives the selected action", () => {
    const onAuditActionFilterChange = jest.fn();
    const tree = AuditPanel(buildProps({ onAuditActionFilterChange }));

    const filterField = findFirstElement(
      tree,
      (element) => element.props?.label === "Filter by action" && typeof element.props?.onChange === "function"
    );

    filterField.props.onChange({ target: { value: "project.created" } });

    expect(onAuditActionFilterChange).toHaveBeenCalledWith("project.created");
  });
});
