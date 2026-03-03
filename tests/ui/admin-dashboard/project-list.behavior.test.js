const ProjectList = require("../../../app/components/admin/project-list").default;
const { findFirstElement } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    projects: [
      {
        id: "proj-1",
        name: "Phoenix",
        clientName: "Client Inc",
        costPhp: 1000,
        currencyCode: "PHP",
        status: "ongoing",
        startDate: "2026-03-01T00:00:00.000Z",
        endDate: null,
        adminNotes: "",
        teamMembers: [],
      },
    ],
    saving: false,
    onEdit: jest.fn(),
    onArchive: jest.fn(),
    onDelete: jest.fn(),
    onViewTasks: jest.fn(),
    ...overrides,
  };
}

describe("Given the admin project list", () => {
  it("When a project task link is clicked, then the view-tasks callback receives that project", () => {
    const onViewTasks = jest.fn();
    const project = buildProps().projects[0];
    const tree = ProjectList(buildProps({ onViewTasks, projects: [project] }));

    const tasksButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && element.props?.children === "Tasks"
    );

    tasksButton.props.onClick();

    expect(onViewTasks).toHaveBeenCalledWith(project);
  });
});
