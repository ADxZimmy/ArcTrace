import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { commitTraceOnchain } from "@/lib/arc/client";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { txExplorerUrl } from "@/lib/config";
import { runAgentPipeline } from "@/lib/ai/pipeline";
import { runTraceSchema } from "@/lib/schemas";
import { trackEvent } from "@/lib/metrics/track";
import { json } from "@/lib/http";

export async function POST(request: Request) {
  try {
    if (!databaseConfigured()) return NextResponse.json({ error: databaseUnavailablePayload().error }, { status: 400 });
    if (!process.env.TRACE_REGISTRY_ADDRESS) return NextResponse.json({ error: "TRACE_REGISTRY_ADDRESS is required. Deploy TraceRegistry and add its Arc Testnet address." }, { status: 400 });
    if (!process.env.AI_PROVIDER || !process.env.AI_API_KEY) return NextResponse.json({ error: "AI_PROVIDER and AI_API_KEY are required to run the multi-agent trace pipeline." }, { status: 400 });
    const input = runTraceSchema.parse(await request.json());
    const agent = await prisma.agent.findUnique({ where: { id: input.agentId } });
    if (!agent?.onchainAgentId) throw new Error("Agent must be registered on Arc Testnet before running a trace");

    let userId: string | undefined;
    if (input.walletAddress) {
      const user = await prisma.user.upsert({
        where: { walletAddress: input.walletAddress },
        update: { lastSeenAt: new Date() },
        create: { walletAddress: input.walletAddress },
      });
      userId = user.id;
    }

    const result = await runAgentPipeline({
      question: input.question,
      category: input.category,
      horizon: input.horizon,
      dataSources: input.dataSources,
    });

    const metadataUri = `${process.env.APP_BASE_URL || "http://localhost:3000"}/api/traces/pending`;
    const trace = await prisma.trace.create({
      data: {
        agentId: agent.id,
        creatorUserId: userId,
        question: input.question,
        questionHash: result.questionHash,
        traceHash: result.traceHash,
        sourceBundleHash: result.sourceBundleHash,
        metadataUri,
        stance: result.finalDecision.stance,
        confidence: result.finalDecision.confidence,
        riskScore: result.finalDecision.risk_score,
        category: result.finalDecision.category,
        horizon: result.finalDecision.horizon,
        expiryTimestamp: new Date(result.finalDecision.expiry_timestamp),
        sourceQualityScore: result.finalDecision.source_quality_score,
        status: "generated",
        payload: {
          create: {
            fullJson: result.canonicalTraceJson,
            publicSummary: result.finalDecision.decision_summary,
            signalsJson: result.finalDecision.signals,
            risksJson: result.finalDecision.risks,
            agentCommitteeJson: result.committee,
            rawSourceRefsJson: { sources: result.sources, unavailable: result.unavailableAdapters },
          },
        },
        sources: {
          create: result.sources.map((source) => ({
            sourceType: source.source_type,
            provider: source.provider,
            urlOrIdentifier: source.url_or_identifier,
            title: source.title,
            publishedAt: new Date(source.timestamp),
            reliabilityScore: source.reliability_score,
            recencyScore: source.recency_score,
            relevanceScore: source.relevance_score,
            hash: source.hash,
          })),
        },
      },
      include: { payload: true, sources: true },
    });

    const finalMetadataUri = `${process.env.APP_BASE_URL || "http://localhost:3000"}/p/${trace.id}`;
    const onchain = await commitTraceOnchain({
      agentId: BigInt(agent.onchainAgentId),
      questionHash: result.questionHash,
      traceHash: result.traceHash,
      metadataUri: finalMetadataUri,
      stance: result.finalDecision.stance,
      confidence: result.finalDecision.confidence,
      riskScore: result.finalDecision.risk_score,
      category: result.finalDecision.category,
      expiryTimestamp: Math.floor(new Date(result.finalDecision.expiry_timestamp).getTime() / 1000),
    });
    const event = onchain.event?.args;
    const committed = await prisma.trace.update({
      where: { id: trace.id },
      data: {
        onchainTraceId: event?.traceId?.toString(),
        metadataUri: finalMetadataUri,
        status: "committed",
        arcTxHash: onchain.hash,
        arcBlockNumber: onchain.receipt.blockNumber,
      },
      include: { payload: true, sources: true, agent: true },
    });

    await trackEvent({ userId, walletAddress: input.walletAddress, eventType: "trace_committed", entityType: "trace", entityId: trace.id, metadataJson: { txHash: onchain.hash } });

    return json({
      trace: committed,
      canonicalFinalTraceJson: result.canonicalTraceJson,
      sourceBundleHash: result.sourceBundleHash,
      traceHash: result.traceHash,
      transactionHash: onchain.hash,
      blockNumber: onchain.receipt.blockNumber.toString(),
      explorerUrl: txExplorerUrl(onchain.hash),
      event: event
        ? {
            ...event,
            traceId: event.traceId?.toString(),
            agentId: event.agentId?.toString(),
            expiryTimestamp: event.expiryTimestamp?.toString(),
            createdAt: event.createdAt?.toString(),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Trace run failed" }, { status: 400 });
  }
}
