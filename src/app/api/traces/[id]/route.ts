import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { json } from "@/lib/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trace = await prisma.trace.findUnique({ where: { id }, include: { payload: true, sources: true, agent: true, feedback: true, resolutions: true } });
  if (!trace) return NextResponse.json({ error: "Trace not found" }, { status: 404 });
  return json({ trace });
}
