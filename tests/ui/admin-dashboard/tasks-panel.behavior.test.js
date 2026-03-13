const TaskForm = require("../../../app/components/admin/task-form").default;
const TaskList = require("../../../app/components/admin/task-list").default;
const TasksPanel = require("../../../app/components/admin-dashboard/panels/tasks-panel").default;
const { findAllElements, findFirstElement, textFromChildren } = require("../../helpers/react-tree");

function buildProps(overrides = {}) {
  return {
    loading: false,
    saving: false,
    showCreateTaskForm: false,
    taskForm: {
      projectId: "proj-1",
      name: "",
      assigneeId: "eng-1",
      dueOn: "",
      notes: "",
      parentTaskId: "",
      completed: false,
    },
    projectOptions: [{ id: "proj-1", name: "Phoenix" }],
    assigneeOptions: [{ id: "eng-1", name: "Eng One" }],
    filterAssigneeOptions: [{ id: "eng-1", name: "Eng One" }],
    parentTaskOptions: [],
    filteredTasks: [
      {
        id: "task-1",
        name: "Ship dashboard",
        projectId: "proj-1",
        assignee: "eng-1",
        assigneeUser: { name: "Eng One" },
        completed: false,
        dueOn: null,
        notes: "",
        parent: null,
        project: { name: "Phoenix" },
      },
    ],
    editingTaskId: "",
    taskProjectFilter: "all",
    taskAssigneeFilter: "all",
    taskCompletionFilter: "all",
    taskDueFilter: "all",
    taskSearch: "",
    onOpenCreateTaskForm: jest.fn(),
    onCloseCreateTaskForm: jest.fn(),
    onTaskFieldChange: jest.fn(),
    onSubmitTask: jest.fn(),
    onEditTask: jest.fn(),
    onDeleteTask: jest.fn(),
    onToggleTaskCompleted: jest.fn(),
    onTaskProjectFilterChange: jest.fn(),
    onTaskAssigneeFilterChange: jest.fn(),
    onTaskCompletionFilterChange: jest.fn(),
    onTaskDueFilterChange: jest.fn(),
    onTaskSearchChange: jest.fn(),
    onResetTaskForm: jest.fn(),
    ...overrides,
  };
}

describe("Given the tasks panel in the admin dashboard", () => {
  it("When create task is clicked, then opening the create form is requested", () => {
    const onOpenCreateTaskForm = jest.fn();
    const tree = TasksPanel(buildProps({ onOpenCreateTaskForm }));

    const createButton = findFirstElement(
      tree,
      (element) => typeof element.props?.onClick === "function" && textFromChildren(element.props.children) === "Create task"
    );

    createButton.props.onClick();

    expect(onOpenCreateTaskForm).toHaveBeenCalledTimes(1);
  });

  it("When the assignee filter changes, then the callback receives the selected assignee", () => {
    const onTaskAssigneeFilterChange = jest.fn();
    const tree = TasksPanel(buildProps({ onTaskAssigneeFilterChange }));

    const assigneeField = findFirstElement(
      tree,
      (element) => element.props?.label === "Assignee" && typeof element.props?.onChange === "function"
    );

    assigneeField.props.onChange({ target: { value: "eng-1" } });

    expect(onTaskAssigneeFilterChange).toHaveBeenCalledWith("eng-1");
  });

  it("When the create form is visible, then the task form is rendered and cancel closes it", () => {
    const onCloseCreateTaskForm = jest.fn();
    const tree = TasksPanel(buildProps({ showCreateTaskForm: true, onCloseCreateTaskForm }));

    const taskForm = findFirstElement(tree, (element) => element.type === TaskForm);

    expect(taskForm).toBeTruthy();

    taskForm.props.onCancelEdit();

    expect(onCloseCreateTaskForm).toHaveBeenCalledTimes(1);
  });

  it("When rendered, then the task list is present", () => {
    const tree = TasksPanel(buildProps());
    const taskLists = findAllElements(tree, (element) => element.type === TaskList);

    expect(taskLists).toHaveLength(1);
  });
});
