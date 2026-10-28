import { RULES, type Basis } from "@/lib/rules";
import { card } from "@/components/ui";

const BASIS: Record<Basis, string> = {
  sourced: "bg-emerald-100 text-emerald-900",
  assumed: "bg-amber-100 text-amber-900",
  simulated: "bg-violet-100 text-violet-900",
};

function Box({ title, sub, tone }: { title: string; sub: string; tone: "built" | "sim" | "prop" }) {
  const t = {
    built: "border-emerald-500 bg-emerald-50",
    sim: "border-violet-500 bg-violet-50 border-dashed",
    prop: "border-zinc-400 bg-zinc-50 border-dashed",
  }[tone];
  return (
    <div className={`rounded-lg border-2 p-3 text-center text-sm ${t}`}>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-zinc-600">{sub}</div>
    </div>
  );
}

const Arrow = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center py-1 text-xs text-zinc-500 md:py-0">↓ {label}</div>
);

export default function RulesPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Architecture</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border-2 border-emerald-500 bg-emerald-50 px-2 py-0.5">Built and working</span>
          <span className="rounded border-2 border-dashed border-violet-500 bg-violet-50 px-2 py-0.5">Simulated in this prototype</span>
          <span className="rounded border-2 border-dashed border-zinc-400 bg-zinc-50 px-2 py-0.5">Proposed for production, not built</span>
        </div>
        <div className={`${card} space-y-1`}>
          <Box title="Finance user · Browser UI" sub="Invoice list, form with live hints, detail and status timeline" tone="built" />
          <Arrow label="invoice JSON (HTTPS)" />
          <Box title="Volopay API · Next.js route handlers" sub="POST /api/check = authoritative checks (V-01…V-05). Status handling. Partner adapter." tone="built" />
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Arrow label="read / write" />
              <Box title="Database" sub="Prototype: browser localStorage. Production: Postgres (invoices, lines, status history)" tone="built" />
            </div>
            <div>
              <Arrow label="CSV import / sync" />
              <Box title="ERP / accounting tool" sub="Not built. Production: connectors to accounting tools" tone="prop" />
            </div>
            <div>
              <Arrow label="adapter.submit()" />
              <Box title="E-invoicing partner (ASP)" sub="SIMULATED: POST /api/provider/submit, rules P-01…P-03. Production: accredited provider API" tone="sim" />
              <Arrow label="status + code returned, stored as a status event" />
              <Box title="Tax authority" sub="Not shown. Reached only through the provider" tone="prop" />
            </div>
          </div>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li><b>Where validation happens:</b> (1) in the browser while typing, for quick hints; (2) on the Volopay API before anything is sent, which is the authoritative pass; (3) at the provider after sending (simulated P-rules).</li>
          <li><b>How status returns:</b> the provider response is stored as a status event with its code and message, and the invoice page shows it in the timeline. Only invoices that passed the server check can be submitted.</li>
          <li><b>Built vs proposed:</b> UI, checks, status timeline and the swappable adapter are built. Storage is a browser stand-in. The provider is simulated. The ERP link and tax authority are not built.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Rules panel</h2>
        <p className="text-sm text-zinc-600">
          Each rule is marked <b>sourced</b> (backed by a public source, but not yet confirmed against the official UAE FTA or Ministry of Finance text), <b>assumed</b> (invented for the demo) or <b>simulated</b> (a provider behaviour made up for the demo). Nothing here should be treated as official UAE guidance.
        </p>
        <div className="space-y-3">
          {RULES.map((r) => (
            <div key={r.id} className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{r.id}</span>
                <span className="text-sm font-medium">{r.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${BASIS[r.basis]}`}>{r.basis}</span>
                <span className="text-xs text-zinc-500">{r.layer}</span>
              </div>
              <p className="mt-1 text-sm">{r.detail}</p>
              <p className="mt-1 text-xs text-zinc-600">{r.note}{" "}
                {r.source && <a className="text-blue-700 underline" href={r.source.href} target="_blank" rel="noreferrer">{r.source.label}</a>}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
