// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ResolutionRegistry {
    enum Outcome {
        Pending,
        Correct,
        Incorrect,
        Inconclusive
    }

    struct Resolution {
        uint256 resolutionId;
        uint256 traceId;
        address resolver;
        Outcome outcome;
        string evidenceURI;
        bytes32 resolutionNotesHash;
        uint256 resolvedAt;
    }

    uint256 public nextResolutionId = 1;
    mapping(uint256 => Resolution) private resolutions;

    event TraceResolved(uint256 indexed resolutionId, uint256 indexed traceId, address indexed resolver, Outcome outcome, string evidenceURI, bytes32 resolutionNotesHash, uint256 resolvedAt);

    function resolveTrace(uint256 traceId, Outcome outcome, string calldata evidenceURI, bytes32 resolutionNotesHash) external returns (uint256 resolutionId) {
        require(traceId != 0, "trace required");
        require(outcome != Outcome.Pending, "pending not resolution");
        require(resolutionNotesHash != bytes32(0), "notes hash required");
        resolutionId = nextResolutionId++;
        resolutions[resolutionId] = Resolution(resolutionId, traceId, msg.sender, outcome, evidenceURI, resolutionNotesHash, block.timestamp);
        emit TraceResolved(resolutionId, traceId, msg.sender, outcome, evidenceURI, resolutionNotesHash, block.timestamp);
    }

    function getResolution(uint256 resolutionId) external view returns (Resolution memory) {
        require(resolutions[resolutionId].resolvedAt != 0, "resolution not found");
        return resolutions[resolutionId];
    }
}
