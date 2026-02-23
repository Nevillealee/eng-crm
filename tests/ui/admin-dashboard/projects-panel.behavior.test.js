const ProjectForm = require("../../../app/components/admin/project-form").default;
const ProjectList = require("../../../app/components/admin/project-list").default;
const ProjectsPanel = require("../../../app/components/admin-dashboard/panels/projects-panel").default;
const { findAllElements, findFirstElement, textFromChildren } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    loading: false,
    saving: false,
    showCreateProjectForm: false,
    projectForm: {
      name: "",
      clientName: "",
      costPhp: "0",
      currencyCode: "PHP",
      status: "ongoing",
      startDate: "",
      endDate: "",
      adminNotes: "",
      teamMemberIds: [],
    },
    assignableEngineers: [],
    selectedTeam: [],
    sortedActiveProjects: [{ id: "proj-1", name: "Phoenix" }],
    sortedArchivedProjects: [{ id: "proj-2", name: "Atlas" }],
    editingProjectId: "",
    projectSortBy: "date",
    projectSortDirection: "desc",
    onExportCsv: jest.fn(),
    onOpenCreateProjectForm: jest.fn(),
    onCloseCreateProjectForm: jest.fn(),
    onProjectFieldChange: jest.fn(),
    onProjectTeamChange: jest.fn(),
    onSubmitProject: jest.fn(),
    onSortByChange: jest.fn(),
    onSortDirectionChange: jest.fn(),
    onEditProject: jest.fn(),
    onArchiveProject: jest.fn(),
    onDeleteProject: jest.fn(),
    onResetProjectForm: jest.fn(),
    ...overrides,
  };
}

describe("Given the projects panel", () => {
  it("When export is clicked, then the projects CSV endpoint is requested", () => {
    const onExportCsv = jest.fn();
    const tree = ProjectsPanel(buildProps({ onExportCsv }));

    const exportButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && textFromChildren(element.props.children) === "Export CSV"
    );

    exportButton.props.onClick();

    expect(onExportCsv).toHaveBeenCalledWith("/api/admin/export/projects");
  });

  it("When create project is clicked, then opening the create form is requested", () => {
    const onOpenCreateProjectForm = jest.fn();
    const tree = ProjectsPanel(buildProps({ onOpenCreateProjectForm }));

    const createButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && textFromChildren(element.props.children) === "Create project"
    );

    createButton.props.onClick();

    expect(onOpenCreateProjectForm).toHaveBeenCalledTimes(1);
  });

  it("When create form is visible and cancel is clicked, then closing the create form is requested", () => {
    const onCloseCreateProjectForm = jest.fn();
    const tree = ProjectsPanel(
      buildProps({
        showCreateProjectForm: true,
        onCloseCreateProjectForm,
      })
    );

    const projectForm = findFirstElement(tree, (element) => element.type === ProjectForm);

    expect(projectForm).toBeTruthy();

    projectForm.props.onCancelEdit();

    expect(onCloseCreateProjectForm).toHaveBeenCalledTimes(1);
  });

  it("When sort options change, then sort callbacks receive selected values", () => {
    const onSortByChange = jest.fn();
    const onSortDirectionChange = jest.fn();
    const tree = ProjectsPanel(buildProps({ onSortByChange, onSortDirectionChange }));

    const sortByField = findFirstElement(
      tree,
      (element) => element.props?.label === "Sort by" && typeof element.props?.onChange === "function"
    );
    const directionField = findFirstElement(
      tree,
      (element) => element.props?.label === "Direction" && typeof element.props?.onChange === "function"
    );

    sortByField.props.onChange({ target: { value: "cost" } });
    directionField.props.onChange({ target: { value: "asc" } });

    expect(onSortByChange).toHaveBeenCalledWith("cost");
    expect(onSortDirectionChange).toHaveBeenCalledWith("asc");
  });

  it("When rendered, then active and archived project lists are both present", () => {
    const tree = ProjectsPanel(buildProps());

    const projectLists = findAllElements(tree, (element) => element.type === ProjectList);

    expect(projectLists).toHaveLength(2);
    expect(projectLists[0].props.title).toBe("Active projects");
    expect(projectLists[1].props.title).toBe("Archived projects");
  });
});
