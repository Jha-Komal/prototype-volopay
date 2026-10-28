import type { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  checked: "bg-sky-50 text-sky-800 ring-sky-200",
  blocked: "bg-red-50 text-red-800 ring-red-200",
  submitted: "bg-violet-50 text-violet-800 ring-violet-200",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-orange-50 text-orange-900 ring-orange-200",
};
const DOTS: Record<Status, string> = {
  draft: "bg-slate-400", checked: "bg-sky-500", blocked: "bg-red-500",
  submitted: "bg-violet-500 animate-pulse", accepted: "bg-emerald-500", rejected: "bg-orange-500",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  );
}

export function SimTag({ children = "Simulated" }: { children?: React.ReactNode }) {
  return (
    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
      {children}
    </span>
  );
}

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
export const btn = `inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;
export const btnPrimary = `${btn} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700`;
export const btnGhost = `${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`;
export const btnDanger = `${btn} border border-red-300 bg-white text-red-700 hover:bg-red-50`;
export const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
export const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

const STEPS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "checked", label: "Checked" },
  { key: "submitted", label: "Submitted" },
  { key: "final", label: "Result" },
];

/** Progress through the status model. `blocked` and `rejected` mark the failing step. */
export function Stepper({ status }: { status: Status }) {
  const idx = { draft: 0, blocked: 1, checked: 1, submitted: 2, accepted: 3, rejected: 3 }[status];
  const failed = status === "blocked" || status === "rejected";
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = i < idx || (i === idx && status === "accepted");
        const current = i === idx;
        const bad = current && failed;
        const label = s.key === "final" ? (status === "rejected" ? "Rejected" : "Accepted") : s.key === "checked" && status === "blocked" ? "Blocked" : s.label;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                bad ? "bg-red-600 text-white" : done ? "bg-emerald-600 text-white" : current ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {bad ? "!" : done ? "✓" : i + 1}
            </span>
            <span className={`text-xs font-medium ${current ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < idx ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
