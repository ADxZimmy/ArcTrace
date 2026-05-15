import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { trackEvent } from "@/lib/metrics/track";

const schema = z.object({
  traceId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  walletAddress: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const feedback = await prisma.feedback.create({
      data: { traceId: input.traceId, rating: input.rating, comment: input.comment },
    });
    await trackEvent({ walletAddress: input.walletAddress, eventType: "feedback_submitted", entityType: "trace", entityId: input.traceId, metadataJson: { rating: input.rating } });
    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Feedback failed" }, { status: 400 });
  }
}
