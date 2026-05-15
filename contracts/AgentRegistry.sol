// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        uint256 agentId;
        address owner;
        string name;
        string metadataURI;
        bytes32 policyHash;
        uint256 createdAt;
        bool active;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) private agents;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, string metadataURI, bytes32 policyHash, uint256 createdAt);
    event AgentPolicyUpdated(uint256 indexed agentId, string metadataURI, bytes32 policyHash, uint256 updatedAt);
    event AgentDeactivated(uint256 indexed agentId, uint256 deactivatedAt);

    modifier onlyOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "not agent owner");
        _;
    }

    function registerAgent(string calldata name, string calldata metadataURI, bytes32 policyHash) external returns (uint256 agentId) {
        require(bytes(name).length > 0, "name required");
        require(policyHash != bytes32(0), "policy hash required");
        agentId = nextAgentId++;
        agents[agentId] = Agent(agentId, msg.sender, name, metadataURI, policyHash, block.timestamp, true);
        emit AgentRegistered(agentId, msg.sender, name, metadataURI, policyHash, block.timestamp);
    }

    function updateAgentPolicy(uint256 agentId, string calldata newMetadataURI, bytes32 newPolicyHash) external onlyOwner(agentId) {
        require(agents[agentId].active, "inactive agent");
        require(newPolicyHash != bytes32(0), "policy hash required");
        agents[agentId].metadataURI = newMetadataURI;
        agents[agentId].policyHash = newPolicyHash;
        emit AgentPolicyUpdated(agentId, newMetadataURI, newPolicyHash, block.timestamp);
    }

    function deactivateAgent(uint256 agentId) external onlyOwner(agentId) {
        agents[agentId].active = false;
        emit AgentDeactivated(agentId, block.timestamp);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agents[agentId].createdAt != 0, "agent not found");
        return agents[agentId];
    }
}
