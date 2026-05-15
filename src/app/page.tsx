import { Shell, Panel, PrimaryLink } from "@/components/Shell";
import { ArrowRight, CheckCircle2, Fingerprint, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <Shell>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="py-10">
          <p className="label text-[var(--lime)]">Before AI agents manage money</p>
          <h1 className="mono mt-4 max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">ArcTrace verifies how agents think.</h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            A testnet-first market reasoning platform where multi-agent decisions become canonical JSON, hashed evidence, Arc Testnet transactions, and repeatable verification results.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/traces/new">Run proof loop <ArrowRight className="ml-2" size={16} /></PrimaryLink>
            <PrimaryLink href="/demo">Demo script</PrimaryLink>
          </div>
        </div>
        <Panel title="Critical Demo Spine">
          <div className="space-y-4">
            {[
              ["Register Agent", "Agent ID, policy hash, Arc transaction, explorer link"],
              ["Run Agent Trace", "Research, risk, contrarian, final decision JSON"],
              ["Commit to Arc", "TraceRegistry.createTrace receipt and event"],
              ["Verify Trace", "Backend recomputes hash and reads Arc Testnet"],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3 rounded border border-[var(--outline)] p-3">
                <CheckCircle2 className="mt-1 text-[var(--lime)]" size={18} />
                <div>
                  <h3 className="mono text-sm font-semibold text-white">{title}</h3>
                  <p className="text-sm text-[var(--muted)]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel title="Trace Integrity"><Fingerprint className="text-[var(--lime)]" /><p className="mt-3 text-sm text-[var(--muted)]">Canonical JSON is hashed with keccak256 and never silently rewritten.</p></Panel>
        <Panel title="No Capital Movement"><ShieldCheck className="text-[var(--mint)]" /><p className="mt-3 text-sm text-[var(--muted)]">The MVP produces research and simulated decisions only. No trades, bets, or user funds.</p></Panel>
        <Panel title="No Mock Runtime"><CheckCircle2 className="text-[var(--lime)]" /><p className="mt-3 text-sm text-[var(--muted)]">Unconfigured adapters show unavailable states. Production routes do not fabricate data.</p></Panel>
      </section>
    </Shell>
  );
}
