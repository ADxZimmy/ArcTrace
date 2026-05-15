import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ARC_CHAIN_ID, ARC_RPC_URL } from "@/lib/config";
import { contractAddresses, publicClient } from "@/lib/arc/client";

export async function GET() {
  const db = await prisma.$queryRaw`select 1 as ok`
    .then(() => ({ ok: true }))
    .catch((error) => ({ ok: false, error: error instanceof Error ? error.message : "DB unavailable" }));
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
    contractAddresses: contractAddresses(),
    circleIntegration: {
      apiKeyConfigured: Boolean(process.env.CIRCLE_API_KEY || process.env.CIRCLE_WEB3_API_KEY),
      entitySecretConfigured: Boolean(process.env.CIRCLE_ENTITY_SECRET),
      agentWalletConfigured: Boolean(process.env.CIRCLE_AGENT_WALLET_CONFIG || process.env.PRIVATE_KEY),
    },
    aiProvider: { provider: process.env.AI_PROVIDER || null, apiKeyConfigured: Boolean(process.env.AI_API_KEY) },
  });
}
