import { prisma } from "@/lib/db/prisma";

export async function trackEvent(input: {
  userId?: string | null;
  walletAddress?: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  metadataJson?: unknown;
}) {
  try {
    await prisma.tractionEvent.create({
      data: {
        userId: input.userId ?? undefined,
        walletAddress: input.walletAddress ?? undefined,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        metadataJson: input.metadataJson === undefined ? undefined : (input.metadataJson as object),
      },
    });
  } catch {
    // Metrics should never mask the proof loop response.
  }
}
