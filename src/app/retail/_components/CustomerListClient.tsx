"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, LayoutList, LayoutGrid, ChevronRight, Users } from "lucide-react";

// One shared, client-filtered customer list for both the brand (/retail/customers)
// and agent (/retail/agent/customers) screens. Each page normalises its own rows
// into CustomerRow — the numeric columns become `stats`, so the same table + grid
// render whatever facts that screen tracks (orders/spend vs qty/demos/…).
export type Stat = { label: string; value: string; strong?: boolean };
export type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  sub: string | null; // store name, extra context under the name
  segment: string | null;
  stats: Stat[];
  href: string | null; // detail link, or null when the screen has no 360 view
};

const SEG_LABEL: Record<string, string> = {
  all: "All", loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant",
};
const SEG_TONE: Record<string, string> = {
  loyal: "bg-[var(--success-bg)] text-[var(--success)]",
  high_value: "bg-[var(--accent-light)] text-[var(--accent-dark)]",
  regular: "bg-[var(--surface-raised)] text-[var(--muted)]",
  new: "bg-[var(--info-bg)] text-[var(--info)]",
  at_risk: "bg-[var(--warning-bg)] text-[var(--warning)]",
  dormant: "bg-[var(--surface-raised)] text-[var(--faint)]",
};
const AVATAR = ["#2158c9", "#0e8a6d", "#b26a00", "#7c3aed", "#c2170f", "#0891b2"];
const initials = (name: string) =>
  name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const PAGE_SIZE = 20;
const SEG_ORDER = ["loyal", "high_value", "regular", "new", "at_risk", "dormant"];

export function CustomerListClient({ rows }: { rows: CustomerRow[] }) {
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);

  // Only offer segment pills that actually occur, in a stable order.
  const segments = useMemo(() => {
    const present = new Set(rows.map((r) => r.segment).filter(Boolean) as string[]);
    return ["all", ...SEG_ORDER.filter((s) => present.has(s))];
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (segment !== "all" && r.segment !== segment) return false;
      if (!term) return true;
      return `${r.name} ${r.phone ?? ""} ${r.sub ?? ""}`.toLowerCase().includes(term);
    });
  }, [rows, q, segment]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);
  const cols = rows[0]?.stats.map((s) => s.label) ?? [];

  // Any control change resets to page 1.
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Controls: search · segment pills · view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="relative w-48 sm:w-56 shrink-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => reset(setQ)(e.target.value)}
              placeholder="Search customer..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {segments.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => reset(setSegment)(s)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                segment === s ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {SEG_LABEL[s] ?? s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[var(--faint)] tabular-nums">{total} customer{total === 1 ? "" : "s"}</span>
            <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
              {(["table", "grid"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={v === "table" ? "List view" : "Grid view"}
                  className={`p-1.5 rounded-md ${view === v ? "bg-[var(--surface-raised)] text-[var(--text)]" : "text-[var(--faint)]"}`}
                >
                  {v === "table" ? <LayoutList size={15} /> : <LayoutGrid size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>

      {total === 0 ? (
        <div className="rlp-card py-12 text-center">
          <Users size={26} className="mx-auto text-[var(--faint)]" />
          <p className="mt-2 text-sm text-[var(--faint)]">No customers match.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {pageRows.map((c) => (
            <CardOrLink key={c.id} href={c.href} className="border border-[var(--border)] rounded-xl p-3.5 bg-[var(--surface)] hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0" style={{ background: AVATAR[c.id % AVATAR.length] }}>
                  {initials(c.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{c.name}</p>
                  {c.phone && <p className="text-[11px] text-[var(--faint)] truncate">{c.phone}</p>}
                </div>
              </div>
              {c.segment && (
                <span className={`inline-block mt-2 text-[10.5px] px-2 py-0.5 rounded-full font-medium ${SEG_TONE[c.segment] ?? ""}`}>{SEG_LABEL[c.segment] ?? c.segment}</span>
              )}
              <dl className="mt-2.5 grid grid-cols-2 gap-1.5">
                {c.stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-[10px] uppercase tracking-wide text-[var(--faint)]">{s.label}</dt>
                    <dd className={`text-[12.5px] tabular-nums ${s.strong ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"}`}>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </CardOrLink>
          ))}
        </div>
      ) : (
        <div className="rlp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <Th>Customer</Th>
                <Th>Segment</Th>
                {cols.map((c) => <Th key={c} right>{c}</Th>)}
                {rows[0]?.href != null && <Th />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {pageRows.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-raised)]">
                  <Td>
                    <RowName c={c} />
                  </Td>
                  <Td>
                    {c.segment
                      ? <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium ${SEG_TONE[c.segment] ?? ""}`}>{SEG_LABEL[c.segment] ?? c.segment}</span>
                      : <span className="text-[var(--faint)]">—</span>}
                  </Td>
                  {c.stats.map((s) => (
                    <Td key={s.label} right className={`tabular-nums ${s.strong ? "font-medium text-[var(--text)]" : ""}`}>{s.value}</Td>
                  ))}
                  {c.href != null && (
                    <Td right><Link href={c.href} className="text-[var(--faint)] hover:text-[var(--accent)]"><ChevronRight size={16} /></Link></Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--faint)] tabular-nums">Page {current} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <PageBtn onClick={() => setPage(current - 1)} disabled={current === 1}>Previous</PageBtn>
            <PageBtn onClick={() => setPage(current + 1)} disabled={current === totalPages}>Next</PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function RowName({ c }: { c: CustomerRow }) {
  const body = (
    <>
      <span className="text-[var(--text)] font-medium">{c.name}</span>
      {(c.phone || c.sub) && <span className="block text-[11px] text-[var(--faint)]">{[c.phone, c.sub].filter(Boolean).join(" · ")}</span>}
    </>
  );
  return c.href ? <Link href={c.href} className="block">{body}</Link> : <div>{body}</div>;
}

function CardOrLink({ href, className, children }: { href: string | null; className: string; children: React.ReactNode }) {
  return href ? <Link href={href} className={className}>{children}</Link> : <div className={className}>{children}</div>;
}

function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>;
}
