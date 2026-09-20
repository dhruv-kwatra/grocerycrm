import { apiGet } from "@/lib/api/server";
import { Truck, Clock } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { guardRetail } from "@/lib/retail/guard";
import { dispatch, confirmDispatch } from "../supply/actions";

export const dynamic = "force-dynamic";

type ReqRow = { id: number; storeNodeId: number; storeName: string | null; skuId: number; skuName: string | null; qtyRequested: number; requestedAt: string | null };
type DeskRow = {
  storeNodeId: number; storeName: string; skuId: number; skuName: string | null; isFocus: boolean;
  onHand: number; lowThreshold: number; sellRate: number; daysCover: number | null; suggested: number;
  overstock: boolean; moveTo: { nodeId: number; name: string; qty: number } | null;
};
type Desk = {
  cutoff: { hour: number; minutesLeft: number };
  formula: string; windowDays: number;
  vanCapacity?: number; coverFullDays?: number;
  kpis: { stores: number; atRisk: number; atRiskFocus: number; fillRate: number | null; pendingOrders: number };
  rows: DeskRow[]; queue: ReqRow[];
};

// Days-cover, not unit counts: "2 units" means nothing without velocity. The
// cover bar is capped at the overstock line so the colour reads as a gauge.
// COVER_FULL and VAN_CAPACITY now arrive on the desk payload — the warehouse
// owns what a van holds, not this screen. Fallbacks keep the gauges drawable
// against a backend that predates the fields.
const COVER_FULL_FALLBACK = 14;
const VAN_CAPACITY_FALLBACK = 30;

function coverTone(days: number | null, overstock: boolean) {
  if (days == null) return "var(--faint)";
  if (overstock) return "var(--info, #2158c9)";
  return days < 3 ? "var(--error)" : days < 7 ? "var(--warning)" : "var(--success)";
}

// The distributor's dispatch desk — days-cover, suggested qty and the van.
export default async function DistributorPage() {
  // Non-distributors that land here (e.g. a stray link) go to their own home.
  await guardRetail(["distributor", "superadmin"]);

  const d = await apiGet<Desk>("/api/retail/supply/desk").catch(() => null);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl 2xl:max-w-[112rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Supply Desk</h1>
        <p className="text-[12px] text-[var(--faint)]">Plan tomorrow&apos;s dispatch — days of cover, suggested quantities and the van queue.</p>
      </div>
      {d ? <SupplyDesk d={d} /> : <Empty>The supply desk couldn&apos;t load.</Empty>}
    </div>
  );
}

function SupplyDesk({ d }: { d: Desk }) {
  const left = d.cutoff.minutesLeft;
  const cutoffLabel = left > 0
    ? `${Math.floor(left / 60)}h ${String(left % 60).padStart(2, "0")}m left`
    : "cutoff passed";
  const queueUnits = d.queue.reduce((n, r) => n + r.qtyRequested, 0);
  const stops = new Set(d.queue.map((r) => r.storeNodeId)).size;
  const vanCapacity = d.vanCapacity ?? VAN_CAPACITY_FALLBACK;
  const coverFull = d.coverFullDays ?? COVER_FULL_FALLBACK;
  const vanPct = Math.min(100, Math.round((queueUnits / vanCapacity) * 100));

  return (
    <div className="space-y-4">
      {/* The cutoff is the screen's clock — this job has a hard deadline. */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-[var(--muted)]">
          <b className="text-[var(--text)]">{d.kpis.stores}</b> stores supplied · sell rate over the last {d.windowDays} days
        </p>
        <span className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full tabular-nums ${
          left <= 0 ? "bg-[var(--error-bg,var(--surface-raised))] text-[var(--error)]"
            : left < 120 ? "bg-[var(--warning-bg)] text-[var(--warning)]"
            : "bg-[var(--success-bg)] text-[var(--success)]"}`}>
          <Clock size={13} /> Dispatch cutoff {d.cutoff.hour > 12 ? `${d.cutoff.hour - 12}:00 PM` : `${d.cutoff.hour}:00 AM`} · {cutoffLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DeskKpi label="Stores supplied" value={String(d.kpis.stores)} sub="in your territory" />
        <DeskKpi label={`Stockout risks < 3 days`} value={String(d.kpis.atRisk)} sub={`${d.kpis.atRiskFocus} on focus SKUs`} tone={d.kpis.atRisk > 0 ? "bad" : undefined} />
        <DeskKpi label="Fill rate · 30 days" value={d.kpis.fillRate == null ? "—" : `${d.kpis.fillRate}%`} sub="dispatched ÷ requested" tone={d.kpis.fillRate != null && d.kpis.fillRate < 90 ? "bad" : "good"} />
        <DeskKpi label="POs pending Grocery" value={String(d.kpis.pendingOrders)} sub={d.kpis.pendingOrders ? "awaiting fulfilment" : "nothing outstanding"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <div className="rlp-card rlp-card--flat overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <Th>Store · SKU</Th><Th right>On hand</Th><Th right>Sell rate</Th>
                  <Th>Days cover</Th><Th right>Suggested</Th><Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {d.rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-[var(--faint)]">No store stock to plan against yet.</td></tr>}
                {d.rows.map((r) => (
                  <tr key={`${r.storeNodeId}-${r.skuId}`} className="hover:bg-[var(--surface-raised)]">
                    <Td className="text-[var(--text)]">
                      <span className="font-semibold">{r.storeName} · {r.skuName ?? `SKU ${r.skuId}`}</span>
                      <span className="block text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide">
                        {r.isFocus ? "Focus SKU" : "Catalog"}{r.overstock ? " · overstock" : ""}
                      </span>
                    </Td>
                    <Td right className="tabular-nums">{r.onHand}</Td>
                    <Td right className="tabular-nums">{r.sellRate > 0 ? `${r.sellRate}/day` : "—"}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-2 font-bold tabular-nums" style={{ color: coverTone(r.daysCover, r.overstock) }}>
                        {r.daysCover == null ? "—" : `${r.daysCover}d`}
                        <span className="w-11 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, ((r.daysCover ?? 0) / coverFull) * 100)}%`, background: coverTone(r.daysCover, r.overstock) }} />
                        </span>
                      </span>
                    </Td>
                    <Td right className="tabular-nums font-bold text-[var(--text)]">
                      {r.moveTo
                        ? <span className="text-[var(--info,#2158c9)] font-bold">Move {r.moveTo.qty} → {r.moveTo.name}</span>
                        : r.suggested > 0 ? `${r.suggested} units` : "—"}
                    </Td>
                    <Td right>
                      {r.moveTo ? (
                        <span className="text-[11px] text-[var(--faint)]" title="Store-to-store transfers aren't wired yet — dispatch from your own stock instead.">Rebalance</span>
                      ) : r.suggested > 0 ? (
                        <ActionForm action={dispatch} success="Dispatched to the store" className="flex items-center gap-1.5 justify-end">
                          <input type="hidden" name="toNodeId" value={r.storeNodeId} />
                          <input type="hidden" name="skuId" value={r.skuId} />
                          <input name="qty" type="number" min="1" defaultValue={r.suggested} aria-label="Dispatch quantity"
                            className="w-14 px-1.5 py-1 text-xs border border-[var(--border-strong)] rounded-md bg-[var(--surface)] tabular-nums" />
                          <SubmitButton className="px-2.5 py-1.5 text-xs font-bold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)]">Add</SubmitButton>
                        </ActionForm>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[var(--faint)] px-3.5 py-2.5 border-t border-[var(--border)]">
            Suggested qty = {d.formula} · <b className="text-[var(--muted)]">no customer data or store margins at this tier</b>
          </p>
        </div>

        {/* Tomorrow's van — the open request queue, dispatched in one confirm. */}
        <aside className="rlp-card rlp-card--flat overflow-hidden">
          <div className="bg-[var(--text)] text-[var(--surface)] px-4 py-3">
            <p className="text-[13px] font-bold">Tomorrow&apos;s dispatch</p>
            <p className="text-[11px] opacity-70">{stops} store{stops === 1 ? "" : "s"} on the run · from your stock</p>
          </div>
          {d.queue.length === 0 ? (
            <p className="text-[13px] text-[var(--faint)] p-5 text-center">Queue is clear — nothing waiting on a van.</p>
          ) : (
            <>
              <div className="divide-y divide-[var(--border)]">
                {d.queue.map((q) => (
                  <div key={q.id} className="flex items-center gap-2 px-4 py-2 text-[12.5px]">
                    <span className="flex-1 min-w-0 truncate text-[var(--text)]">{q.storeName ?? `Store #${q.storeNodeId}`} · {q.skuName ?? `SKU ${q.skuId}`}</span>
                    <span className="font-bold tabular-nums">{q.qtyRequested}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-raised)] text-[12.5px] font-bold">
                <span>{d.queue.length} drop{d.queue.length === 1 ? "" : "s"} · {stops} store{stops === 1 ? "" : "s"}</span>
                <span className="tabular-nums">{queueUnits} units</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-[var(--muted)]">
                <span>Van capacity</span>
                <span className="flex-1 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                  <span className="block h-full rounded-full bg-[var(--success)]" style={{ width: `${vanPct}%` }} />
                </span>
                <span className="tabular-nums">{vanPct}%</span>
              </div>
              <div className="p-3 pt-0">
                <ActionForm action={confirmDispatch} success="Dispatch confirmed">
                  <SubmitButton className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">
                    <Truck size={14} /> Confirm dispatch · notify stores
                  </SubmitButton>
                </ActionForm>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function DeskKpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rlp-card p-3.5">
      <p className="text-[22px] font-bold text-[var(--text)] tabular-nums leading-none">{value}</p>
      <p className="text-[11.5px] text-[var(--muted)] mt-1.5">{label}</p>
      {sub && <p className={`text-[11px] font-semibold mt-1 ${tone === "bad" ? "text-[var(--error)]" : tone === "good" ? "text-[var(--success)]" : "text-[var(--faint)]"}`}>{sub}</p>}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>; }
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
