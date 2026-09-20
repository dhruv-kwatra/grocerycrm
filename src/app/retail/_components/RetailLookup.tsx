"use client";

import { useRef, useState, useTransition } from "react";
import { Search, User, Package, IndianRupee, Clock, ChevronDown, PackageX, Loader2 } from "lucide-react";
import { findCustomers, getCustomer, findStock, type CustomerHit, type CustomerDetail, type StockHit } from "./lookup-actions";
import { fmtDateFull } from "@/lib/retail/datetime";

const inr = (n: number | string) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmt = (s: string | null) => fmtDateFull(s);
const SEG: Record<string, string> = { loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant" };
const input = "px-3 py-1.5 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] max-w-[240px] w-full";

// Customer search + purchase history — subtree-scoped to the caller.
export function CustomerLookup() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CustomerHit[] | null>(null);
  const [open, setOpen] = useState<CustomerDetail | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const search = () => { if (q.trim().length < 2) return; setOpen(null); setOpenId(null); start(async () => setHits(await findCustomers(q.trim()))); };
  const expand = (id: number) => { if (openId === id) { setOpenId(null); setOpen(null); return; } setOpenId(id); start(async () => setOpen(await getCustomer(id))); };

  return (
    <div className="space-y-2.5">
      <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone…" className={input} />
        <button type="submit" disabled={pending} className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)] disabled:opacity-60">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Find
        </button>
      </form>

      {hits && hits.length === 0 && <p className="text-sm text-[var(--faint)] py-2 text-center">No customers match “{q}”.</p>}
      {hits && hits.map((c) => (
        <div key={c.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
          <button onClick={() => expand(c.id)} className="w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-[var(--surface-2)]">
            <span className="w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center shrink-0"><User size={15} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-[var(--text)] truncate">{c.name ?? "Customer"}{c.phone ? <span className="text-[var(--faint)] font-normal"> · {c.phone}</span> : ""}</p>
              <p className="text-[11px] text-[var(--faint)]">{c.segment ? `${SEG[c.segment] ?? c.segment} · ` : ""}{inr(c.totalSpend)} lifetime · {c.visits} purchase{c.visits === 1 ? "" : "s"}</p>
            </div>
            <ChevronDown size={15} className={`text-[var(--faint)] shrink-0 transition-transform ${openId === c.id ? "rotate-180" : ""}`} />
          </button>
          {openId === c.id && (
            <div className="border-t border-[var(--border)] p-2.5 bg-[var(--surface-2)]">
              {pending && !open ? <p className="text-[12px] text-[var(--faint)] text-center py-1">Loading…</p> : open && open.customer.id === c.id ? (
                open.history.length === 0 ? <p className="text-[12px] text-[var(--faint)] text-center py-1">No purchases yet.</p> : (
                  <ul className="space-y-1">
                    {open.history.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 text-[12.5px]">
                        <Clock size={12} className="text-[var(--faint)] shrink-0" />
                        <span className="text-[var(--text)] truncate flex-1">{h.skuName ?? "Item"} × {h.units}{h.billNo ? <span className="text-[var(--faint)]"> · {h.billNo}</span> : ""}</span>
                        <span className="text-[var(--muted)] tabular-nums">{inr(h.revenue ?? 0)}</span>
                        <span className="text-[10.5px] text-[var(--faint)] w-16 text-right">{fmt(h.soldAt)}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Real-time stock lookup across the caller's subtree.
// `initial` is the shelf the page already fetched server-side, so the list is
// populated on arrival — typing filters it instead of the agent having to ask
// for it first.
export function StockLookup({ initial }: { initial?: StockHit[] }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<StockHit[] | null>(initial ?? null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = (term = q) => start(async () => setRows(await findStock(term.trim())));

  // Filter as they type — one server round trip 300ms after they stop, so the
  // whole catalog stays searchable without shipping it to the phone.
  const onType = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 300);
  };

  return (
    <div className="space-y-2.5">
      <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex gap-2">
        <input value={q} onChange={(e) => onType(e.target.value)} placeholder="Filter by product name or SKU…" className={input} />
        <button type="submit" disabled={pending} className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)] disabled:opacity-60">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />} Check
        </button>
      </form>

      {rows && rows.length === 0 && <p className="text-sm text-[var(--faint)] py-2 text-center">No stock found. Try a different term.</p>}
      {rows && rows.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
          {rows.map((r) => {
            const low = r.onHand <= r.lowThreshold;
            return (
              <div key={`${r.nodeId}-${r.skuId}`} className="flex items-center gap-2.5 p-2.5">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.onHand <= 0 ? "bg-[var(--error-bg)] text-[var(--error)]" : "bg-[var(--accent-light)] text-[var(--accent-dark)]"}`}>{r.onHand <= 0 ? <PackageX size={15} /> : <Package size={15} />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-[var(--text)] truncate">{r.skuName ?? r.skuCode}</p>
                  <p className="text-[11px] text-[var(--faint)]">{r.storeName ?? `Store #${r.nodeId}`}{r.skuCode ? ` · ${r.skuCode}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[15px] font-bold tabular-nums ${r.onHand <= 0 ? "text-[var(--error)]" : low ? "text-[var(--warning)]" : "text-[var(--text)]"}`}>{r.onHand}</p>
                  <p className="text-[10px] text-[var(--faint)]">on hand</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
