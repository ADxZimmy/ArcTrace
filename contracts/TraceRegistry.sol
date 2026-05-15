// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TraceRegistry {
    struct Trace {
        uint256 traceId;
        uint256 agentId;
        address creator;
        bytes32 questionHash;
        bytes32 traceHash;
        string metadataURI;
        string stance;
        uint8 confidence;
        uint8 riskScore;
        string category;
        uint256 expiryTimestamp;
        uint256 createdAt;
        bool resolved;
        uint256 resolutionId;
    }

    uint256 public nextTraceId = 1;
    mapping(uint256 => Trace) private traces;
    mapping(bytes32 => uint256) public traceIdByHash;

    event TraceCommitted(
        uint256 indexed traceId,
        uint256 indexed agentId,
        address indexed creator,
        bytes32 questionHash,
        bytes32 traceHash,
        string metadataURI,
        string stance,
        uint8 confidence,
        uint8 riskScore,
        string category,
        uint256 expiryTimestamp,
        uint256 createdAt
    );

    event TraceMarkedResolved(uint256 indexed traceId, uint256 indexed resolutionId);

    function createTrace(
        uint256 agentId,
        bytes32 questionHash,
        bytes32 traceHash,
        string calldata metadataURI,
        string calldata stance,
        uint8 confidence,
        uint8 riskScore,
        string calldata category,
        uint256 expiryTimestamp
    ) external returns (uint256 traceId) {
        require(agentId != 0, "agent required");
        require(questionHash != bytes32(0), "question hash required");
        require(traceHash != bytes32(0), "trace hash required");
        require(traceIdByHash[traceHash] == 0, "trace already committed");
        require(confidence <= 100, "confidence > 100");
        require(riskScore <= 100, "risk > 100");
        require(expiryTimestamp > block.timestamp, "expiry in past");

        traceId = nextTraceId++;
        traces[traceId] = Trace(
            traceId,
            agentId,
            msg.sender,
            questionHash,
            traceHash,
            metadataURI,
            stance,
            confidence,
            riskScore,
            category,
            expiryTimestamp,
            block.timestamp,
            false,
            0
        );
        traceIdByHash[traceHash] = traceId;
        emit TraceCommitted(traceId, agentId, msg.sender, questionHash, traceHash, metadataURI, stance, confidence, riskScore, category, expiryTimestamp, block.timestamp);
    }

    function markResolved(uint256 traceId, uint256 resolutionId) external {
        require(traces[traceId].createdAt != 0, "trace not found");
        require(!traces[traceId].resolved, "already resolved");
        traces[traceId].resolved = true;
        traces[traceId].resolutionId = resolutionId;
        emit TraceMarkedResolved(traceId, resolutionId);
    }

    function getTrace(uint256 traceId) external view returns (Trace memory) {
        require(traces[traceId].createdAt != 0, "trace not found");
        return traces[traceId];
    }

    function getTraceByHash(bytes32 traceHash) external view returns (Trace memory) {
        uint256 traceId = traceIdByHash[traceHash];
        require(traceId != 0, "trace not found");
        return traces[traceId];
    }
}
