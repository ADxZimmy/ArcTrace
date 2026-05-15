import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ArcTrace contracts with ${deployer.address}`);

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();

  const TraceRegistry = await ethers.getContractFactory("TraceRegistry");
  const traceRegistry = await TraceRegistry.deploy();
  await traceRegistry.waitForDeployment();

  const ResolutionRegistry = await ethers.getContractFactory("ResolutionRegistry");
  const resolutionRegistry = await ResolutionRegistry.deploy();
  await resolutionRegistry.waitForDeployment();

  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy();
  await reputationRegistry.waitForDeployment();

  console.log("AGENT_REGISTRY_ADDRESS=", await agentRegistry.getAddress());
  console.log("TRACE_REGISTRY_ADDRESS=", await traceRegistry.getAddress());
  console.log("RESOLUTION_REGISTRY_ADDRESS=", await resolutionRegistry.getAddress());
  console.log("REPUTATION_REGISTRY_ADDRESS=", await reputationRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
