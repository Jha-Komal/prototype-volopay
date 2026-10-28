"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Invoices (send)" },
  { href: "/incoming", label: "Incoming (receive)" },
  { href: "/import", label: "Import CSV" },
  { href: "/rules", label: "Rules & architecture" },
];

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" || path.startsWith("/invoices") : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
