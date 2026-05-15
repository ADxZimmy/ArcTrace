"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Panel, EmptyState } from "@/components/Shell";
import { VerifyButton } from "@/components/VerifyButton";

export default function TraceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [trace, setTrace] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => { if (id) fetch(`/api/traces/${id}`).then((r) => r.json()).then((j) => j.trace ? setTrace(j.trace) : setError(j.error)); }, [id]);
  return (
    <Shell>
      {!trace && !error ? <EmptyState title="Loading trace" body="Fetching the stored payload and Arc metadata." /> : null}
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}
      {trace ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="label text-[var(--lime)]">Trace Detail</p><h1 className="mono text-2xl font-bold text-white">{trace.question}</h1></div>
            <Link href={`/p/${trace.id}`} className="label rounded border border-[var(--outline)] px-3 py-2 text-[var(--lime)]">Public page</Link>
          </div>
          <section className="grid gap-4 md:grid-cols-4">
            <Panel title="Stance"><p className="mono text-2xl text-white">{trace.stance}</p></Panel>
            <Panel title="Confidence"><p className="mono text-2xl text-white">{trace.confidence}%</p></Panel>
            <Panel title="Risk"><p className="mono text-2xl text-white">{trace.riskScore}%</p></Panel>
            <Panel title="Arc Block"><p className="mono text-2xl text-white">{trace.arcBlockNumber?.toString() || "-"}</p></Panel>
          </section>
          <Panel title="D. Verify Trace"><VerifyButton traceId={trace.id} /></Panel>
          <Panel title="Hashes"><div className="space-y-2 text-xs"><p><span className="label">Question</span> <span className="mono break-all">{trace.questionHash}</span></p><p><span className="label">Trace</span> <span className="mono break-all text-[var(--lime)]">{trace.traceHash}</span></p><p><span className="label">Source bundle</span> <span className="mono break-all">{trace.sourceBundleHash}</span></p><p><span className="label">Transaction</span> <span className="mono break-all">{trace.arcTxHash}</span></p></div></Panel>
          <Panel title="Agent Committee Output"><pre className="max-h-96 overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--muted)]">{JSON.stringify(trace.payload?.agentCommitteeJson, null, 2)}</pre></Panel>
          <Panel title="Canonical Final Trace JSON"><pre className="max-h-96 overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{trace.payload?.fullJson}</pre></Panel>
        </div>
      ) : null}
    </Shell>
  );
}
