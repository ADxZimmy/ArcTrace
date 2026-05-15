import { createPublicClient, createWalletClient, defineChain, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_CHAIN_ID, ARC_RPC_URL, requireEnv } from "@/lib/config";
import { agentRegistryAbi, resolutionRegistryAbi, traceRegistryAbi } from "./abis";

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [ARC_RPC_URL || "http://127.0.0.1:8545"] } },
});

export function publicClient() {
  if (!ARC_RPC_URL) throw new Error("ARC_RPC_URL or CANTEEN_RPC_URL is required");
  return createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

export function walletClient() {
  const account = privateKeyToAccount(requireEnv("PRIVATE_KEY") as `0x${string}`);
  return createWalletClient({ account, chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

export function contractAddresses() {
  return {
    agentRegistry: (process.env.AGENT_REGISTRY_ADDRESS || null) as `0x${string}` | null,
    traceRegistry: (process.env.TRACE_REGISTRY_ADDRESS || null) as `0x${string}` | null,
    resolutionRegistry: (process.env.RESOLUTION_REGISTRY_ADDRESS || null) as `0x${string}` | null,
    reputationRegistry: (process.env.REPUTATION_REGISTRY_ADDRESS || null) as `0x${string}` | null,
  };
}

export async function registerAgentOnchain(name: string, metadataUri: string, policyHash: `0x${string}`) {
  const address = contractAddresses().agentRegistry;
  if (!address) throw new Error("AGENT_REGISTRY_ADDRESS is required");
  const wallet = walletClient();
  const hash = await wallet.writeContract({
    address,
    abi: agentRegistryAbi,
    functionName: "registerAgent",
    args: [name, metadataUri, policyHash],
  });
  const receipt = await publicClient().waitForTransactionReceipt({ hash });
  const [event] = parseEventLogs({ abi: agentRegistryAbi, logs: receipt.logs, eventName: "AgentRegistered" });
  return { hash, receipt, event };
}

export async function commitTraceOnchain(input: {
  agentId: bigint;
  questionHash: `0x${string}`;
  traceHash: `0x${string}`;
  metadataUri: string;
  stance: string;
  confidence: number;
  riskScore: number;
  category: string;
  expiryTimestamp: number;
}) {
  const address = contractAddresses().traceRegistry;
  if (!address) throw new Error("TRACE_REGISTRY_ADDRESS is required");
  const wallet = walletClient();
  const hash = await wallet.writeContract({
    address,
    abi: traceRegistryAbi,
    functionName: "createTrace",
    args: [
      input.agentId,
      input.questionHash,
      input.traceHash,
      input.metadataUri,
      input.stance,
      input.confidence,
      input.riskScore,
      input.category,
      BigInt(input.expiryTimestamp),
    ],
  });
  const receipt = await publicClient().waitForTransactionReceipt({ hash });
  const [event] = parseEventLogs({ abi: traceRegistryAbi, logs: receipt.logs, eventName: "TraceCommitted" });
  return { hash, receipt, event };
}

export async function readTraceByHash(traceHash: `0x${string}`) {
  const address = contractAddresses().traceRegistry;
  if (!address) throw new Error("TRACE_REGISTRY_ADDRESS is required");
  return publicClient().readContract({
    address,
    abi: traceRegistryAbi,
    functionName: "getTraceByHash",
    args: [traceHash],
  });
}

export async function readAgent(agentId: bigint) {
  const address = contractAddresses().agentRegistry;
  if (!address) throw new Error("AGENT_REGISTRY_ADDRESS is required");
  return publicClient().readContract({
    address,
    abi: agentRegistryAbi,
    functionName: "getAgent",
    args: [agentId],
  });
}

export async function resolveTraceOnchain(traceId: bigint, outcome: number, evidenceUri: string, notesHash: `0x${string}`) {
  const address = contractAddresses().resolutionRegistry;
  if (!address) throw new Error("RESOLUTION_REGISTRY_ADDRESS is required");
  const wallet = walletClient();
  const hash = await wallet.writeContract({
    address,
    abi: resolutionRegistryAbi,
    functionName: "resolveTrace",
    args: [traceId, outcome, evidenceUri, notesHash],
  });
  const receipt = await publicClient().waitForTransactionReceipt({ hash });
  return { hash, receipt };
}
