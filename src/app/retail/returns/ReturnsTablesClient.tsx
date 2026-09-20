"use client";

import { useState } from "react";
import { AlertTriangle, PackageX, RotateCcw, Search } from "lucide-react";

type Alert = { nodeId: number; storeName: string | null; skuId: number; skuName: string | null; skuCode: string | null; onHand: number; lowThreshold: number; out: boolean };
type Ret = { id: number; storeName: string | null; skuName: string | null; units: number; reason: string | null; condition: string; restocked: boolean; status: string; createdAt: string | null };

export function LowStockAlertsClient({ alerts }: { alerts: Alert[] }) {
  const [q, setQ] = useState("");

  const filtered = alerts.filter((a) => {
    const text = `${a.storeName ?? ""} ${a.skuName ?? ""} ${a.skuCode ?? ""}`;
    return !q || text.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--warning)]"><AlertTriangle size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Low-stock alerts{alerts.length ? ` (${alerts.length})` : ""}</h2>
        </div>

        <div className="relative w-36 sm:w-44">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search alert..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
      <div className="p-2 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-4 text-center">No alerts match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Store</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Product</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">On hand</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Threshold</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((a) => (
                <tr key={`${a.nodeId}-${a.skuId}`}>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{a.storeName}</td>
                  <td className="px-3 py-2.5 text-[var(--text)]">{a.skuName ?? a.skuCode}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${a.out ? "text-[var(--error)]" : "text-[var(--warning)]"}`}>{a.onHand}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--muted)]">{a.lowThreshold}</td>
                  <td className="px-3 py-2.5">
                    {a.out ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full bg-[var(--error-bg)] text-[var(--error)]"><PackageX size={11} /> Out</span>
                    ) : (
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">Low</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function ReturnsLogClient({ returns }: { returns: Ret[] }) {
  const [q, setQ] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("");

  const filtered = returns.filter((r) => {
    const text = `${r.storeName ?? ""} ${r.skuName ?? ""} ${r.reason ?? ""}`;
    const matchQ = !q || text.toLowerCase().includes(q.toLowerCase());
    const matchCondition = !conditionFilter || r.condition === conditionFilter;
    return matchQ && matchCondition;
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]"><RotateCcw size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Returns log</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-36 sm:w-44">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search returns..."
              className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {(["good", "damaged"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConditionFilter(conditionFilter === c ? "" : c)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors capitalize ${
                conditionFilter === c
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-4 text-center">No returns match that search.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Product</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Store</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Units</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Condition</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 text-[var(--text)]">{r.skuName}</td>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{r.storeName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--muted)]">{r.units}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full ${r.condition === "good" ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--error-bg)] text-[var(--error)]"}`}>{r.condition}{r.restocked ? " · restocked" : ""}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{r.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
