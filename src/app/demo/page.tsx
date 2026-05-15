import { Shell, Panel } from "@/components/Shell";

export default function DemoPage() {
  const steps = [
    "Connect wallet or use the configured server-side agent wallet.",
    "Register the default ArcTrace agent and capture agent ID, policy hash, transaction hash, and explorer link.",
    "Create a measurable market intelligence question with an expiry window.",
    "Collect real configured sources. Unconfigured adapters must show unavailable.",
    "Run Research, Risk, Contrarian, and Final Decision agents.",
    "Store canonical final trace JSON, source bundle hash, question hash, and trace hash.",
    "Commit TraceRegistry.createTrace on Arc Testnet and show receipt/event data.",
    "Open the public trace page and press Verify Trace.",
    "Resolve the trace with evidence and update reputation/traction.",
    "Export traction CSV for hackathon submission.",
  ];
  return (
    <Shell>
      <div className="mb-6"><p className="label text-[var(--lime)]">Hackathon Demo</p><h1 className="mono text-3xl font-bold text-white">End-to-End Proof Script</h1></div>
      <Panel title="Script">
        <ol className="space-y-3">
          {steps.map((step, index) => <li key={step} className="flex gap-3"><span className="mono text-[var(--lime)]">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
        </ol>
      </Panel>
    </Shell>
  );
}
