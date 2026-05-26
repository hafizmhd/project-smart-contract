// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

enum priority {
    LOW,
    MEDIUM,
    HIGH
}

struct Task {
    uint256 id;
    string title;
    bool isCompleted;
    uint256 deadline;
    priority priority;
}

contract ToDoList {
    mapping(address => Task[]) private listTodo;
    mapping(uint256 => address[]) private sharedList;
    uint256 private globalTaskCounter;

    // Event
    event TaskAdded(address indexed user, uint256 taskId);
    event TaskCompleted(address indexed user, uint256 taskId);
    event TaskDeleted(address indexed user, uint256 taskId);

    // Modifiers
    modifier validTaskIndex(uint256 _index) {
        require(_index < listTodo[msg.sender].length, "Task does not exists");
        _;
    }

    constructor() {}

    function addTask(
        string calldata _title,
        uint256 _deadline,
        priority _priority
    ) external {
        require(
            _deadline == 0 || _deadline > block.timestamp,
            "Deadline must be in the future"
        );

        Task memory newTask;
        newTask.id = globalTaskCounter;
        newTask.title = _title;
        newTask.deadline = _deadline;
        newTask.priority = _priority;
        newTask.isCompleted = false;

        listTodo[msg.sender].push(newTask);
        globalTaskCounter++;

        emit TaskAdded(msg.sender, newTask.id);
    }

    function markCompleted(uint256 _index) external validTaskIndex(_index) {
        listTodo[msg.sender][_index].isCompleted = true;

        emit TaskCompleted(msg.sender, listTodo[msg.sender][_index].id);
    }

    function deleteTask(uint256 _index) external validTaskIndex(_index) {
        uint256 taskId = listTodo[msg.sender][_index].id;

        uint256 lastIndex = listTodo[msg.sender].length - 1;
        if (_index != lastIndex) {
            listTodo[msg.sender][_index] = listTodo[msg.sender][lastIndex];
        }
        listTodo[msg.sender].pop();

        emit TaskDeleted(msg.sender, taskId);
    }

    function updatePriority(
        uint256 _index,
        priority newPriority
    ) external validTaskIndex(_index) {
        listTodo[msg.sender][_index].priority = newPriority;
    }

    // Views

    function getTasks() external view returns (Task[] memory) {
        return listTodo[msg.sender];
    }

    function getOverdueTasks() external view returns (Task[] memory) {
        Task[] memory allTasks = listTodo[msg.sender];
        uint256 count = 0;

        // First pass: count overdue tasks
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (
                !allTasks[i].isCompleted &&
                allTasks[i].deadline != 0 &&
                allTasks[i].deadline < block.timestamp
            ) {
                count++;
            }
        }

        // Second pass: populate result array
        Task[] memory overdueTasks = new Task[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (
                !allTasks[i].isCompleted &&
                allTasks[i].deadline != 0 &&
                allTasks[i].deadline < block.timestamp
            ) {
                overdueTasks[index] = allTasks[i];
                index++;
            }
        }

        return overdueTasks;
    }

    function getTasksByPriority(
        priority _priority
    ) external view returns (Task[] memory) {
        Task[] memory allTasks = listTodo[msg.sender];
        uint256 count = 0;

        for (uint256 i = 0; i < allTasks.length; i++) {
            if (allTasks[i].priority == _priority) {
                count++;
            }
        }

        Task[] memory filteredTasks = new Task[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allTasks.length; i++) {
            if (allTasks[i].priority == _priority) {
                filteredTasks[index] = allTasks[i];
                index++;
            }
        }

        return filteredTasks;
    }
}
