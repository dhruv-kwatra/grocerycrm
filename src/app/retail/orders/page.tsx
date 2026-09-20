import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PlusCircle, Filter } from "lucide-react";
import { ModalButton } from "../_components/ModalButton";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { OrdersTable, type Order } from "./OrdersTable";
import { logSaleForAgent } from "./actions";
import { ListShell, type Insights } from "../_components/ListShell";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Seller = { userId: number; name: string; role: string };
type Sku = { id: number; name: string; onHand?: number };
type Search = {
  status?: string; paymentMethod?: string; agentId?: string;
  q?: string; from?: string; to?: string; page?: string;
};

const STATUSES = ["pending", "confirmed", "packed", "delivered", "cancelled"];
const PAYMENTS = [["cash", "Cash"], ["upi", "UPI"], ["card", "Card"], ["emi", "EMI"]];
const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await guardRetail(["store_manager","superadmin"]);
  const sp = await searchParams;

  // Only forward filters that are actually set, so the backend sees a clean query.
  const qs = new URLSearchParams();
  for (const k of ["status", "paymentMethod", "agentId", "q", "from", "to"] as const) {
    if (sp[k]) qs.set(k, String(sp[k]));
  }

  const [me, { orders }, { sellers }, { skus }, insights] = await Promise.all([
    getCurrentUser(),
    apiGet<{ orders: Order[] }>(`/api/retail/manager/orders${qs.size ? `?${qs}` : ""}`).catch(() => ({ orders: [] as Order[] })),
    apiGet<{ sellers: Seller[] }>("/api/retail/agent/sellers").catch(() => ({ sellers: [] as Seller[] })),
    // In-stock only, with quantities — you can't sell what the store doesn't have.
    apiGet<{ skus: Sku[] }>("/api/retail/agent/skus").catch(() => ({ skus: [] as Sku[] })),
    apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null),
  ]);
  // Drop self from the picker — the blank "Me" option already covers that, and
  // listing the caller twice reads as two different people.
  const others = sellers.filter((s) => String(s.userId) !== String(me.id));

  // ponytail: paginate the fetched page client-side, matching /retail/customers.
  // The backend caps at 200 rows, so that's the reachable ceiling — filters are
  // how you get past it. Swap for a server LIMIT/OFFSET + count if stores
  // routinely exceed 200 orders in a filtered view.
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(sp.page) || 1), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = orders.slice(start, start + PAGE_SIZE);

  // Page links keep the active filters; changing a filter resets to page 1.
  const pageHref = (p: number) => {
    const params = new URLSearchParams(qs);
    if (p > 1) params.set("page", String(p));
    return `/retail/orders${params.size ? `?${params}` : ""}`;
  };

  const filtered = qs.size > 0;
  const field = "px-2.5 py-1.5 text-[13px] border border-[var(--border-strong)] rounded-lg bg-[var(--surface)]";
  const modalField = "mt-1 px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Orders</h1>
          <p className="text-[12px] text-[var(--faint)]">
            Every sale on the floor. Select rows to move several at once, or update a status inline.
          </p>
        </div>
        {skus.length > 0 && (
          <ModalButton label="Log a sale" title="Log a sale" icon={<PlusCircle size={15} />}>
            <p className="text-[12px] text-[var(--faint)] mb-3">
              Credit the sale to the agent who closed it — or leave it as yourself if you rang it up.
            </p>
            <ActionForm action={logSaleForAgent} success="Sale logged" className="space-y-2.5">
              <label className="block">
                <span className="text-[11px] text-[var(--faint)]">Sold by</span>
                <select name="agentId" className={modalField} defaultValue="">
                  <option value="">Me (this sale was mine)</option>
                  {others.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name}{s.role === "store_manager" ? " · manager" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--faint)]">Select product</span>
                <select name="skuId" className={modalField} defaultValue={skus[0]?.id}>
                  {skus.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.onHand != null ? ` (${s.onHand} in stock)` : ""}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--faint)]">Quantity</span>
                <input name="units" type="number" min="1" defaultValue="1" className={`${modalField} tabular-nums`} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Customer name</span>
                  <input name="customerName" placeholder="Optional" className={modalField} />
                </label>
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Mobile</span>
                  <input name="customerPhone" placeholder="Optional" className={modalField} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Bill amount</span>
                  <input name="revenue" type="number" min="0" step="0.01" placeholder="Auto from MRP" className={`${modalField} tabular-nums`} />
                </label>
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Payment</span>
                  <select name="paymentMethod" className={modalField} defaultValue="cash">
                    {PAYMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              </div>
              <SubmitButton className="w-full px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Log sale</SubmitButton>
            </ActionForm>
          </ModalButton>
        )}
      </div>

      {/* Filters. A plain GET form — the server component re-renders from the
          URL, so no client state and every filtered view is shareable. */}
      <form
        method="GET"
        className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]"
      >
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--muted)] pb-1.5 shrink-0">
          <Filter size={13} /> Filters
        </span>
        <label className="block w-full sm:w-44 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search order..." className={`${field} w-full`} />
        </label>
        <label className="block w-28 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className={`${field} w-full capitalize`}>
            <option value="">Any</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block w-28 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">Payment</span>
          <select name="paymentMethod" defaultValue={sp.paymentMethod ?? ""} className={`${field} w-full`}>
            <option value="">Any</option>
            {PAYMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block w-28 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">Sold by</span>
          <select name="agentId" defaultValue={sp.agentId ?? ""} className={`${field} w-full`}>
            <option value="">Anyone</option>
            {sellers.map((s) => <option key={s.userId} value={s.userId}>{s.name}</option>)}
          </select>
        </label>
        <label className="block w-32 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">From</span>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className={`${field} w-full`} />
        </label>
        <label className="block w-32 shrink-0">
          <span className="text-[10.5px] text-[var(--faint)] block">To</span>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className={`${field} w-full`} />
        </label>
        <button type="submit" className="px-3.5 py-1.5 text-[13px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">
          Apply
        </button>
        {filtered && (
          <Link href="/retail/orders" className="px-3 py-1.5 text-[13px] font-medium text-[var(--muted)] border border-[var(--border-strong)] rounded-lg hover:bg-[var(--surface-raised)]">
            Clear
          </Link>
        )}
      </form>

      <ListShell insights={insights}>
      <OrdersTable orders={pageRows} />

      {orders.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-[var(--faint)]">
            {start + 1}–{Math.min(start + PAGE_SIZE, orders.length)} of {orders.length}
            {orders.length === 200 && " (showing the most recent 200 — narrow with filters)"}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <PageLink href={pageHref(current - 1)} disabled={current === 1}>Previous</PageLink>
              <span className="text-[11.5px] text-[var(--muted)] tabular-nums px-1">{current} / {totalPages}</span>
              <PageLink href={pageHref(current + 1)} disabled={current === totalPages}>Next</PageLink>
            </div>
          )}
        </div>
      )}
      </ListShell>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const cls = "px-2.5 py-1 text-[12px] font-medium rounded-md border border-[var(--border-strong)]";
  if (disabled) return <span className={`${cls} text-[var(--faint)] opacity-50`}>{children}</span>;
  return <Link href={href} className={`${cls} text-[var(--muted)] hover:bg-[var(--surface-raised)]`}>{children}</Link>;
}
