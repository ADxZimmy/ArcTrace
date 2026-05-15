import { NextResponse } from "next/server";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";

const emptyMetrics = {
  uniqueUsers: 0,
  returningUsers: 0,
  tracesCreated: 0,
  committedTraces: 0,
  verifiedTraces: 0,
  resolvedTraces: 0,
  publicTraceViews: 0,
  feedbackCount: 0,
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (!databaseConfigured()) {
    if (format === "csv") {
      const csv = ["metric,value", ...Object.entries(emptyMetrics).map(([key, value]) => `${key},${value}`), "db_configured,false"].join("\n");
      return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=arctrace-traction.csv" } });
    }
    return NextResponse.json({ metrics: emptyMetrics, db: databaseUnavailablePayload() });
  }
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
