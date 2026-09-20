import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { Building, ChevronRight, Users, Store } from "lucide-react";
import { guardRetail } from "@/lib/retail/guard";
import { ListShell, type Insights } from "../_components/ListShell";

export const dynamic = "force-dynamic";

type Row = {
  nodeId: number; name: string; companyName: string | null; gstin: string | null;
  contactName: string | null; contactMobile: string | null; partners: number; stores: number; revenue: number;
};
type List = { distributors: Row[]; total: number };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

export default async function DistributorsPage() {
  await guardRetail(["brand","superadmin"]);
  const [d, insights] = await Promise.all([
    apiGet<List>("/api/retail/distributors").catch(() => null),
    apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null),
  ]);
  const data = d || {
    total: 0,
    distributors: []
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl 2xl:max-w-[112rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Distributors</h1>
        <p className="text-[12px] text-[var(--faint)]">{data.total} distributor{data.total === 1 ? "" : "s"} in your channel · last-30-day sell-through. Click one for the full profile.</p>
      </div>

      <ListShell insights={insights}>
      <div className="rlp-card rlp-card--flat overflow-hidden">
        {data.distributors.length === 0 ? (
          <div className="p-10 text-center">
            <Building size={26} className="mx-auto text-[var(--faint)]" />
            <p className="mt-2 text-sm text-[var(--muted)]">No distributors onboarded yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)]"><Th>Distributor</Th><Th>GSTIN</Th><Th>Contact</Th><Th right>Partners</Th><Th right>Stores</Th><Th right>Revenue</Th><Th></Th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.distributors.map((d) => (
                <tr key={d.nodeId} className="hover:bg-[var(--surface-2)]">
                  <Td>
                    <Link href={`/retail/distributors/${d.nodeId}`} className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:underline">
                      <Building size={14} className="text-[var(--faint)]" />{d.companyName ?? d.name}
                    </Link>
                    {d.companyName && d.companyName !== d.name && <span className="block text-[11px] text-[var(--faint)] ml-6">{d.name}</span>}
                  </Td>
                  <Td className="tabular-nums text-[12px]">{d.gstin ?? "—"}</Td>
                  <Td>{d.contactName ? <span>{d.contactName}<span className="block text-[11px] text-[var(--faint)]">{d.contactMobile}</span></span> : "—"}</Td>
                  <Td right className="tabular-nums"><span className="inline-flex items-center gap-1"><Users size={12} className="text-[var(--faint)]" />{d.partners}</span></Td>
                  <Td right className="tabular-nums"><span className="inline-flex items-center gap-1"><Store size={12} className="text-[var(--faint)]" />{d.stores}</span></Td>
                  <Td right className="tabular-nums text-[var(--text)] font-medium">{inr(d.revenue)}</Td>
                  <Td right><Link href={`/retail/distributors/${d.nodeId}`}><ChevronRight size={15} className="text-[var(--faint)]" /></Link></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </ListShell>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
