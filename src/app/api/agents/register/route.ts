import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { defaultPolicyHash } from "@/lib/hashing";
import { registerAgentSchema } from "@/lib/schemas";
import { registerAgentOnchain } from "@/lib/arc/client";
import { txExplorerUrl } from "@/lib/config";
import { trackEvent } from "@/lib/metrics/track";

export async function POST(request: Request) {
  try {
    if (!databaseConfigured()) return NextResponse.json({ error: databaseUnavailablePayload().error }, { status: 400 });
    if (!process.env.AGENT_REGISTRY_ADDRESS) return NextResponse.json({ error: "AGENT_REGISTRY_ADDRESS is required. Deploy AgentRegistry and add its Arc Testnet address." }, { status: 400 });
    if (!process.env.PRIVATE_KEY) return NextResponse.json({ error: "PRIVATE_KEY is required for the current server-side Arc Testnet wallet flow." }, { status: 400 });
    const input = registerAgentSchema.parse(await request.json().catch(() => ({})));
    const onchain = await registerAgentOnchain(input.name, input.metadataUri, defaultPolicyHash);
    const event = onchain.event?.args;
    const ownerWallet = input.ownerWallet || event?.owner || onchain.receipt.from;

    const agent = await prisma.agent.create({
      data: {
        onchainAgentId: event?.agentId?.toString(),
        ownerWallet,
        name: input.name,
        metadataUri: input.metadataUri,
        policyHash: defaultPolicyHash,
        contractTxHash: onchain.hash,
      },
    });
    await trackEvent({ walletAddress: ownerWallet, eventType: "agent_registered", entityType: "agent", entityId: agent.id, metadataJson: { txHash: onchain.hash } });

    return NextResponse.json({
      agent,
      policyHash: defaultPolicyHash,
      transactionHash: onchain.hash,
      blockNumber: onchain.receipt.blockNumber.toString(),
      explorerUrl: txExplorerUrl(onchain.hash),
      event: event ? { ...event, agentId: event.agentId?.toString(), createdAt: event.createdAt?.toString() } : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Agent registration failed" }, { status: 400 });
  }
}
