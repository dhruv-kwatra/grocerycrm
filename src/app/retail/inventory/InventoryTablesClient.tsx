"use client";

import { useState } from "react";
import { Truck, Package, Check, AlertTriangle, Search } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { receiveDelivery, replenish } from "./actions";
import { fmtDate } from "@/lib/retail/datetime";

type Inbound = { id: number; skuId: number; skuCode: string | null; skuName: string | null; qty: number; dispatchedAt: string | null; receivedAt: string | null };
type StockRow = { id: number; skuId: number; skuCode: string | null; skuName: string | null; isFocus?: boolean; onHand: number; lowThreshold: number; low: boolean };

export function InboundShipmentsClient({
  inbound,
}: {
  inbound: Inbound[];
}) {
  const [q, setQ] = useState("");

  const filtered = inbound.filter((d) => {
    const name = d.skuName ?? d.skuCode ?? `SKU #${d.skuId}`;
    return !q || name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <Card
      title="Inbound distributor shipments"
      icon={<Truck size={15} />}
      sub={`${inbound.filter((d) => !d.receivedAt).length} awaiting receipt`}
      searchSlot={
        <div className="relative w-36 sm:w-44">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shipment..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <Th>Dispatched</Th><Th>Product</Th><Th right>Qty</Th><Th>Status</Th><Th right></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[var(--faint)]">No shipments match.</td></tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className="hover:bg-[var(--surface-raised)]">
                <Td className="text-[var(--muted)] whitespace-nowrap">{fmtDate(d.dispatchedAt)}</Td>
                <Td className="text-[var(--text)]">{d.skuName ?? d.skuCode ?? `SKU #${d.skuId}`}</Td>
                <Td right className="tabular-nums text-[var(--text)] font-medium">{d.qty} units</Td>
                <Td>
                  {d.receivedAt
                    ? <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[var(--success-bg)] text-[var(--success)]">Received</span>
                    : <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[var(--warning-bg)] text-[var(--warning)]">In transit</span>}
                </Td>
                <Td right>
                  {d.receivedAt ? (
                    <Check size={15} className="text-[var(--success)] inline" />
                  ) : (
                    <ActionForm action={receiveDelivery.bind(null, d.id)} success="Delivery received">
                      <SubmitButton className="text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30 hover:brightness-125">
                        Receive shipment
                      </SubmitButton>
                    </ActionForm>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function StoreInventoryClient({
  rows,
}: {
  rows: StockRow[];
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "focus">("all");

  const filtered = rows.filter((r) => {
    const name = r.skuName ?? r.skuCode ?? `SKU #${r.skuId}`;
    const matchQ = !q || name.toLowerCase().includes(q.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "low" && r.low) ||
      (statusFilter === "focus" && r.isFocus);
    return matchQ && matchStatus;
  });

  return (
    <Card
      title="On-hand store inventory catalog"
      icon={<Package size={15} />}
      sub={`${rows.length} SKU${rows.length === 1 ? "" : "s"} on hand`}
      searchSlot={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-36 sm:w-44">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKU..."
              className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {(["all", "low", "focus"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(statusFilter === f ? "all" : f)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors capitalize ${
                statusFilter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <Th>SKU</Th><Th right>On hand</Th><Th right>Threshold</Th><Th>Status</Th><Th right>Replenish</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[var(--faint)]">No inventory matches.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--surface-raised)]">
                <Td className="text-[var(--text)] whitespace-nowrap">
                  {r.skuName ?? r.skuCode ?? `SKU #${r.skuId}`}
                  {r.isFocus && <span className="ml-2 whitespace-nowrap text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-lg bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/25">Focus model</span>}
                </Td>
                <Td right className={`tabular-nums font-semibold ${r.low ? "text-[var(--error)]" : "text-[var(--text)]"}`}>{r.onHand} units</Td>
                <Td right className="tabular-nums text-[var(--muted)]">{r.lowThreshold} units</Td>
                <Td>{r.low
                  ? <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[var(--error-bg)] text-[var(--error)]"><AlertTriangle size={11} /> Low stock</span>
                  : <span className="whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[var(--success-bg)] text-[var(--success)]">Stock OK</span>}</Td>
                <Td right>
                  <ActionForm action={replenish.bind(null, r.skuId)} success="Replenishment requested" className="flex items-center gap-1.5 justify-end">
                    <input
                      name="qty"
                      type="number"
                      min="1"
                      defaultValue={Math.max(1, r.lowThreshold - r.onHand)}
                      aria-label="Replenish quantity"
                      className="px-2.5 py-1.5 text-sm border border-[var(--border-strong)] rounded-md bg-[var(--surface)] w-20 tabular-nums"
                    />
                    <SubmitButton className="px-4 py-1.5 text-xs font-semibold bg-[image:var(--accent-grad)] text-white rounded-full shadow-[var(--accent-glow)]">
                      Request
                    </SubmitButton>
                  </ActionForm>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Card({ title, icon, sub, searchSlot, children }: { title: string; icon: React.ReactNode; sub?: string; searchSlot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]">{icon}</span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>
          {sub && <span className="text-[11px] text-[var(--faint)]">{sub}</span>}
        </div>
        {searchSlot}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>;
}
