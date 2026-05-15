import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { trackEvent } from "@/lib/metrics/track";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trace = await prisma.trace.findUnique({ where: { id }, include: { payload: true, sources: true, agent: true } });
  if (!trace) return NextResponse.json({ error: "Trace not found" }, { status: 404 });
  await trackEvent({ eventType: "public_trace_view", entityType: "trace", entityId: id });
  return NextResponse.json({
    trace: {
      id: trace.id,
      question: trace.question,
      stance: trace.stance,
      confidence: trace.confidence,
      riskScore: trace.riskScore,
      category: trace.category,
      horizon: trace.horizon,
      traceHash: trace.traceHash,
      sourceBundleHash: trace.sourceBundleHash,
      arcTxHash: trace.arcTxHash,
      arcBlockNumber: trace.arcBlockNumber?.toString(),
      publicSummary: trace.payload?.publicSummary,
      signals: trace.payload?.signalsJson,
      risks: trace.payload?.risksJson,
      canonicalFinalTraceJson: trace.payload?.fullJson,
      agent: trace.agent,
      sources: trace.sources,
      createdAt: trace.createdAt,
    },
  });
}
