import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const [uniqueUsers, returningUsers, tracesCreated, committedTraces, verifiedEvents, resolvedTraces, views, feedbackCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { traces: { some: {} }, events: { some: {} } } }),
    prisma.trace.count(),
    prisma.trace.count({ where: { status: { in: ["committed", "resolved"] } } }),
    prisma.tractionEvent.count({ where: { eventType: "trace_verified" } }),
    prisma.trace.count({ where: { status: "resolved" } }),
    prisma.tractionEvent.count({ where: { eventType: "public_trace_view" } }),
    prisma.feedback.count(),
  ]);
  const metrics = { uniqueUsers, returningUsers, tracesCreated, committedTraces, verifiedTraces: verifiedEvents, resolvedTraces, publicTraceViews: views, feedbackCount };
  if (format === "csv") {
    const csv = ["metric,value", ...Object.entries(metrics).map(([key, value]) => `${key},${value}`)].join("\n");
    return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=arctrace-traction.csv" } });
  }
  return NextResponse.json({ metrics });
}
