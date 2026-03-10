const EngineerCard = require("../../../app/components/admin/engineer-card").default;
const { findFirstElement } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    engineer: {
      id: "eng-1",
      email: "eng1@example.com",
      firstName: "Eng",
      lastName: "One",
      city: "Cebu",
      availabilityStatus: "available",
      skills: ["JavaScript"],
      upcomingHolidays: [],
      monthlySalaryPhp: null,
      salaryNotes: null,
      cityDraft: "Cebu",
      monthlySalaryPhpDraft: "",
      salaryNotesDraft: "",
    },
    projects: [],
    isEditingComp: false,
    isHolidayExpanded: false,
    isProjectsExpanded: false,
    isSalarySaving: false,
    availabilityColor: "success",
    availabilityLabel: "Available",
    onToggleHoliday: jest.fn(),
    onToggleProjects: jest.fn(),
    onProjectClick: jest.fn(),
    onViewTasks: jest.fn(),
    onBeginEditComp: jest.fn(),
    onUpdateEngineerDraft: jest.fn(),
    onSaveEngineerComp: jest.fn(),
    onCancelEditComp: jest.fn(),
    ...overrides,
  };
}

describe("Given an engineer card in the admin dashboard", () => {
  it("When city is present, then the card shows engineer location", () => {
    const tree = EngineerCard(buildProps());
    const locationChip = findFirstElement(
      tree,
      (element) => typeof element.props?.label === "string" && element.props.label.startsWith("Location:")
    );

    expect(locationChip.props.label).toBe("Location: Cebu");
  });

  it("When city is missing, then the card shows location fallback", () => {
    const tree = EngineerCard(
      buildProps({
        engineer: {
          ...buildProps().engineer,
          city: "",
        },
      })
    );
    const locationChip = findFirstElement(
      tree,
      (element) => typeof element.props?.label === "string" && element.props.label.startsWith("Location:")
    );

    expect(locationChip.props.label).toBe("Location: Not set");
  });

  it("When location is edited in admin mode, then the draft callback receives the new value", () => {
    const onUpdateEngineerDraft = jest.fn();
    const tree = EngineerCard(
      buildProps({
        isEditingComp: true,
        onUpdateEngineerDraft,
      })
    );

    const locationField = findFirstElement(
      tree,
      (element) => element.props?.label === "Location" && typeof element.props?.onChange === "function"
    );

    locationField.props.onChange({ target: { value: "Davao" } });

    expect(onUpdateEngineerDraft).toHaveBeenCalledWith("eng-1", "cityDraft", "Davao");
  });

  it("When tasks is clicked, then the view-tasks callback receives the engineer id", () => {
    const onViewTasks = jest.fn();
    const tree = EngineerCard(buildProps({ onViewTasks }));

    const tasksButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && element.props?.children === "Tasks"
    );

    tasksButton.props.onClick();

    expect(onViewTasks).toHaveBeenCalledWith("eng-1");
  });

  it("When projects are unavailable, then the card still renders a safe collapsed project state", () => {
    const tree = EngineerCard(buildProps({ projects: null }));

    const projectsButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        String(element.props?.children).includes("Current projects:")
    );

    expect(projectsButton.props.children).toContain(0);
  });

  it("When collapsible sections render, then they expose their expanded state to assistive technology", () => {
    const tree = EngineerCard(
      buildProps({
        isHolidayExpanded: true,
        isProjectsExpanded: false,
      })
    );

    const holidayButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        String(element.props?.children).includes("Upcoming holidays:")
    );
    const projectsButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        String(element.props?.children).includes("Current projects:")
    );

    expect(holidayButton.props["aria-expanded"]).toBe(true);
    expect(typeof holidayButton.props["aria-controls"]).toBe("string");
    expect(projectsButton.props["aria-expanded"]).toBe(false);
    expect(typeof projectsButton.props["aria-controls"]).toBe("string");
  });
});
