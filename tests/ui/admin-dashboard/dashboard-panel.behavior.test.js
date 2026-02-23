const DashboardPanel = require("../../../app/components/admin-dashboard/panels/dashboard-panel").default;
const { treeText } = require("../../helpers/react-tree");

describe("Given the dashboard summary panel", () => {
  it("When the panel is rendered, then the dashboard overview guidance is visible", () => {
    const tree = DashboardPanel();
    const text = treeText(tree);

    expect(text).toContain("Dashboard");
    expect(text).toContain("Use the sidebar to switch between profile and project management.");
  });
});
