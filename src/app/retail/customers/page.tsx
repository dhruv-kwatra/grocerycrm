import { apiGet } from "@/lib/api/server";
import { InfoHint } from "../_components/InfoHint";
import { CustomerListClient, type CustomerRow } from "../_components/CustomerListClient";
import { ListShell, type Insights } from "../_components/ListShell";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Customer = {
  id: number; name: string | null; phone: string | null; email: string | null; storeName: string | null;
  orders: number; spend: number; aov: number; lastPurchase: string | null; recencyDays: number | null; segment: string;
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const ago = (d: number | null) => (d == null ? "—" : d === 0 ? "today" : `${d}d ago`);

export default async function CustomersPage() {
  await guardRetail(["brand", "distributor", "partner", "store_manager", "superadmin"]);
  // The endpoint returns the full deduped set; search / segment / paging are now
  // client-side (instant, no page reloads).
  const [{ customers }, insights] = await Promise.all([
    apiGet<{ customers: Customer[] }>("/api/retail/customers").catch(() => ({ customers: [] as Customer[] })),
    apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null),
  ]);

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name ?? c.phone ?? `Customer #${c.id}`,
    phone: c.phone,
    sub: c.storeName,
    segment: c.segment,
    href: `/retail/customers/${c.id}`,
    stats: [
      { label: "Orders", value: String(c.orders) },
      { label: "Lifetime spend", value: inr(c.spend), strong: true },
      { label: "Avg order", value: c.orders ? inr(c.aov) : "—" },
      { label: "Last buy", value: ago(c.recencyDays) },
    ],
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Customers <InfoHint text="Unified shopper records (deduped by phone) with their RFM segment. Filter by segment; open one for the full 360 view — purchase history and loyalty." className="align-middle" /></h1>
        <p className="text-[12px] text-[var(--faint)]">Every shopper, their purchase history, and their RFM segment.</p>
      </div>
      <ListShell insights={insights}>
        <CustomerListClient rows={rows} />
      </ListShell>
    </div>
  );
}
