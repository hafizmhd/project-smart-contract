import { network } from "hardhat";

const { ethers } = await network.create({
  network: "localhost",
});

const main = async () => {
  console.log("Deploying ToDoList contract...");

  const ToDoList = await ethers.getContractFactory("ToDoList");
  const toDoList = await ToDoList.deploy();

  await toDoList.waitForDeployment();

  const address = await toDoList.getAddress();

  console.log(`ToDoList deployed to: ${address}`);
};

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}