const PersonalPanel = require("../../../app/components/engineer-account/personal-panel").default;
const { PROFILE_HOLIDAY_LABEL_MAX_LENGTH } = require("../../../app/constants/text-limits");
const { findFirstElement, treeText } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    loading: false,
    saving: false,
    form: {
      firstName: "Alex",
      lastName: "Rivera",
      city: "Cebu",
      skills: ["JavaScript"],
      availabilityStatus: "available",
      availabilityNote: "",
      upcomingHolidays: [{ label: "Vacation", startDate: "2026-03-01", endDate: "2026-03-03" }],
    },
    avatarPreview: "https://res.cloudinary.com/demo/image/upload/avatar.png",
    onSubmit: jest.fn((event) => event.preventDefault()),
    onFieldChange: jest.fn(),
    onAvatarUpload: jest.fn(),
    onAvatarUploadError: jest.fn(),
    onAvatarRemove: jest.fn(),
    onSkillsChange: jest.fn(),
    onHolidayChange: jest.fn(),
    onRemoveHoliday: jest.fn(),
    onAddHoliday: jest.fn(),
    ...overrides,
  };
}

describe("Given the engineer personal information panel", () => {
  it("When upcoming holidays are unavailable, then the panel falls back to a safe empty state", () => {
    const tree = PersonalPanel(
      buildProps({
        form: {
          ...buildProps().form,
          upcomingHolidays: undefined,
        },
      })
    );

    expect(treeText(tree)).toContain("No upcoming time off scheduled.");
  });

  it("When the holiday label field is rendered, then it applies the backend text limit", () => {
    const tree = PersonalPanel(buildProps());

    const holidayLabelField = findFirstElement(
      tree,
      (element) => element.props?.label === "Label" && element.props?.slotProps?.htmlInput
    );

    expect(holidayLabelField.props.slotProps.htmlInput.maxLength).toBe(
      PROFILE_HOLIDAY_LABEL_MAX_LENGTH
    );
  });
});
