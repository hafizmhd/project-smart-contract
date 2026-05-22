// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

enum priority {
    LOW,
    MEDIUM,
    HIGH
}

struct Todo {
    uint256 id;
    string description;
    bool isCompleted;
    uint256 deadline;
    priority priority;
}

contract ToDoList {
    mapping(address => Todo[]) private listTodo;
    mapping(uint256 => address[]) private sharedList;
    mapping(address => uint256) private taskCounter;

    constructor() {}
}
