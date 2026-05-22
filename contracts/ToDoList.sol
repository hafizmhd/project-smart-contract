// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

enum priority {
    LOW,
    MEDIUM,
    HIGH
}

struct Task {
    uint256 id;
    string description;
    bool isCompleted;
    uint256 deadline;
    priority priority;
}

contract ToDoList {
    mapping(address => Task[]) private listTodo;
    mapping(uint256 => address[]) private sharedList;
    mapping(address => uint256) private taskCounter;

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
}
