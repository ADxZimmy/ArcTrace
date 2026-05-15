// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReputationRegistry {
    enum Outcome {
        Pending,
        Correct,
        Incorrect,
        Inconclusive
    }

    struct Reputation {
        uint256 agentId;
        uint256 totalTraces;
        uint256 resolvedTraces;
        uint256 correctTraces;
        uint256 incorrectTraces;
        uint256 inconclusiveTraces;
        uint256 lastUpdated;
    }

    mapping(uint256 => Reputation) private reputations;

    event ReputationUpdated(uint256 indexed agentId, uint256 totalTraces, uint256 resolvedTraces, uint256 correctTraces, uint256 incorrectTraces, uint256 inconclusiveTraces, uint256 lastUpdated);

    function updateReputation(uint256 agentId, Outcome outcome) external {
        require(agentId != 0, "agent required");
        Reputation storage rep = reputations[agentId];
        if (rep.agentId == 0) {
            rep.agentId = agentId;
        }
        rep.totalTraces += 1;
        if (outcome != Outcome.Pending) {
            rep.resolvedTraces += 1;
        }
        if (outcome == Outcome.Correct) rep.correctTraces += 1;
        if (outcome == Outcome.Incorrect) rep.incorrectTraces += 1;
        if (outcome == Outcome.Inconclusive) rep.inconclusiveTraces += 1;
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(agentId, rep.totalTraces, rep.resolvedTraces, rep.correctTraces, rep.incorrectTraces, rep.inconclusiveTraces, block.timestamp);
    }

    function getAgentReputation(uint256 agentId) external view returns (Reputation memory) {
        return reputations[agentId];
    }
}
