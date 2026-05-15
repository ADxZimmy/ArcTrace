"use client";

import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/Shell";
import { fetchJson } from "@/lib/clientApi";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [dbWarning, setDbWarning] = useState("");
  useEffect(() => { fetchJson<any>("/api/traction").then((j) => { setMetrics(j.metrics); setDbWarning(j.db?.error || ""); }); }, []);
  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Internal</p><h1 className="mono text-3xl font-bold text-white">Traction Dashboard</h1></div>
      {dbWarning ? <Panel title="Configuration Required"><p className="text-sm text-[var(--danger)]">{dbWarning}</p></Panel> : null}
      <section className="grid gap-4 md:grid-cols-4">{Object.entries(metrics || {}).map(([key, value]) => <Panel key={key} title={key}><p className="mono text-3xl text-white">{String(value)}</p></Panel>)}</section>
      <a href="/api/traction?format=csv" className="label mt-4 inline-flex min-h-11 items-center rounded bg-[var(--lime)] px-4 font-bold text-black">Export hackathon CSV</a>
    </Shell>
  );
}
