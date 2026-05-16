import { prisma } from "@/lib/db/prisma";
import { hashString } from "@/lib/hashing";
import { publicClient, readAgent, readTraceByHash } from "@/lib/arc/client";

function serializeOnchainTrace(trace: unknown) {
  if (!trace || typeof trace !== "object") return null;
  const value = trace as Record<string, unknown>;
  return {
    traceId: value.traceId?.toString() ?? null,
    agentId: value.agentId?.toString() ?? null,
    creator: value.creator ?? null,
    questionHash: value.questionHash ?? null,
    traceHash: value.traceHash ?? null,
    metadataURI: value.metadataURI ?? null,
    stance: value.stance ?? null,
    confidence: value.confidence?.toString() ?? null,
    riskScore: value.riskScore?.toString() ?? null,
    category: value.category ?? null,
    expiryTimestamp: value.expiryTimestamp?.toString() ?? null,
    createdAt: value.createdAt?.toString() ?? null,
    resolved: value.resolved ?? null,
    resolutionId: value.resolutionId?.toString() ?? null,
  };
}

export async function verifyTrace(traceId: string) {
  const trace = await prisma.trace.findUnique({
    where: { id: traceId },
    include: { payload: true, agent: true },
  });

  const databasePayloadExists = Boolean(trace?.payload?.fullJson);
  const canonical = typeof trace?.payload?.fullJson === "string" ? trace.payload.fullJson : JSON.stringify(trace?.payload?.fullJson ?? {});
  const recomputedHash = databasePayloadExists ? hashString(canonical) : null;
  const canonicalHashMatches = Boolean(recomputedHash && trace?.traceHash && recomputedHash.toLowerCase() === trace.traceHash.toLowerCase());

  let onchainTraceExists = false;
  let transactionConfirmed = false;
  let agentPolicyMatches = false;
  let onchainTrace: unknown = null;

  if (trace?.traceHash) {
    try {
      onchainTrace = serializeOnchainTrace(await readTraceByHash(trace.traceHash as `0x${string}`));
      onchainTraceExists = true;
    } catch {
      onchainTraceExists = false;
    }
  }

  if (trace?.arcTxHash) {
    try {
      const receipt = await publicClient().getTransactionReceipt({ hash: trace.arcTxHash as `0x${string}` });
      transactionConfirmed = receipt.status === "success";
    } catch {
      transactionConfirmed = false;
    }
  }

  if (trace?.agent?.onchainAgentId) {
    try {
      const agent = await readAgent(BigInt(trace.agent.onchainAgentId));
      agentPolicyMatches = agent.policyHash.toLowerCase() === trace.agent.policyHash.toLowerCase();
    } catch {
      agentPolicyMatches = false;
    }
  }

  const checks = {
    database_payload_exists: databasePayloadExists,
    canonical_hash_matches: canonicalHashMatches,
    onchain_trace_exists: onchainTraceExists,
    transaction_confirmed: transactionConfirmed,
    agent_policy_matches: agentPolicyMatches,
  };

  return {
    verified: Object.values(checks).every(Boolean),
    checks,
    trace_hash: trace?.traceHash ?? null,
    recomputed_hash: recomputedHash,
    onchain_trace: onchainTrace,
  };
}
