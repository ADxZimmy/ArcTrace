import { NextResponse } from "next/server";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";
import { ARC_CHAIN_ID, ARC_RPC_URL } from "@/lib/config";
import { contractAddresses, publicClient } from "@/lib/arc/client";

export async function GET() {
  const addresses = contractAddresses();
  const db = databaseConfigured()
    ? await prisma.$queryRaw`select 1 as ok`
        .then(() => ({ ok: true, configured: true }))
        .catch((error) => ({ ok: false, configured: true, error: error instanceof Error ? error.message : "DB unavailable" }))
    : databaseUnavailablePayload();
  const rpc = ARC_RPC_URL
    ? await publicClient()
        .getBlockNumber()
        .then((block) => ({ ok: true, latestBlock: block.toString() }))
        .catch((error) => ({ ok: false, error: error instanceof Error ? error.message : "RPC unavailable" }))
    : { ok: false, error: "ARC_RPC_URL or CANTEEN_RPC_URL not configured" };
  return NextResponse.json({
    db,
    arcRpc: rpc,
    chainId: ARC_CHAIN_ID,
    currency: "USDC",
    contractAddresses: addresses,
    circleIntegration: {
      apiKeyConfigured: Boolean(process.env.CIRCLE_API_KEY || process.env.CIRCLE_WEB3_API_KEY),
      entitySecretConfigured: Boolean(process.env.CIRCLE_ENTITY_SECRET),
      agentWalletConfigured: Boolean(process.env.PRIVATE_KEY),
    },
    aiProvider: { provider: process.env.AI_PROVIDER || null, apiKeyConfigured: Boolean(process.env.AI_API_KEY) },
    proofLoopReadiness: {
      database: databaseConfigured(),
      arcRpc: Boolean(ARC_RPC_URL),
      agentRegistry: Boolean(addresses.agentRegistry),
      traceRegistry: Boolean(addresses.traceRegistry),
      resolutionRegistry: Boolean(addresses.resolutionRegistry),
      serverWallet: Boolean(process.env.PRIVATE_KEY),
      aiProvider: Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY),
    },
  });
}
