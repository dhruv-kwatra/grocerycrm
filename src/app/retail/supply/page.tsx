import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { Boxes, ClipboardList, Truck, Send } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { guardRetail } from "@/lib/retail/guard";
import { ListShell, type Insights } from "../_components/ListShell";
import { placeOrder, dispatch } from "./actions";
import { DistributorOrdersClient, ReplenishmentRequestsClient, ProductsStockClient } from "./SupplyTablesClient";
import { fmtDate } from "@/lib/retail/datetime";

export const dynamic = "force-dynamic";

const DIST_TABS = ["orders", "replenishment", "products"] as const;
type DistTab = (typeof DIST_TABS)[number];

type Product = { id: number; skuCode: string; name: string; category: string | null; isFocus: boolean; mrp: string | null };
type InvRow = { skuId: number; skuCode: string | null; skuName: string | null; isFocus: boolean; onHand: number; lowThreshold: number };
type OrderItem = { id: number; skuId: number; skuName: string | null; skuCode: string | null; qtyOrdered: number; qtyFulfilled: number; brandOnHand: number | null };
type Order = { id: number; distributorNodeId: number; status: string; note: string | null; placedAt: string | null; items: OrderItem[] };
type TreeNode = { id: number; nodeType: string; name: string };
type ReqRow = { id: number; storeNodeId: number; storeName: string | null; skuId: number; skuName: string | null; qtyRequested: number; requestedAt: string | null };

const STATUS_TONE: Record<string, string> = {
  placed: "bg-[var(--warning-bg)] text-[var(--warning)]",
  approved: "bg-[var(--info-bg)] text-[var(--info)]",
  fulfilled: "bg-[var(--success-bg)] text-[var(--success)]",
  rejected: "bg-[var(--error-bg)] text-[var(--error)]",
  cancelled: "bg-[var(--surface-raised)] text-[var(--muted)]",
};

export default async function SupplyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  // Distributor-only since the brand's half moved to /retail/brand-stock
  // ("Orders & Stock"). Everyone else is redirected to their own home, which
  // also stops the product catalog leaking to stores.
  await guardRetail(["distributor", "superadmin"]);
  const [{ products }, inv, { orders }, tree, { requests }] = await Promise.all([
    apiGet<{ products: Product[] }>("/api/retail/supply/products").catch(() => ({ products: [] as Product[] })),
    apiGet<{ nodeId: number | null; rows: InvRow[] }>("/api/retail/supply/inventory").catch(() => ({ nodeId: null, rows: [] as InvRow[] })),
    apiGet<{ orders: Order[] }>("/api/retail/supply/orders").catch(() => ({ orders: [] as Order[] })),
    apiGet<{ nodes: TreeNode[] }>("/api/retail/tree").catch(() => ({ nodes: [] as TreeNode[] })),
    apiGet<{ requests: ReqRow[] }>("/api/retail/supply/requests").catch(() => ({ requests: [] as ReqRow[] })),
  ]);
  const stores = tree.nodes.filter((n) => n.nodeType === "store");
  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";
  const skuOptions = products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isFocus ? " ★" : ""}</option>);
  const activeTab: DistTab = DIST_TABS.includes(tab as DistTab) ? (tab as DistTab) : "orders";

  const insights = await apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <ListShell insights={insights}>
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Products &amp; Supply</h1>
        <p className="text-[12px] text-[var(--faint)]">
          Order stock from Grocery, dispatch to your stores, and track your inventory.
        </p>
      </div>

      {/* Distributor: split Grocery orders, store replenishment, and products/stock
          into separate tabs (were one long mixed page). */}
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-2">
        <Tab href="/retail/supply?tab=orders" active={activeTab === "orders"} icon={<ClipboardList size={14} />}>Grocery Orders</Tab>
        <Tab href="/retail/supply?tab=replenishment" active={activeTab === "replenishment"} icon={<Truck size={14} />} badge={requests.length}>Replenishment</Tab>
        <Tab href="/retail/supply?tab=products" active={activeTab === "products"} icon={<Boxes size={14} />}>Products &amp; Stock</Tab>
      </div>

      {/* ── Distributor: place an order to Grocery ── */}
      {activeTab === "orders" && (
        <Section title="Order from Grocery" icon={<ClipboardList size={15} />}>
          {products.length === 0 ? <Empty>No products in the catalog yet.</Empty> : (
            <ActionForm action={placeOrder} success="Order placed" className="flex flex-wrap items-end gap-2">
              <label className="block flex-1 min-w-[180px]"><span className="text-[11px] text-[var(--faint)]">Product</span><select name="skuId" className={input} defaultValue={products[0]?.id}>{skuOptions}</select></label>
              <label className="block w-24"><span className="text-[11px] text-[var(--faint)]">Qty</span><input name="qty" type="number" min="1" defaultValue="10" className={`${input} tabular-nums`} /></label>
              <label className="block flex-1 min-w-[160px]"><span className="text-[11px] text-[var(--faint)]">Note</span><input name="note" className={input} placeholder="optional" /></label>
              <SubmitButton className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Place order</SubmitButton>
            </ActionForm>
          )}
        </Section>
      )}

      {/* ── Orders (brand: incoming to fulfil; distributor: own Grocery orders) ── */}
      {activeTab === "orders" && (
        <DistributorOrdersClient orders={orders} />
      )}

      {/* ── Distributor: store replenishment requests (manager → distributor loop) ── */}
      {activeTab === "replenishment" && (
        <ReplenishmentRequestsClient requests={requests} />
      )}

      {/* ── Distributor: dispatch to a store ── */}
      {activeTab === "products" && (
        <Section title="Dispatch to a store" icon={<Send size={15} />}>
          {stores.length === 0 ? <Empty>No stores in your territory yet — onboard one under Users → Companies &amp; Stores.</Empty> : (
            <ActionForm action={dispatch} success="Dispatched to the store" className="flex flex-wrap items-end gap-2">
              <label className="block flex-1 min-w-[160px]"><span className="text-[11px] text-[var(--faint)]">Store</span><select name="toNodeId" className={input} defaultValue={stores[0]?.id}>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label className="block flex-1 min-w-[160px]"><span className="text-[11px] text-[var(--faint)]">Product</span><select name="skuId" className={input} defaultValue={products[0]?.id}>{skuOptions}</select></label>
              <label className="block w-24"><span className="text-[11px] text-[var(--faint)]">Qty</span><input name="qty" type="number" min="1" defaultValue="5" className={`${input} tabular-nums`} /></label>
              <SubmitButton className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Dispatch</SubmitButton>
            </ActionForm>
          )}
        </Section>
      )}

      {/* ── Inventory (own node) — distributor (products tab) / store stock. ── */}
      {activeTab === "products" && (
        <ProductsStockClient products={products} onHandBySku={Object.fromEntries(inv.rows.map((r) => [r.skuId, r.onHand]))} />
      )}
      </ListShell>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2"><span className="text-[var(--accent)]">{icon}</span><h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2></div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  );
}
function Tab({ href, active, icon, badge, children }: { href: string; active: boolean; icon: React.ReactNode; badge?: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg ${
        active ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-raised)]"
      }`}
    >
      {icon}{children}
      {badge ? <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-[var(--warning-bg)] text-[var(--warning)]"}`}>{badge}</span> : null}
    </Link>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>; }
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
