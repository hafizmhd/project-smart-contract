import { network, tasks } from "hardhat";
import { expect } from "chai";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { ToDoList } from "../types/ethers-contracts/ToDoList.js";

const { ethers } = await network.create();

describe("ToDoList", () => {
  let toDoList: ToDoList;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  // Priority enum values matching the contract
  const Priority = { LOW: 0, MEDIUM: 1, HIGH: 2 };

  // Helper: deadline 1 day from now (unix timestamp)
  const futureDeadline = () => Math.floor(Date.now() / 1000) + 86400;

  beforeEach(async () => {
    [user1, user2] = await ethers.getSigners();

    const ToDoList = await ethers.getContractFactory("ToDoList");
    toDoList = await ToDoList.deploy();
  });

  // =============================================
  // DEPLOYMENT
  // =============================================

  describe("Deployment", () => {
    it("should deploy successfully", async () => {
      const address = await toDoList.getAddress();
      expect(address).to.be.properAddress;
    });

    it("should have 0 tasks for a new user", async () => {
      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });
  });

  // =============================================
  // POSITIVE SCENARIOS
  // =============================================

  describe("addTask - Positive", () => {
    it("should add a task and return it via getTasks", async () => {
      const deadline = futureDeadline();
      await toDoList.connect(user1).addTask("Buy groceries", deadline, Priority.LOW);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].title).to.equal("Buy groceries");
      expect(tasks[0].isCompleted).to.equal(false);
      expect(tasks[0].deadline).to.equal(deadline);
      expect(tasks[0].priority).to.equal(Priority.LOW);
    });

    it("should emit TaskAdded event with correct args", async () => {
      await expect(toDoList.connect(user1).addTask("Study", futureDeadline(), Priority.HIGH))
        .to.emit(toDoList, "TaskAdded")
        .withArgs(user1.address, 0); // first task gets id 0
    });

    it("should assign incrementing IDs to tasks", async () => {
      await toDoList.connect(user1).addTask("Task 1", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).addTask("Task 2", futureDeadline(), Priority.MEDIUM);
      await toDoList.connect(user1).addTask("Task 3", futureDeadline(), Priority.HIGH);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].id).to.equal(0);
      expect(tasks[1].id).to.equal(1);
      expect(tasks[2].id).to.equal(2);
    });

    it("should add multiple tasks correctly", async () => {
      await toDoList.connect(user1).addTask("Task A", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).addTask("Task B", futureDeadline(), Priority.HIGH);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(2);
      expect(tasks[0].title).to.equal("Task A");
      expect(tasks[1].title).to.equal("Task B");
    });

    it("should allow adding a task with deadline = 0", async () => {
      await toDoList.connect(user1).addTask("Only Task", 0, Priority.LOW);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].deadline).to.equal(0);
    });

    it("should allow adding a task with a future deadline", async () => {
      const deadline = futureDeadline();
      await toDoList.connect(user1).addTask("Only Task", deadline, Priority.LOW);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].deadline).to.equal(deadline);
    });
  });

  describe("markCompleted - Positive", () => {
    it("should mark a task as completed", async () => {
      await toDoList.connect(user1).addTask("Finish homework", futureDeadline(), Priority.MEDIUM);
      await toDoList.connect(user1).markCompleted(0);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].isCompleted).to.equal(true);
    });

    it("should emit TaskCompleted event with correct task ID", async () => {
      await toDoList.connect(user1).addTask("Test event", futureDeadline(), Priority.LOW);

      await expect(toDoList.connect(user1).markCompleted(0))
        .to.emit(toDoList, "TaskCompleted")
        .withArgs(user1.address, 0); // task id 0
    });

    it("should only mark the specified task, leaving others unchanged", async () => {
      await toDoList.connect(user1).addTask("Task 1", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).addTask("Task 2", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).markCompleted(0);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks[0].isCompleted).to.equal(true);
      expect(tasks[1].isCompleted).to.equal(false);
    });
  });

  describe("deleteTask - Positive", () => {
    it("should delete a task and reduce array length", async () => {
      await toDoList.connect(user1).addTask("To delete", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).deleteTask(0);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });

    it("should emit TaskDeleted event with correct task ID", async () => {
      await toDoList.connect(user1).addTask("Delete me", futureDeadline(), Priority.LOW);

      await expect(toDoList.connect(user1).deleteTask(0))
        .to.emit(toDoList, "TaskDeleted")
        .withArgs(user1.address, 0);
    });

    it("should swap-and-pop correctly when deleting non-last element", async () => {
      await toDoList.connect(user1).addTask("Task A", futureDeadline(), Priority.LOW);    // id 0, index 0
      await toDoList.connect(user1).addTask("Task B", futureDeadline(), Priority.MEDIUM); // id 1, index 1
      await toDoList.connect(user1).addTask("Task C", futureDeadline(), Priority.HIGH);   // id 2, index 2

      // Delete index 0 (Task A) → Task C should move to index 0
      await toDoList.connect(user1).deleteTask(0);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(2);
      expect(tasks[0].title).to.equal("Task C"); // swapped from last position
      expect(tasks[0].id).to.equal(2);
      expect(tasks[1].title).to.equal("Task B"); // unchanged
    });

    it("should handle deleting the last element without swap", async () => {
      await toDoList.connect(user1).addTask("Task A", futureDeadline(), Priority.LOW);
      await toDoList.connect(user1).addTask("Task B", futureDeadline(), Priority.MEDIUM);

      // Delete last element (index 1)
      await toDoList.connect(user1).deleteTask(1);

      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(1);
      expect(tasks[0].title).to.equal("Task A"); // remains in place
    });
  });

  describe("getTasks - Positive", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await toDoList.connect(user1).getTasks();
      expect(tasks.length).to.equal(0);
    });
  });

  describe("getOverdueTasks", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await toDoList.connect(user1).getOverdueTasks();

      expect(tasks.length).to.equal(0);
    });

    it("should return empty array when no tasks are overdue", async () => {
      await toDoList.connect(user1).addTask("Only Task", futureDeadline(), Priority.LOW);

      const tasks = await toDoList.connect(user1).getOverdueTasks();
      expect(tasks.length).to.equal(0);
    });

    it("should return overdue tasks correctly", async () => {
      const block = await ethers.provider.getBlock("latest");
      const shortDeadline = block!.timestamp + 10;
      await toDoList.connect(user1).addTask("Overdue Task", shortDeadline, Priority.LOW);

      // Fast-forward 20 seconds past the 10-second deadline
      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine", []);

      const overdueTasks = await toDoList.connect(user1).getOverdueTasks();
      expect(overdueTasks.length).to.equal(1);
      expect(overdueTasks[0].title).to.equal("Overdue Task");
    });

    it("should NOT return completed tasks even if overdue", async () => {
      const block = await ethers.provider.getBlock("latest");
      const shortDeadline = block!.timestamp + 10;
      await toDoList.connect(user1).addTask("Completed Overdue", shortDeadline, Priority.MEDIUM);

      await toDoList.connect(user1).markCompleted(0);

      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine", []);

      const overdueTasks = await toDoList.connect(user1).getOverdueTasks();
      expect(overdueTasks.length).to.equal(0);
    });

    it("should NOT return tasks with deadline = 0 (no deadline)", async () => {
      await toDoList.connect(user1).addTask("No Deadline Task", 0, Priority.HIGH);

      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine", []);

      const overdueTasks = await toDoList.connect(user1).getOverdueTasks();
      expect(overdueTasks.length).to.equal(0);
    });

    it("should return only overdue tasks from a mixed list", async () => {
      const block = await ethers.provider.getBlock("latest");
      const shortDeadline = block!.timestamp + 10;
      const farDeadline = block!.timestamp + 86400;

      await toDoList.connect(user1).addTask("Overdue 1", shortDeadline, Priority.LOW);
      await toDoList.connect(user1).addTask("Overdue 2", shortDeadline, Priority.MEDIUM);
      await toDoList.connect(user1).addTask("Still Valid", farDeadline, Priority.HIGH);
      await toDoList.connect(user1).addTask("No Deadline", 0, Priority.LOW);

      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine", []);

      const overdueTasks = await toDoList.connect(user1).getOverdueTasks();
      expect(overdueTasks.length).to.equal(2);
      expect(overdueTasks[0].title).to.equal("Overdue 1");
      expect(overdueTasks[1].title).to.equal("Overdue 2");
    });
  });

  // =============================================
  // NEGATIVE SCENARIOS
  // =============================================

  describe("addTask - Negative", () => {
    it("should revert when adding a task with a past deadline", async () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 86400;

      await expect(toDoList.connect(user1).addTask("Reverted Task", pastDeadline, Priority.LOW)).to.be.revertedWith("Deadline must be in the future");
    });
  });

  describe("markCompleted - Negative", () => {
    it("should revert when marking a task with invalid index", async () => {
      await expect(toDoList.connect(user1).markCompleted(0))
        .to.be.revertedWith("Task does not exists");
    });

    it("should revert when index is out of bounds", async () => {
      await toDoList.connect(user1).addTask("Only task", futureDeadline(), Priority.LOW);

      await expect(toDoList.connect(user1).markCompleted(5))
        .to.be.revertedWith("Task does not exists");
    });
  });

  describe("deleteTask - Negative", () => {
    it("should revert when deleting a task with invalid index", async () => {
      await expect(toDoList.connect(user1).deleteTask(0))
        .to.be.revertedWith("Task does not exists");
    });

    it("should revert when index is out of bounds", async () => {
      await toDoList.connect(user1).addTask("Only task", futureDeadline(), Priority.LOW);

      await expect(toDoList.connect(user1).deleteTask(99))
        .to.be.revertedWith("Task does not exists");
    });
  });

  // =============================================
  // PER-USER ISOLATION
  // =============================================

  describe("Per-user isolation", () => {
    it("should keep tasks separate between users", async () => {
      await toDoList.connect(user1).addTask("User1 task", futureDeadline(), Priority.LOW);
      await toDoList.connect(user2).addTask("User2 task", futureDeadline(), Priority.HIGH);

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks.length).to.equal(1);
      expect(user1Tasks[0].title).to.equal("User1 task");

      expect(user2Tasks.length).to.equal(1);
      expect(user2Tasks[0].title).to.equal("User2 task");
    });

    it("should not affect other user's tasks when deleting", async () => {
      await toDoList.connect(user1).addTask("User1 task", futureDeadline(), Priority.LOW);
      await toDoList.connect(user2).addTask("User2 task", futureDeadline(), Priority.HIGH);

      await toDoList.connect(user1).deleteTask(0);

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks.length).to.equal(0);
      expect(user2Tasks.length).to.equal(1); // unaffected
    });

    it("should assign globally unique IDs across users", async () => {
      await toDoList.connect(user1).addTask("User1 task", futureDeadline(), Priority.LOW);  // id 0
      await toDoList.connect(user2).addTask("User2 task", futureDeadline(), Priority.HIGH); // id 1

      const user1Tasks = await toDoList.connect(user1).getTasks();
      const user2Tasks = await toDoList.connect(user2).getTasks();

      expect(user1Tasks[0].id).to.equal(0);
      expect(user2Tasks[0].id).to.equal(1); // globally unique, not 0
    });
  });
});