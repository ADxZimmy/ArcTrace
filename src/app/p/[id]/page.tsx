"use client";

import { useEffect, useState } from "react";
import { Shell, Panel, EmptyState } from "@/components/Shell";
import { VerifyButton } from "@/components/VerifyButton";

export default function PublicTracePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [trace, setTrace] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => { if (id) fetch(`/api/traces/${id}/public`).then((r) => r.json()).then((j) => setTrace(j.trace)); }, [id]);
  async function submitFeedback() {
    const res = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ traceId: id, rating, comment }) });
    setFeedback(res.ok ? "Feedback recorded." : "Feedback failed.");
  }
  return (
    <Shell>
      {!trace ? <EmptyState title="Loading public proof" body="Fetching the public trace without private secrets." /> : (
        <div className="space-y-4">
          <div><p className="label text-[var(--lime)]">Public Trace Proof</p><h1 className="mono text-3xl font-bold text-white">{trace.question}</h1><p className="mt-2 text-[var(--muted)]">{trace.publicSummary}</p></div>
          <section className="grid gap-4 md:grid-cols-3"><Panel title="Decision">{trace.stance} / {trace.confidence}%</Panel><Panel title="Risk">{trace.riskScore}%</Panel><Panel title="Trace Hash"><span className="mono break-all text-xs">{trace.traceHash}</span></Panel></section>
          <Panel title="Verify This Trace"><VerifyButton traceId={trace.id} /></Panel>
          <Panel title="Canonical JSON"><pre className="max-h-96 overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{trace.canonicalFinalTraceJson}</pre></Panel>
          <Panel title="Feedback"><div className="flex flex-col gap-3 md:flex-row"><input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="min-h-11 rounded border border-[var(--outline)] bg-black/30 px-3" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" className="min-h-11 flex-1 rounded border border-[var(--outline)] bg-black/30 px-3" /><button onClick={submitFeedback} className="label min-h-11 rounded bg-[var(--lime)] px-4 font-bold text-black">Submit</button></div>{feedback ? <p className="mt-2 text-sm text-[var(--mint)]">{feedback}</p> : null}</Panel>
        </div>
      )}
    </Shell>
  );
}
