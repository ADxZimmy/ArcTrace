"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell, Panel, EmptyState, PrimaryLink } from "@/components/Shell";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { fetchJson } from "@/lib/clientApi";

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
  const [status, setStatus] = useState<any>(null);

  const loadAgents = useCallback(async () => {
    const json = await fetchJson<any>("/api/agents");
    setAgents(json.agents || []);
    if (json.agents?.[0] && !agentId) setAgentId(json.agents[0].id);
  }, [agentId]);
  useEffect(() => {
    loadAgents().catch((e) => setError(e.message));
    fetchJson<any>("/api/system/status").then(setStatus).catch((e) => setError(e.message));
  }, [loadAgents]);

  const readiness = status?.proofLoopReadiness || {};
  const canRegister = Boolean(readiness.database && readiness.arcRpc && readiness.agentRegistry && readiness.serverWallet);
  const canRunTrace = Boolean(canRegister && readiness.traceRegistry && readiness.aiProvider && agentId);
  const missingRegister = Object.entries({
    database: readiness.database,
    arcRpc: readiness.arcRpc,
    agentRegistry: readiness.agentRegistry,
    serverWallet: readiness.serverWallet,
  }).filter(([, ready]) => ready === false).map(([key]) => key);
  const missingTrace = Object.entries({
    traceRegistry: readiness.traceRegistry,
    aiProvider: readiness.aiProvider,
  }).filter(([, ready]) => ready === false).map(([key]) => key);

  async function register() {
    setLoading(true); setError("");
    try {
      const json = await fetchJson<any>("/api/agents/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ownerWallet: walletAddress || undefined }) });
      setResult({ milestone: "Register Agent", ...json }); await loadAgents(); setAgentId(json.agent.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function runTrace() {
    setLoading(true); setError(""); setResult(null);
    try {
      const json = await fetchJson<any>("/api/traces/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId, question, category, horizon, walletAddress: walletAddress || undefined }) });
      setResult({ milestone: "Run Agent Trace + Commit to Arc", ...json });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trace run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Proof Loop</p><h1 className="mono text-3xl font-bold text-white">New Agent Trace</h1></div>
      <Panel title="Readiness Checklist">
        {!status ? <p className="text-sm text-[var(--muted)]">Checking ArcTrace configuration...</p> : (
          <div className="grid gap-2 md:grid-cols-3">
            {Object.entries(readiness).map(([key, ready]) => (
              <div key={key} className="flex items-center justify-between rounded border border-[var(--outline)] p-3">
                <span className="label text-white">{key}</span>
                <span className={ready ? "text-[var(--mint)]" : "text-[var(--danger)]"}>{ready ? "ready" : "missing"}</span>
              </div>
            ))}
          </div>
        )}
        {missingRegister.length || missingTrace.length ? <p className="mt-3 text-sm text-[var(--muted)]">Register needs: {missingRegister.join(", ") || "ready"}. Run trace needs: {missingTrace.join(", ") || "ready"}.</p> : null}
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="A. Register Agent">
          <div className="mb-3 flex flex-col gap-3 md:flex-row">
            <input className="min-h-11 flex-1 rounded border border-[var(--outline)] bg-black/30 px-3" placeholder="Optional owner wallet" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
            <WalletConnectButton onAddress={setWalletAddress} />
          </div>
          <p className="mb-3 text-sm text-[var(--muted)]">Onchain writes use the configured server-side agent wallet. The owner wallet is recorded for the user/session trail.</p>
          <button disabled={loading || !canRegister} onClick={register} className="label min-h-11 rounded bg-[var(--lime)] px-4 font-bold text-black disabled:cursor-not-allowed disabled:bg-[var(--panel-high)] disabled:text-[var(--muted)]">{loading ? "Working..." : "Register default agent"}</button>
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
          <button disabled={loading || !canRunTrace} onClick={runTrace} className="label mt-4 min-h-11 rounded bg-[var(--lime)] px-4 font-bold text-black disabled:cursor-not-allowed disabled:bg-[var(--panel-high)] disabled:text-[var(--muted)]">{loading ? "Running..." : "Run agent trace and commit"}</button>
          {!canRunTrace ? <p className="mt-3 text-sm text-[var(--muted)]">This action unlocks after an agent is registered and the Trace Registry plus AI provider are configured.</p> : null}
        </Panel>
      </div>
      {error ? <Panel title="Integration Error"><p className="text-[var(--danger)]">{error}</p></Panel> : null}
      {result ? <Panel title={result.milestone}><pre className="max-h-[560px] overflow-auto rounded bg-black/40 p-4 text-xs text-[var(--mint)]">{JSON.stringify(result, null, 2)}</pre>{result.trace?.id ? <div className="mt-4"><PrimaryLink href={`/traces/${result.trace.id}`}>Open trace detail</PrimaryLink></div> : null}</Panel> : null}
    </Shell>
  );
}
