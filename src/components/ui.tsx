import type { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  checked: "bg-sky-100 text-sky-800",
  blocked: "bg-red-100 text-red-800",
  submitted: "bg-violet-100 text-violet-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-orange-100 text-orange-900",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}

export const btn =
  "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
export const btnPrimary = `${btn} bg-zinc-900 text-white hover:bg-zinc-700`;
export const btnGhost = `${btn} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50`;
export const card = "rounded-lg border border-zinc-200 bg-white p-4 shadow-sm";
