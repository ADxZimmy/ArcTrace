"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell, Panel, EmptyState, PrimaryLink } from "@/components/Shell";

export default function NewTracePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState("");
  const [question, setQuestion] = useState("Will the total crypto market cap increase over the next 7 days?");
  const [category, setCategory] = useState("crypto");
  const [horizon, setHorizon] = useState("7 days");
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    const json = await fetch("/api/agents").then((r) => r.json());
    setAgents(json.agents || []);
    if (json.agents?.[0] && !agentId) setAgentId(json.agents[0].id);
  }, [agentId]);
  useEffect(() => { loadAgents(); }, [loadAgents]);

  async function register() {
    setLoading(true); setError("");
    const res = await fetch("/api/agents/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerWallet: walletAddress || undefined }) });
    const json = await res.json(); setLoading(false);
    if (!res.ok) setError(json.error); else { setResult({ milestone: "Register Agent", ...json }); await loadAgents(); setAgentId(json.agent.id); }
  }

  async function runTrace() {
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/traces/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId, question, category, horizon, walletAddress: walletAddress || undefined }) });
    const json = await res.json(); setLoading(false);
    if (!res.ok) setError(json.error); else setResult({ milestone: "Run Agent Trace + Commit to Arc", ...json });
  }

  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Proof Loop</p><h1 className="mono text-3xl font-bold text-white">New Agent Trace</h1></div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="A. Register Agent">
          <input className="mb-3 min-h-11 w-full rounded border border-[var(--outline)] bg-black/30 px-3" placeholder="Optional owner wallet" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
          <button disabled={loading} onClick={register} className="label min-h-11 rounded bg-[var(--lime)] px-4 font-bold text-black disabled:opacity-50">Register default agent</button>
          {!agents.length ? <EmptyState title="No registered agents" body="Register the default policy on Arc Testnet before running traces." /> : (
            <select className="mt-4 min-h-11 w-full rounded border border-[var(--outline)] bg-black/30 px-3" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} #{agent.onchainAgentId}</option>)}
            </select>
          )}
        </Panel>
        <Panel title="B/C. Run Trace And Commit">
          <textarea className="min-h-28 w-full rounded border border-[var(--outline)] bg-black/30 p-3" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="min-h-11 rounded border border-[var(--outline)] bg-black/30 px-3" value={category} onChange={(e) => setCategory(e.target.value)} />
            <input className="min-h-11 rounded border border-[var(--outline)] bg-black/30 px-3" value={horizon} onChange={(e) => setHorizon(e.target.value)} />
          </div>
          <button disabled={loading || !agentId} onClick={runTrace} className="label mt-4 min-h-11 rounded bg-[var(--lime)] px-4 font-bold text-black disabled:opacity-50">{loading ? "Running..." : "Run agent trace and commit"}</button>
        </Panel>
      </div>
      {error ? <Panel title="Integration Error"><p className="text-[var(--danger)]">{error}</p></Panel> : null}
      {result ? <Panel title={result.milestone}><pre className="max-h-[560px] overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{JSON.stringify(result, null, 2)}</pre>{result.trace?.id ? <div className="mt-4"><PrimaryLink href={`/traces/${result.trace.id}`}>Open trace detail</PrimaryLink></div> : null}</Panel> : null}
    </Shell>
  );
}
