const TasksPanel = require("../../../app/components/engineer-account/tasks-panel").default;
const { findFirstElement, treeText } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    saving: false,
    tasksLoading: false,
    taskForm: {
      projectId: "proj-1",
      name: "Write docs",
      dueOn: "",
      notes: "",
      parentTaskId: "",
    },
    projectOptions: [{ id: "proj-1", name: "Phoenix" }],
    filterProjectOptions: [{ id: "proj-1", name: "Phoenix" }],
    parentTaskOptions: [],
    filteredTasks: [
      {
        id: "task-1",
        name: "Write docs",
        projectId: "proj-1",
        project: { name: "Phoenix" },
        assignee: "eng-1",
        assigneeUser: { name: "Eng One" },
        assignedBy: "eng-1",
        assignedByUser: { name: "Eng One" },
        completed: false,
        dueOn: null,
        notes: "",
        parent: null,
      },
    ],
    editingTaskId: "",
    taskProjectFilter: "all",
    taskCompletionFilter: "all",
    taskDueFilter: "all",
    taskSearch: "",
    onTaskFieldChange: jest.fn(),
    onSubmitTask: jest.fn(),
    onEditTask: jest.fn(),
    onDeleteTask: jest.fn(),
    onToggleTaskCompleted: jest.fn(),
    onTaskProjectFilterChange: jest.fn(),
    onTaskCompletionFilterChange: jest.fn(),
    onTaskDueFilterChange: jest.fn(),
    onTaskSearchChange: jest.fn(),
    onResetTaskForm: jest.fn(),
    ...overrides,
  };
}

describe("Given the engineer tasks panel", () => {
  it("When the search value changes, then the filter callback receives the new text", () => {
    const onTaskSearchChange = jest.fn();
    const tree = TasksPanel(buildProps({ onTaskSearchChange }));

    const searchField = findFirstElement(
      tree,
      (element) => element.props?.label === "Search tasks" && typeof element.props?.onChange === "function"
    );

    searchField.props.onChange({ target: { value: "docs" } });

    expect(onTaskSearchChange).toHaveBeenCalledWith("docs");
  });

  it("When the form is submitted, then the submit callback is invoked", () => {
    const onSubmitTask = jest.fn();
    const tree = TasksPanel(buildProps({ onSubmitTask }));

    const form = findFirstElement(tree, (element) => typeof element.props?.onSubmit === "function");

    form.props.onSubmit({ preventDefault: jest.fn() });

    expect(onSubmitTask).toHaveBeenCalledTimes(1);
  });

  it("When edit is clicked for a task, then the edit callback receives the task", () => {
    const onEditTask = jest.fn();
    const task = buildProps().filteredTasks[0];
    const tree = TasksPanel(buildProps({ onEditTask, filteredTasks: [task] }));

    const editButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && element.props?.children === "Edit"
    );

    editButton.props.onClick();

    expect(onEditTask).toHaveBeenCalledWith(task);
  });

  it("When no tasks match filters, then an empty-state message is shown", () => {
    const tree = TasksPanel(buildProps({ filteredTasks: [] }));

    expect(treeText(tree)).toContain("No tasks match current filters.");
  });
});
