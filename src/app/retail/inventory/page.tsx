import { apiGet } from "@/lib/api/server";
import { Package, Truck, PlusCircle, PackagePlus, Check, AlertTriangle } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { receiveDelivery, addStock, addItem, replenish } from "./actions";
import { InboundShipmentsClient, StoreInventoryClient } from "./InventoryTablesClient";
import { InfoHint } from "../_components/InfoHint";
import { fmtDate } from "@/lib/retail/datetime";
import { ModalButton } from "../_components/ModalButton";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Inbound = { id: number; skuId: number; skuCode: string | null; skuName: string | null; qty: number; dispatchedAt: string | null; receivedAt: string | null };
type StockRow = { id: number; skuId: number; skuCode: string | null; skuName: string | null; isFocus?: boolean; onHand: number; lowThreshold: number; low: boolean };
type Product = { id: number; name: string; skuCode: string };

const dateLabel = (s: string | null) => fmtDate(s);

export default async function InventoryPage() {
  await guardRetail(["store_manager", "distributor", "superadmin"]);
  const [{ inbound }, { rows }, { products }] = await Promise.all([
    apiGet<{ inbound: Inbound[] }>("/api/retail/supply/inbound").catch(() => ({ inbound: [] as Inbound[] })),
    apiGet<{ rows: StockRow[] }>("/api/retail/manager/stock").catch(() => ({ rows: [] as StockRow[] })),
    apiGet<{ products: Product[] }>("/api/retail/supply/products").catch(() => ({ products: [] as Product[] })),
  ]);

  const pending = inbound.filter((d) => !d.receivedAt);
  // The prototype's summary bar. Every number is counted off data this page
  // already has, so it costs no extra call.
  const pendingUnits = pending.reduce((n, d) => n + (d.qty ?? 0), 0);
  const focusCount = rows.filter((r) => r.isFocus).length;
  const lowCount = rows.filter((r) => r.low).length;
  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">
            Inventory &amp; Stock Management <InfoHint text="Receive inbound stock from your distributor, add stock you receive off-system (Grocery or bought elsewhere), track on-hand, and request replenishment for low SKUs." className="align-middle" />
          </h1>
          <p className="text-[13px] text-[var(--muted)]">Track stock levels, inbound deliveries, and register off-system store catalog items</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModalButton label="Add catalog stock" title="Add stock (catalog item)" icon={<PlusCircle size={15} />} variant="primary">
            <p className="text-[12px] text-[var(--faint)] mb-3">Add on-hand for a Grocery / catalog product received off-system.</p>
            <ActionForm action={addStock} success="Stock added" className="space-y-2.5">
              <select name="skuId" className={input} defaultValue={products[0]?.id} aria-label="Product">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label className="block">
                <span className="text-[11px] text-[var(--faint)]">Quantity</span>
                <input name="qty" type="number" min="1" defaultValue="1" className={`${input} tabular-nums`} />
              </label>
              <SubmitButton className="w-full px-4 py-2 text-sm font-semibold bg-[var(--success)] text-white rounded-lg hover:brightness-110">Add stock</SubmitButton>
            </ActionForm>
          </ModalButton>

          <ModalButton label="Add other item" title="Add other item" icon={<PackagePlus size={15} />} variant="ghost">
            <p className="text-[12px] text-[var(--faint)] mb-3">An item bought from another source (not in the Grocery catalog).</p>
            <ActionForm action={addItem} success="Item added to inventory" className="space-y-2.5">
              <input name="name" required placeholder="Item name" className={input} />
              <div className="flex gap-2">
                <input name="skuCode" placeholder="Code (optional)" className={input} />
                <input name="mrp" type="number" min="0" step="0.01" placeholder="MRP (optional)" className={`${input} tabular-nums`} />
              </div>
              <label className="block">
                <span className="text-[11px] text-[var(--faint)]">Quantity</span>
                <input name="qty" type="number" min="0" defaultValue="1" className={`${input} tabular-nums`} />
              </label>
              <SubmitButton className="w-full px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:brightness-110">Add item</SubmitButton>
            </ActionForm>
          </ModalButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={<Package size={16} />} tone="var(--secondary)" label="Catalog lines"
          value={`${rows.length} SKU${rows.length === 1 ? "" : "s"}`}
          sub={focusCount > 0 ? `${focusCount} focus model${focusCount === 1 ? "" : "s"}` : "No focus models set"} />
        <Kpi icon={<Truck size={16} />} tone="var(--warning)" label="Inbound transits"
          value={`${pending.length} shipment${pending.length === 1 ? "" : "s"}`}
          sub={pending.length ? `${pendingUnits} unit${pendingUnits === 1 ? "" : "s"} pending` : "Nothing in transit"} />
        <Kpi icon={<AlertTriangle size={16} />} tone="var(--error)" label="Low stock alerts"
          value={`${lowCount} item${lowCount === 1 ? "" : "s"}`}
          sub={lowCount ? "Needs replenishment" : "All above threshold"} />
      </div>

      {/* Inbound deliveries */}
      <InboundShipmentsClient inbound={inbound} />

      {/* Stock & replenishment */}
      <StoreInventoryClient rows={rows} />
    </div>
  );
}

function Card({ title, icon, sub, children }: { title: string; icon: React.ReactNode; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>
        {sub && <span className="text-[11px] text-[var(--faint)] ml-auto">{sub}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
// Summary tile — same reading order as the KPI tiles on the other boards.
function Kpi({ icon, tone, label, value, sub }: { icon: React.ReactNode; tone: string; label: string; value: string; sub: string }) {
  return (
    <div className="rlp-card p-4">
      <div className="flex items-center justify-between">
        <p className="rlp-stat-label text-[9.5px]">{label}</p>
        <span style={{ color: tone }}>{icon}</span>
      </div>
      <p className="rlp-stat-value text-[1.4rem] mt-1.5">{value}</p>
      <p className="text-[11.5px] text-[var(--muted)] mt-0.5">{sub}</p>
    </div>
  );
}
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>;
}
