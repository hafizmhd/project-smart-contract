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
}
