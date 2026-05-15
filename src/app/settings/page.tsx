"use client";

import { useEffect, useState } from "react";
import { Shell, Panel } from "@/components/Shell";

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { fetch("/api/system/status").then((r) => r.json()).then(setStatus); }, []);
  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Integrations</p><h1 className="mono text-3xl font-bold text-white">System Status</h1></div>
      <Panel title="Live Configuration"><pre className="overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{JSON.stringify(status, null, 2)}</pre></Panel>
    </Shell>
  );
}
