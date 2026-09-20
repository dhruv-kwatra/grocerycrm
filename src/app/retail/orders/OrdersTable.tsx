"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText, X } from "lucide-react";
import { StatusSelect, STATUSES } from "./StatusSelect";
import { bulkUpdateOrderStatus } from "./actions";
import { notify } from "@/lib/toast";
import { fmtDate } from "@/lib/retail/datetime";

export type Order = {
  id: number;
  soldAt: string | null;
  units: number;
  revenue: string | null;
  paymentMethod: string | null;
  orderStatus: string;
  customerName: string | null;
  customerPhone: string | null;
  productName: string | null;
  agentName: string | null;
};

const inr = (v: string | null) =>
  v == null ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const PAY_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", emi: "EMI" };
const payLabel = (p: string | null) => (p ? PAY_LABEL[p] ?? p : "—");
const dateLabel = (s: string | null) => fmtDate(s);

// Owns row selection so the manager can move several orders at once. Selection
// is per-page on purpose: the checkbox in the header selects what you can see,
// which is what "select all" means to someone looking at a paginated table.
export function OrdersTable({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<string>("confirmed");
  const [pending, start] = useTransition();
  const router = useRouter();

  const th = "text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)] px-3 py-2";
  const td = "px-3 py-2.5 text-sm text-[var(--text)] align-middle";

  const allOnPage = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(orders.map((o) => o.id)));
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const apply = () =>
    start(async () => {
      const res = await bulkUpdateOrderStatus([...selected], status);
      if (res.ok) {
        notify.success(`${res.count} order${res.count === 1 ? "" : "s"} moved to ${status}`);
        setSelected(new Set());
        router.refresh();
      } else {
        notify.error(res.error);
      }
    });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-[var(--shadow-card)]">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          <span className="text-[12px] font-medium text-[var(--text)]">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X size={12} /> Clear
          </button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-[11px] text-[var(--faint)]">Move to</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-[12px] px-2 py-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] capitalize"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              type="button"
              onClick={apply}
              disabled={pending}
              className="px-3 py-1.5 text-[12px] font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              {pending ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className={`${th} w-9`}>
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={toggleAll}
                  aria-label="Select all orders on this page"
                  className="align-middle accent-[var(--accent)]"
                />
              </th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={th}>Product</th>
              <th className={`${th} text-right`}>Bill amount</th>
              <th className={th}>Payment</th>
              <th className={th}>Floor agent</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-sm text-[var(--faint)]">
                  <ReceiptText size={22} className="mx-auto mb-2 opacity-50" />
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-raised)] ${selected.has(o.id) ? "bg-[var(--surface-raised)]" : ""}`}
                >
                  <td className={td}>
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      aria-label={`Select order ${o.id}`}
                      className="align-middle accent-[var(--accent)]"
                    />
                  </td>
                  <td className={`${td} whitespace-nowrap text-[var(--muted)]`}>{dateLabel(o.soldAt)}</td>
                  <td className={td}>
                    <div className="font-medium">{o.customerName ?? "Walk-in"}</div>
                    {o.customerPhone && <div className="text-[11px] text-[var(--faint)]">{o.customerPhone}</div>}
                  </td>
                  <td className={td}>
                    {o.productName ?? "—"}
                    {o.units > 1 && <span className="text-[11px] text-[var(--faint)]"> ×{o.units}</span>}
                  </td>
                  <td className={`${td} text-right tabular-nums font-medium`}>{inr(o.revenue)}</td>
                  <td className={`${td} text-[var(--muted)]`}>{payLabel(o.paymentMethod)}</td>
                  <td className={`${td} text-[var(--muted)]`}>{o.agentName ?? "—"}</td>
                  <td className={td}><StatusSelect id={o.id} value={o.orderStatus} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
