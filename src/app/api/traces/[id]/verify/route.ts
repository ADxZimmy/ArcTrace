import { NextResponse } from "next/server";
import { verifyTrace } from "@/lib/verification";
import { trackEvent } from "@/lib/metrics/track";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await verifyTrace(id);
    await trackEvent({ eventType: "trace_verified", entityType: "trace", entityId: id, metadataJson: result.checks });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}
