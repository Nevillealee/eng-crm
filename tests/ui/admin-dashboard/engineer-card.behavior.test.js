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
});
