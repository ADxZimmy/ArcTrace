import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { traces: true } } } });
  return NextResponse.json({ agents });
}
