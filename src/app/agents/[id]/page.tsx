"use client";

import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/Shell";

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const [agent, setAgent] = useState<any>(null);
  const [rep, setRep] = useState<any>(null);
  useEffect(() => { params.then((p) => fetch(`/api/agents/${p.id}`).then((r) => r.json()).then((j) => { setAgent(j.agent); setRep(j.reputation); })); }, [params]);
  return <Shell><Panel title="Agent Reputation"><pre className="overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{JSON.stringify({ agent, reputation: rep }, null, 2)}</pre></Panel></Shell>;
}
