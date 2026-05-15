import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashString } from "@/lib/hashing";
import { resolveTraceOnchain } from "@/lib/arc/client";
import { txExplorerUrl } from "@/lib/config";
import { trackEvent } from "@/lib/metrics/track";

const schema = z.object({
  outcome: z.enum(["Correct", "Incorrect", "Inconclusive"]),
  evidenceUri: z.string().url(),
  notes: z.string().min(8),
  resolverWallet: z.string().min(6),
});

const outcomeCode = { Correct: 1, Incorrect: 2, Inconclusive: 3 } as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const input = schema.parse(await request.json());
    const trace = await prisma.trace.findUnique({ where: { id }, include: { agent: true } });
    if (!trace?.onchainTraceId) throw new Error("Trace must be committed before resolution");
    const notesHash = hashString(input.notes);
    const onchain = await resolveTraceOnchain(BigInt(trace.onchainTraceId), outcomeCode[input.outcome], input.evidenceUri, notesHash);
    const resolution = await prisma.resolution.create({
      data: {
        traceId: id,
        outcome: input.outcome,
        evidenceUri: input.evidenceUri,
        notes: input.notes,
        notesHash,
        resolverWallet: input.resolverWallet,
        arcTxHash: onchain.hash,
      },
    });
    await prisma.trace.update({ where: { id }, data: { status: "resolved" } });
    await trackEvent({ walletAddress: input.resolverWallet, eventType: "trace_resolved", entityType: "trace", entityId: id, metadataJson: { outcome: input.outcome } });
    return NextResponse.json({ resolution, transactionHash: onchain.hash, blockNumber: onchain.receipt.blockNumber.toString(), explorerUrl: txExplorerUrl(onchain.hash) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Resolution failed" }, { status: 400 });
  }
}
