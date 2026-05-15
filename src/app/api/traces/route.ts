import { prisma } from "@/lib/db/prisma";
import { databaseConfigured, databaseUnavailablePayload } from "@/lib/db/availability";
import { json } from "@/lib/http";

export async function GET(request: Request) {
  if (!databaseConfigured()) {
    return json({ traces: [], db: databaseUnavailablePayload() });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const traces = await prisma.trace.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { agent: true },
    take: 50,
  });
  return json({ traces });
}
