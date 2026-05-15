"use client";

import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/Shell";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<any>(null);
  useEffect(() => { fetch("/api/traction").then((r) => r.json()).then((j) => setMetrics(j.metrics)); }, []);
  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Internal</p><h1 className="mono text-3xl font-bold text-white">Traction Dashboard</h1></div>
      <section className="grid gap-4 md:grid-cols-4">{Object.entries(metrics || {}).map(([key, value]) => <Panel key={key} title={key}><p className="mono text-3xl text-white">{String(value)}</p></Panel>)}</section>
      <a href="/api/traction?format=csv" className="label mt-4 inline-flex min-h-11 items-center rounded bg-[var(--lime)] px-4 font-bold text-black">Export hackathon CSV</a>
    </Shell>
  );
}
