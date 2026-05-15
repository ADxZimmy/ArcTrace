import Link from "next/link";
import { Activity, Bot, Gauge, Plus, Radio, Settings, ShieldCheck } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/traces/new", label: "New Trace", icon: Plus },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/demo", label: "Demo", icon: Radio },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="tech-grid min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--outline)] bg-[rgba(12,15,4,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded border border-[var(--lime)] text-[var(--lime)]">
              <Bot size={18} />
            </span>
            <span>
              <span className="mono block text-sm font-bold text-white">ArcTrace</span>
              <span className="label">Arc Testnet proof terminal</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="label flex min-h-11 items-center gap-2 rounded border border-transparent px-3 text-[var(--foreground)] hover:border-[var(--lime)]">
                <item.icon size={15} /> {item.label}
              </Link>
            ))}
          </nav>
          <span className="label flex items-center gap-2 text-[var(--mint)]"><Activity size={14} /> Testnet-first</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between border-b border-[var(--outline)] px-4 py-3">
        <h2 className="label text-white">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-[var(--outline)] p-6">
      <h3 className="mono text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{body}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="label inline-flex min-h-11 items-center rounded bg-[var(--lime)] px-4 font-bold text-black">{children}</Link>;
}
