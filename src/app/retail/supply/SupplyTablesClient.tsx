"use client";

import { useState } from "react";
import { Truck, Search, Boxes, Send } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { dispatch } from "./actions";
import { fmtDate } from "@/lib/retail/datetime";

type OrderItem = { id: number; skuId: number; skuName: string | null; skuCode: string | null; qtyOrdered: number; qtyFulfilled: number; brandOnHand: number | null };
type Order = { id: number; distributorNodeId: number; status: string; note: string | null; placedAt: string | null; items: OrderItem[] };
type ReqRow = { id: number; storeNodeId: number; storeName: string | null; skuId: number; skuName: string | null; qtyRequested: number; requestedAt: string | null };
type Product = { id: number; skuCode: string; name: string; category: string | null; isFocus: boolean; mrp: string | null };

const STATUS_TONE: Record<string, string> = {
  placed: "bg-[var(--warning-bg)] text-[var(--warning)]",
  approved: "bg-[var(--info-bg)] text-[var(--info)]",
  fulfilled: "bg-[var(--success-bg)] text-[var(--success)]",
  rejected: "bg-[var(--error-bg)] text-[var(--error)]",
  cancelled: "bg-[var(--surface-raised)] text-[var(--muted)]",
};

export function DistributorOrdersClient({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState("");

  const filtered = orders.filter((o) => {
    const text = `Order #${o.id} ${o.status} ${o.note ?? ""} ${o.items.map((i) => i.skuName ?? i.skuCode).join(" ")}`;
    return !q || text.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]"><Truck size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">My orders to Grocery</h2>
        </div>

        <div className="relative w-36 sm:w-44">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-4 text-center">No orders match that search.</p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((o) => (
              <div key={o.id} className="border border-[var(--border)] rounded-lg p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-[var(--text)]">Order #{o.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_TONE[o.status] ?? ""}`}>{o.status}</span>
                  {o.note && <span className="text-[11px] text-[var(--faint)]">· {o.note}</span>}
                </div>
                <ul className="text-[13px] text-[var(--muted)] space-y-1">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{it.skuName ?? it.skuCode ?? `SKU ${it.skuId}`} × <span className="tabular-nums font-medium text-[var(--text)]">{it.qtyOrdered}</span>{it.qtyFulfilled ? ` (fulfilled ${it.qtyFulfilled})` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReplenishmentRequestsClient({
  requests,
}: {
  requests: ReqRow[];
}) {
  const [q, setQ] = useState("");

  const filtered = requests.filter((r) => {
    const text = `${r.storeName ?? ""} ${r.skuName ?? ""}`;
    return !q || text.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]"><Truck size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Store replenishment requests</h2>
        </div>

        <div className="relative w-36 sm:w-44">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search request..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-4 text-center">No requests match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Requested</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Store</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Product</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Qty</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 text-[var(--muted)] whitespace-nowrap">{fmtDate(r.requestedAt)}</td>
                  <td className="px-3 py-2.5 text-[var(--text)] font-medium">{r.storeName}</td>
                  <td className="px-3 py-2.5 text-[var(--text)]">{r.skuName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{r.qtyRequested}</td>
                  <td className="px-3 py-2.5 text-right">
                    <ActionForm action={dispatch} success="Dispatched to the store" className="flex items-center justify-end gap-2">
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="toNodeId" value={r.storeNodeId} />
                      <input type="hidden" name="skuId" value={r.skuId} />
                      <input name="qty" type="number" min="1" defaultValue={r.qtyRequested} className="px-2 py-1 text-sm border border-[var(--border-strong)] rounded-md bg-[var(--surface)] w-20 tabular-nums" />
                      <SubmitButton className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)]"><Send size={13} /> Dispatch</SubmitButton>
                    </ActionForm>
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

export function ProductsStockClient({
  products,
  onHandBySku,
}: {
  products: Product[];
  onHandBySku: Record<number, number>;
}) {
  const [q, setQ] = useState("");

  const filtered = products.filter((p) => {
    const text = `${p.name} ${p.skuCode} ${p.category ?? ""}`;
    return !q || text.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]"><Boxes size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Products &amp; Stock</h2>
        </div>

        <div className="relative w-36 sm:w-44">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stock..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-4 text-center">No products match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Product</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">SKU</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Category</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Distributor Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((p) => {
                const stock = onHandBySku[p.id] ?? 0;
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2.5 text-[var(--text)] font-medium">{p.name}</td>
                    <td className="px-3 py-2.5 text-[var(--muted)] tabular-nums">{p.skuCode}</td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{p.category ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{stock} units</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
