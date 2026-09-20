import { apiGet } from "@/lib/api/server";
import { Contact } from "lucide-react";
import { fmtDateFull } from "@/lib/retail/datetime";
import { CustomerListClient, type CustomerRow } from "../../_components/CustomerListClient";
import { ListShell, type Insights } from "../../_components/ListShell";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  name: string | null;
  phone: string | null;
  segment: string | null;
  units: number;
  spend: number;
  saleCount: number;
  demoCount: number;
  lastPurchaseAt: string | null;
};

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function AgentCustomersPage() {
  await guardRetail(["store_associate", "superadmin"]);
  const [{ customers }, insights] = await Promise.all([
    apiGet<{ customers: Row[] }>("/api/retail/agent/customers").catch(() => ({ customers: [] as Row[] })),
    apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null),
  ]);

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name ?? "Customer",
    phone: c.phone,
    sub: null,
    segment: c.segment,
    href: null, // agents have no per-customer 360 view
    stats: [
      { label: "Sale qty", value: String(c.units), strong: true },
      { label: "Purchases", value: String(c.saleCount) },
      { label: "Spend", value: inr(c.spend), strong: true },
      { label: "Demos", value: String(c.demoCount) },
      { label: "Last purchase", value: fmtDateFull(c.lastPurchaseAt) },
    ],
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl 2xl:max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center shrink-0"><Contact size={17} /></span>
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">My Customers</h1>
          <p className="text-[12px] text-[var(--faint)]">Every shopper at your store — purchases, spend, demos and last visit.</p>
        </div>
      </div>
      <ListShell insights={insights}>
        <CustomerListClient rows={rows} />
      </ListShell>
    </div>
  );
}
