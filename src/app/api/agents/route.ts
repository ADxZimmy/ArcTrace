import { NextResponse } from "next/server";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  if (!databaseConfigured()) {
    return NextResponse.json({ agents: [], db: databaseUnavailablePayload() });
  }
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { traces: true } } } });
  return NextResponse.json({ agents });
}
