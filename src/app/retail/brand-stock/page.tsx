import { apiGet } from "@/lib/api/server";
import { Boxes, PackagePlus, PackageMinus, Warehouse, Star, PackageX, Truck, Check, X } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { InfoHint } from "../_components/InfoHint";
import { ModalButton } from "../_components/ModalButton";
import { guardRetail } from "@/lib/retail/guard";
import { addProduct, addBrandStock } from "./actions";
import { fulfilOrder, rejectOrder } from "../supply/actions";
import { BrandStockTableClient } from "./BrandStockTablesClient";

export const dynamic = "force-dynamic";

type Product = { id: number; skuCode: string; name: string; category: string | null; isFocus: boolean; mrp: string | null };
type InvRow = { skuId: number; skuCode: string | null; skuName: string | null; isFocus: boolean; onHand: number; lowThreshold: number };
type OrderItem = { id: number; skuId: number; skuName: string | null; skuCode: string | null; qtyOrdered: number; qtyFulfilled: number; brandOnHand: number | null };
type Order = { id: number; distributorNodeId: number; status: string; note: string | null; placedAt: string | null; items: OrderItem[] };

const STATUS_TONE: Record<string, string> = {
  placed: "bg-[var(--warning-bg)] text-[var(--warning)]",
  approved: "bg-[var(--info-bg)] text-[var(--info)]",
  fulfilled: "bg-[var(--success-bg)] text-[var(--success)]",
  rejected: "bg-[var(--error-bg)] text-[var(--error)]",
  cancelled: "bg-[var(--surface-raised)] text-[var(--muted)]",
};

export default async function BrandStockPage() {
  await guardRetail(["brand", "store_manager", "superadmin"]);
  const [{ products }, inv, { orders }] = await Promise.all([
    apiGet<{ products: Product[] }>("/api/retail/supply/products").catch(() => ({ products: [] as Product[] })),
    apiGet<{ nodeId: number | null; rows: InvRow[] }>("/api/retail/supply/inventory").catch(() => ({ nodeId: null, rows: [] as InvRow[] })),
    apiGet<{ orders: Order[] }>("/api/retail/supply/orders").catch(() => ({ orders: [] as Order[] })),
  ]);
  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  const onHandBySku = new Map(inv.rows.map((r) => [r.skuId, r.onHand]));
  const totalUnits = inv.rows.reduce((s, r) => s + r.onHand, 0);
  const focusCount = products.filter((p) => p.isFocus).length;
  const outOfStock = products.filter((p) => (onHandBySku.get(p.id) ?? 0) <= 0).length;
  const openOrders = orders.filter((o) => o.status === "placed" || o.status === "approved").length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Orders &amp; Stock</h1>
          <p className="text-[13px] text-[var(--muted)]">Grocery&rsquo;s master warehouse and the distributor orders drawn from it — fulfil an order and the stock leaves from here.</p>
        </div>
        {/* Adding a SKU is occasional, but the form sat permanently open between
            the orders and the stock they draw on — two things read together.
            Behind a button it stops separating them. */}
        <ModalButton label="Add a product" title="Add a product to the catalog" icon={<PackagePlus size={15} />} variant="primary">
          <p className="text-[12px] text-[var(--faint)] mb-3">Create a new SKU. Distributors can then order it and stores can sell it.</p>
          <ActionForm action={addProduct} success="Product added to the catalog" className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-[11px] text-[var(--faint)]">SKU code</span><input name="skuCode" required className={input} placeholder="ORG-BAS-5KG" /></label>
            <label className="block"><span className="text-[11px] text-[var(--faint)]">Name</span><input name="name" required className={input} placeholder="Organic Basmati Rice 5kg" /></label>
            <label className="block"><span className="text-[11px] text-[var(--faint)]">Category</span><input name="category" className={input} placeholder="Groceries" /></label>
            <label className="block"><span className="text-[11px] text-[var(--faint)]">MRP (₹)</span><input name="mrp" type="number" min="0" className={input} placeholder="750" /></label>
            <label className="flex items-center gap-2 text-sm text-[var(--muted)] sm:col-span-2"><input type="checkbox" name="isFocus" className="w-4 h-4" /> Focus SKU</label>
            <div className="sm:col-span-2"><SubmitButton className="px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Add product</SubmitButton></div>
          </ActionForm>
        </ModalButton>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={<Boxes size={16} />} label="Products" value={products.length} hint="Total products (SKUs) in the Grocery catalog." />
        <Kpi icon={<Warehouse size={16} />} label="Units in stock" value={totalUnits.toLocaleString("en-IN")} hint="Total units on hand in the brand warehouse, across all products." />
        <Kpi icon={<Star size={16} />} label="Focus SKUs" value={focusCount} hint="Products marked as focus — the ones you are actively pushing through the channel." />
        <Kpi icon={<PackageX size={16} />} label="Out of stock" value={outOfStock} tone={outOfStock > 0 ? "warn" : undefined} hint="Catalog products with zero units on hand in the brand warehouse." />
        <Kpi icon={<Truck size={16} />} label="Orders to action" value={openOrders} tone={openOrders > 0 ? "warn" : undefined} hint="Distributor orders still waiting to be fulfilled or rejected." />
      </div>

      {/* Distributor orders — moved here from /retail/supply so the brand has a
          single screen: the order and the stock it draws on are now one page,
          and the "short" badge below points at the table directly underneath. */}
      <Section title="Distributor orders" icon={<Truck size={15} />} hint="Orders raised by your distributors. Fulfilling one moves units out of the brand warehouse below.">
        {orders.length === 0 ? <Empty>No orders yet.</Empty> : (
          // Grid, not a stack: orders are read side by side and compared, and
          // at one per row the page pushed the stock table below the fold.
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3 items-start">
            {orders.map((o) => {
              // Still actionable while placed or approved — an approved order
              // may have been part-sent with a balance outstanding.
              const open = o.status === "placed" || o.status === "approved";
              return (
              <div key={o.id} className="rlp-card p-3.5 h-full flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-[var(--text)]">Order #{o.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_TONE[o.status] ?? ""}`}>{o.status}</span>
                  <span className="text-[11px] text-[var(--faint)]">from distributor node #{o.distributorNodeId}</span>
                  {o.note && <span className="text-[11px] text-[var(--faint)]">· {o.note}</span>}
                </div>
                {/* Open orders get an editable quantity per line so Grocery can
                    send less than was asked for — the warehouse is often short
                    on one SKU, and before this the only options were "top up"
                    or "reject the whole order". Each box is capped at the
                    outstanding amount and at what is actually on hand. */}
                {open ? (
                  <ActionForm action={fulfilOrder.bind(null, o.id)} success="Order updated" className="flex-1 flex flex-col">
                    <ul className="text-[13px] text-[var(--muted)] space-y-1.5 flex-1">
                      {o.items.map((it) => {
                        const outstanding = it.qtyOrdered - (it.qtyFulfilled ?? 0);
                        const stock = it.brandOnHand ?? outstanding;
                        const grantable = Math.max(0, Math.min(outstanding, stock));
                        const short = it.brandOnHand != null && it.brandOnHand < outstanding;
                        return (
                          <li key={it.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="flex-1 min-w-[7rem]">
                              {it.skuName ?? it.skuCode ?? `SKU ${it.skuId}`}
                              <span className="text-[var(--faint)]"> · ordered <span className="tabular-nums">{it.qtyOrdered}</span>
                                {it.qtyFulfilled ? <> · sent <span className="tabular-nums">{it.qtyFulfilled}</span></> : null}
                              </span>
                            </span>
                            {it.brandOnHand != null && (
                              <span className={`text-[10.5px] px-1.5 py-0.5 rounded whitespace-nowrap ${short ? "bg-[var(--error-bg)] text-[var(--error)]" : "bg-[var(--surface-raised)] text-[var(--muted)]"}`}>
                                stock {it.brandOnHand}{short ? " · short" : ""}
                              </span>
                            )}
                            <input
                              name={`qty_${it.skuId}`} type="number" min="0" max={grantable} defaultValue={grantable}
                              aria-label={`Units of ${it.skuName ?? it.skuCode ?? `SKU ${it.skuId}`} to send`}
                              className="w-16 px-2 py-1 text-xs text-right tabular-nums border border-[var(--border-strong)] rounded-md bg-[var(--surface)]"
                            />
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center gap-2 mt-2.5">
                      <SubmitButton className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30 rounded-md hover:brightness-125"><Check size={13} /> Send</SubmitButton>
                    </div>
                  </ActionForm>
                ) : (
                  <ul className="text-[13px] text-[var(--muted)] space-y-1 flex-1">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{it.skuName ?? it.skuCode ?? `SKU ${it.skuId}`} × <span className="tabular-nums font-medium text-[var(--text)]">{it.qtyOrdered}</span>{it.qtyFulfilled ? ` (sent ${it.qtyFulfilled})` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {open && (
                  <div className="mt-2">
                    <ActionForm action={rejectOrder.bind(null, o.id)} success="Order rejected"><SubmitButton className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/30 rounded-md hover:brightness-125"><X size={13} /> Reject</SubmitButton></ActionForm>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Stock table with inline add-stock */}
      <BrandStockTableClient
        products={products}
        onHandBySku={Object.fromEntries(onHandBySku)}
      />
    </div>
  );
}

function Kpi({ icon, label, value, tone, hint }: { icon: React.ReactNode; label: string; value: string | number; tone?: "warn"; hint?: string }) {
  return (
    <div className="rlp-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--faint)]"><span className={tone === "warn" ? "text-[var(--warning)]" : "text-[var(--accent)]"}>{icon}</span><span className="text-[11px] uppercase tracking-wide">{label}</span></div>
        {hint && <InfoHint text={hint} />}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone === "warn" ? "text-[var(--warning)]" : "text-[var(--text)]"}`}>{value}</div>
    </div>
  );
}
function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2"><span className="text-[var(--accent)]">{icon}</span><h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>{hint && <InfoHint text={hint} className="ml-0.5" />}</div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>; }
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
