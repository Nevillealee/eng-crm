const EngineerCard = require("../../../app/components/admin/engineer-card").default;
const EngineersPanel = require("../../../app/components/admin-dashboard/panels/engineers-panel").default;
const { findAllElements, findFirstElement, textFromChildren, treeText } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    loading: false,
    salarySavingEngineerId: "",
    engineerSearch: "",
    engineerCityFilter: "all",
    engineerAvailabilityFilter: "all",
    cityFilterOptions: ["Manila"],
    filteredEngineers: [],
    projects: [],
    editingEngineerCompId: "",
    expandedHolidayEngineerId: "",
    expandedProjectsEngineerId: "",
    onExportCsv: jest.fn(),
    onEngineerSearchChange: jest.fn(),
    onEngineerCityFilterChange: jest.fn(),
    onEngineerAvailabilityFilterChange: jest.fn(),
    onToggleHoliday: jest.fn(),
    onToggleProjects: jest.fn(),
    onProjectClick: jest.fn(),
    onBeginEditComp: jest.fn(),
    onUpdateEngineerDraft: jest.fn(),
    onSaveEngineerComp: jest.fn(),
    onCancelEditComp: jest.fn(),
    ...overrides,
  };
}

describe("Given the engineers panel", () => {
  it("When no engineers match filters, then an empty-state message is shown", () => {
    const tree = EngineersPanel(buildProps());

    expect(treeText(tree)).toContain("No engineers match current filters.");
  });

  it("When export is clicked, then the engineers CSV endpoint is requested", () => {
    const onExportCsv = jest.fn();
    const tree = EngineersPanel(
      buildProps({
        filteredEngineers: [{ id: "eng-1", email: "eng1@example.com" }],
        onExportCsv,
      })
    );

    const exportButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && textFromChildren(element.props.children) === "Export CSV"
    );

    exportButton.props.onClick();

    expect(onExportCsv).toHaveBeenCalledWith("/api/admin/export/engineers");
  });

  it("When the search value changes, then the filter callback receives the new text", () => {
    const onEngineerSearchChange = jest.fn();
    const tree = EngineersPanel(buildProps({ onEngineerSearchChange }));

    const searchField = findFirstElement(
      tree,
      (element) => element.props?.label === "Search engineers" && typeof element.props?.onChange === "function"
    );

    searchField.props.onChange({ target: { value: "manila" } });

    expect(onEngineerSearchChange).toHaveBeenCalledWith("manila");
  });

  it("When engineers are present, then each engineer is represented by an engineer card", () => {
    const tree = EngineersPanel(
      buildProps({
        filteredEngineers: [
          { id: "eng-1", email: "eng1@example.com", availabilityStatus: "available" },
          { id: "eng-2", email: "eng2@example.com", availabilityStatus: "available" },
        ],
      })
    );

    const cards = findAllElements(tree, (element) => element.type === EngineerCard);

    expect(cards).toHaveLength(2);
  });
});
