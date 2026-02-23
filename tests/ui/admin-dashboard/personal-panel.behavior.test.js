const PersonalPanel = require("../../../app/components/admin-dashboard/panels/personal-panel").default;
const { findFirstElement, textFromChildren } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    session: { user: { email: "admin@example.com" } },
    loading: false,
    profileSaving: false,
    profileForm: {
      city: "Manila",
      skills: ["JavaScript"],
      availabilityStatus: "available",
      availabilityNote: "",
      upcomingHolidays: [{ label: "Vacation", startDate: "2026-03-01", endDate: "2026-03-03" }],
    },
    avatarPreview: "data:image/png;base64,avatar",
    avatarBlob: null,
    onSavePersonalInfo: jest.fn((event) => event.preventDefault()),
    onProfileFieldChange: jest.fn(),
    onImageSelection: jest.fn(),
    onAvatarRemove: jest.fn(),
    onProfileSkillsChange: jest.fn(),
    onHolidayChange: jest.fn(),
    onRemoveHoliday: jest.fn(),
    onAddHoliday: jest.fn(),
    ...overrides,
  };
}

describe("Given the personal information panel", () => {
  it("When the city value changes, then the profile field callback is called", () => {
    const onProfileFieldChange = jest.fn();
    const tree = PersonalPanel(buildProps({ onProfileFieldChange }));

    const cityField = findFirstElement(
      tree,
      (element) => element.props?.label === "City" && typeof element.props?.onChange === "function"
    );

    cityField.props.onChange({ target: { name: "city", value: "Cebu" } });

    expect(onProfileFieldChange).toHaveBeenCalled();
  });

  it("When a holiday row is removed, then the remove callback receives the holiday index", () => {
    const onRemoveHoliday = jest.fn();
    const tree = PersonalPanel(buildProps({ onRemoveHoliday }));

    const removeButton = findFirstElement(
      tree,
      (element) => element.props?.["aria-label"] === "Remove holiday" && typeof element.props?.onClick === "function"
    );

    removeButton.props.onClick();

    expect(onRemoveHoliday).toHaveBeenCalledWith(0);
  });

  it("When an avatar file is selected, then the image selection callback is called", () => {
    const onImageSelection = jest.fn();
    const tree = PersonalPanel(buildProps({ onImageSelection }));

    const avatarInput = findFirstElement(
      tree,
      (element) =>
        element.type === "input" &&
        element.props?.type === "file" &&
        typeof element.props?.onChange === "function"
    );

    const event = { target: { files: [{ name: "avatar.png" }] } };
    avatarInput.props.onChange(event);

    expect(onImageSelection).toHaveBeenCalledWith(event);
  });

  it("When remove avatar is clicked, then avatar removal is requested", () => {
    const onAvatarRemove = jest.fn();
    const tree = PersonalPanel(buildProps({ onAvatarRemove }));

    const removeAvatarButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        textFromChildren(element.props?.children) === "Remove avatar"
    );

    removeAvatarButton.props.onClick();

    expect(onAvatarRemove).toHaveBeenCalledTimes(1);
  });

  it("When no avatar exists, then remove avatar is disabled", () => {
    const tree = PersonalPanel(buildProps({ avatarPreview: "", avatarBlob: null }));

    const removeAvatarButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        textFromChildren(element.props?.children) === "Remove avatar"
    );

    expect(removeAvatarButton.props.disabled).toBe(true);
  });

  it("When add holiday is clicked, then a new holiday row is requested", () => {
    const onAddHoliday = jest.fn();
    const tree = PersonalPanel(buildProps({ onAddHoliday }));

    const addHolidayButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && textFromChildren(element.props.children) === "Add holiday"
    );

    addHolidayButton.props.onClick();

    expect(onAddHoliday).toHaveBeenCalledTimes(1);
  });

  it("When the profile form is submitted, then save personal information is requested", () => {
    const onSavePersonalInfo = jest.fn((event) => event.preventDefault());
    const tree = PersonalPanel(buildProps({ onSavePersonalInfo }));

    const formElement = findFirstElement(
      tree,
      (element) => element.props?.component === "form" && typeof element.props?.onSubmit === "function"
    );

    const event = { preventDefault: jest.fn() };
    formElement.props.onSubmit(event);

    expect(onSavePersonalInfo).toHaveBeenCalledWith(event);
  });

  it("When profile saving is in progress, then save actions are disabled", () => {
    const tree = PersonalPanel(buildProps({ profileSaving: true }));

    const addHolidayButton = findFirstElement(
      tree,
      (element) =>
        typeof element.props?.onClick === "function" &&
        textFromChildren(element.props?.children) === "Add holiday"
    );

    expect(addHolidayButton.props.disabled).toBe(true);
  });
});
