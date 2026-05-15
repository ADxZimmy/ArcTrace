"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Panel, EmptyState, PrimaryLink } from "@/components/Shell";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/traces").then((r) => r.json()), fetch("/api/traction").then((r) => r.json())])
      .then(([traces, traction]) => { setData(traces); setMetrics(traction.metrics); })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="label text-[var(--lime)]">Command Center</p><h1 className="mono text-3xl font-bold text-white">Trace Dashboard</h1></div>
        <PrimaryLink href="/traces/new">Create trace</PrimaryLink>
      </div>
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-4">
        {["tracesCreated", "committedTraces", "verifiedTraces", "publicTraceViews"].map((key) => (
          <Panel key={key} title={key}><p className="mono text-3xl font-bold text-white">{metrics?.[key] ?? "-"}</p></Panel>
        ))}
      </section>
      <Panel title="Recent Traces" action={<Link className="label text-[var(--lime)]" href="/api/traction?format=csv">Export CSV</Link>}>
        {!data?.traces?.length ? <EmptyState title="No traces yet" body="Register an agent and run the first real trace. Empty is better than fake." cta={<PrimaryLink href="/traces/new">Start proof loop</PrimaryLink>} /> : (
          <div className="divide-y divide-[var(--outline)]">
            {data.traces.map((trace: any) => (
              <Link key={trace.id} href={`/traces/${trace.id}`} className="block py-3 hover:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-white">{trace.question}</p>
                  <span className="label text-[var(--lime)]">{trace.status}</span>
                </div>
                <p className="mono mt-1 text-xs text-[var(--muted)]">{trace.traceHash}</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </Shell>
  );
}
