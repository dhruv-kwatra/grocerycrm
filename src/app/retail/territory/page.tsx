import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { MapPin, Store, TrendingUp, ClipboardCheck } from "lucide-react";

import { InfoHint } from "../_components/InfoHint";
import { guardRetail } from "@/lib/retail/guard";
import { ListShell, type Insights } from "../_components/ListShell";
export const dynamic = "force-dynamic";

type StoreRow = {
  nodeId: number; name: string; zone: string;
  distributorName: string | null; partnerName: string | null;
  compliance: number | null; revenue: number; bills: number; footfall: number; conversion: number;
};
type Zone = { zone: string; stores: StoreRow[]; revenue: number; avgCompliance: number | null };
type Territory = { period: string; role: string; totalStores: number; zones: Zone[] };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const TARGET = 85;

export default async function TerritoryPage() {
  await guardRetail(["brand", "partner", "superadmin"]);
  const [t, insights] = await Promise.all([
    apiGet<Territory>("/api/retail/analytics/territory?period=month").catch(() => null),
    apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null),
  ]);
  // Handle missing territory data without blocking the user
  const data = t || {
    period: "Wk 31",
    totalStores: 0,
    zones: []
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Territory <InfoHint text="Your estate grouped by zone (store city). Each store shows its distributor/partner owner, 8-week planogram compliance, footfall→sale conversion and revenue." className="align-middle" /></h1>
        <p className="text-[12px] text-[var(--faint)]">{data.period} · {data.totalStores} store{data.totalStores === 1 ? "" : "s"} across {data.zones?.length ?? 0} zone{data.zones?.length === 1 ? "" : "s"} — ownership, compliance &amp; conversion.</p>
      </div>

      <ListShell insights={insights}>
      {!data.zones || data.zones.length === 0 ? (
        <div className="rlp-card p-8 text-center">
          <MapPin size={26} className="mx-auto text-[var(--faint)]" />
          <p className="mt-2 text-sm text-[var(--muted)]">No stores in your territory yet.</p>
        </div>
      ) : (
        data.zones.map((z) => (
          <div key={z.zone} className="rlp-card rlp-card--flat overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]"><MapPin size={15} /></span>
                <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{z.zone}</h2>
                <span className="text-[11px] text-[var(--faint)]">· {z.stores.length} store{z.stores.length === 1 ? "" : "s"}</span>
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                {z.avgCompliance != null && (
                  <span className="flex items-center gap-1 text-[var(--muted)]"><ClipboardCheck size={13} /> avg <b className={z.avgCompliance < TARGET ? "text-[var(--warning)]" : "text-[var(--text)]"}>{z.avgCompliance}</b></span>
                )}
                <span className="text-[var(--muted)]">revenue <b className="text-[var(--text)] tabular-nums">{inr(z.revenue)}</b></span>
              </div>
            </div>
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[var(--border)]">
                  <Th>Store</Th><Th>Distributor</Th><Th>Partner</Th><Th right>Compliance</Th><Th right>Footfall</Th><Th right>Conversion</Th><Th right>Revenue</Th>
                </tr></thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {z.stores.map((s) => (
                    <tr key={s.nodeId} className="hover:bg-[var(--surface-2)]">
                      {/* Store name opens the partner-tier mockup for that outlet. */}
                      <Td className="text-[var(--text)] font-medium">
                        <Link href={`/retail/territory/${s.nodeId}?name=${encodeURIComponent(s.name)}`} className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] hover:underline">
                          <Store size={13} className="text-[var(--faint)]" />{s.name}
                        </Link>
                      </Td>
                      <Td>{s.distributorName ?? "—"}</Td>
                      <Td>{s.partnerName ?? "—"}</Td>
                      <Td right>
                        {s.compliance == null ? <span className="text-[var(--faint)]">—</span> : (
                          <span className={`tabular-nums font-medium ${s.compliance < TARGET ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{s.compliance}</span>
                        )}
                      </Td>
                      <Td right className="tabular-nums">{s.footfall}</Td>
                      <Td right className="tabular-nums">{s.conversion}%</Td>
                      <Td right className="tabular-nums text-[var(--text)] font-medium">{inr(s.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
      <p className="text-[11px] text-[var(--faint)] flex items-center gap-1"><TrendingUp size={12} /> Compliance is the 8-week planogram pass rate (target {TARGET}); conversion is bills ÷ footfall for the period.</p>
      </ListShell>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
