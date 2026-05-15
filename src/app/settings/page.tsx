"use client";

import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/Shell";
import { fetchJson } from "@/lib/clientApi";

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetchJson<any>("/api/system/status").then(setStatus).catch((e) => setError(e.message)); }, []);
  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Integrations</p><h1 className="mono text-3xl font-bold text-white">System Status</h1></div>
      {error ? <Panel title="Status Error"><p className="text-[var(--danger)]">{error}</p></Panel> : null}
      {!status ? <Panel title="Live Configuration"><p className="text-sm text-[var(--muted)]">Loading integration status...</p></Panel> : (
        <div className="space-y-4">
          <Panel title="Proof Loop Readiness">
            <div className="grid gap-2 md:grid-cols-3">
              {Object.entries(status.proofLoopReadiness || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded border border-[var(--outline)] p-3">
                  <span className="label text-white">{key}</span>
                  <span className={value ? "text-[var(--mint)]" : "text-[var(--danger)]"}>{value ? "ready" : "missing"}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Live Configuration"><pre className="overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{JSON.stringify(status, null, 2)}</pre></Panel>
        </div>
      )}
    </Shell>
  );
}
