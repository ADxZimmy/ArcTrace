"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export function VerifyButton({ traceId }: { traceId: string }) {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch(`/api/traces/${traceId}/verify`, { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) setError(json.error || "Verification failed");
    else setResult(json);
  }

  return (
    <div className="space-y-3">
      <button onClick={verify} disabled={loading} className="label inline-flex min-h-11 items-center gap-2 rounded bg-[var(--lime)] px-4 font-bold text-black disabled:opacity-50">
        <ShieldCheck size={16} /> {loading ? "Verifying..." : "Verify Trace"}
      </button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {result ? <pre className="max-h-80 overflow-auto rounded border border-[var(--outline)] bg-black/40 p-3 text-xs text-[var(--mint)]">{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}
