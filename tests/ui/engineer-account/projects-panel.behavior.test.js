const ProjectsPanel = require("../../../app/components/engineer-account/projects-panel").default;
const { findFirstElement } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    projectsLoading: false,
    formatDateLabel: jest.fn(() => "2026-03-01"),
    projects: [
      {
        id: "proj-1",
        name: "Phoenix",
        status: "active",
        clientName: "Client Inc",
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: null,
        teamMembers: [],
      },
    ],
    onOpenTasks: jest.fn(),
    ...overrides,
  };
}

describe("Given the engineer projects panel", () => {
  it("When a project tasks button is clicked, then the task-panel callback receives the project id", () => {
    const onOpenTasks = jest.fn();
    const tree = ProjectsPanel(buildProps({ onOpenTasks }));

    const tasksButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && element.props?.children === "Tasks"
    );

    tasksButton.props.onClick();

    expect(onOpenTasks).toHaveBeenCalledWith("proj-1");
  });
});
