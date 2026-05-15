import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { json } from "@/lib/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      traces: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const resolved = agent.traces.filter((trace) => trace.status === "resolved").length;
  return json({
    agent,
    reputation: {
      totalTraces: agent.traces.length,
      resolvedTraces: resolved,
      committedTraces: agent.traces.filter((trace) => trace.status === "committed").length,
      averageConfidence: agent.traces.length ? Math.round(agent.traces.reduce((sum, trace) => sum + trace.confidence, 0) / agent.traces.length) : 0,
    },
  });
}
