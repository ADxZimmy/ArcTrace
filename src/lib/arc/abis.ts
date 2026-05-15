export const agentRegistryAbi = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "policyHash", type: "bytes32" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAgent",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "agentId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "policyHash", type: "bytes32" },
          { name: "createdAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "name", type: "string" },
      { indexed: false, name: "metadataURI", type: "string" },
      { indexed: false, name: "policyHash", type: "bytes32" },
      { indexed: false, name: "createdAt", type: "uint256" },
    ],
  },
] as const;

export const traceRegistryAbi = [
  {
    type: "function",
    name: "createTrace",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "questionHash", type: "bytes32" },
      { name: "traceHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "stance", type: "string" },
      { name: "confidence", type: "uint8" },
      { name: "riskScore", type: "uint8" },
      { name: "category", type: "string" },
      { name: "expiryTimestamp", type: "uint256" },
    ],
    outputs: [{ name: "traceId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTraceByHash",
    stateMutability: "view",
    inputs: [{ name: "traceHash", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "traceId", type: "uint256" },
          { name: "agentId", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "questionHash", type: "bytes32" },
          { name: "traceHash", type: "bytes32" },
          { name: "metadataURI", type: "string" },
          { name: "stance", type: "string" },
          { name: "confidence", type: "uint8" },
          { name: "riskScore", type: "uint8" },
          { name: "category", type: "string" },
          { name: "expiryTimestamp", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "resolutionId", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "TraceCommitted",
    inputs: [
      { indexed: true, name: "traceId", type: "uint256" },
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "questionHash", type: "bytes32" },
      { indexed: false, name: "traceHash", type: "bytes32" },
      { indexed: false, name: "metadataURI", type: "string" },
      { indexed: false, name: "stance", type: "string" },
      { indexed: false, name: "confidence", type: "uint8" },
      { indexed: false, name: "riskScore", type: "uint8" },
      { indexed: false, name: "category", type: "string" },
      { indexed: false, name: "expiryTimestamp", type: "uint256" },
      { indexed: false, name: "createdAt", type: "uint256" },
    ],
  },
] as const;

export const resolutionRegistryAbi = [
  {
    type: "function",
    name: "resolveTrace",
    stateMutability: "nonpayable",
    inputs: [
      { name: "traceId", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "evidenceURI", type: "string" },
      { name: "resolutionNotesHash", type: "bytes32" },
    ],
    outputs: [{ name: "resolutionId", type: "uint256" }],
  },
] as const;
