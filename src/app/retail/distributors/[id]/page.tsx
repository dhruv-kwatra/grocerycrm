import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { ArrowLeft, Building, IndianRupee, Store, Users, TrendingUp, ShieldCheck, Landmark, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

type Profile = {
  companyName: string | null; gstin: string | null; pan: string | null; address: string | null; pincode: string | null;
  contactName: string | null; contactMobile: string | null; contactEmail: string | null;
  bankAccountNo: string | null; bankIfsc: string | null; bankName: string | null;
  website: string | null; altContactName: string | null; altContactMobile: string | null;
  creditTerms: string | null; categoriesHandled: string | null; tradeReferences: string | null;
} | null;
type StoreRow = { nodeId: number; name: string; partnerName: string | null; revenue: number; bills: number; footfall: number; conversion: number; compliance: number | null };
type Detail = {
  node: { id: number; name: string; createdAt: string | null };
  profile: Profile;
  stats: { partners: number; stores: number; revenue: number; bills: number; footfall: number; conversion: number };
  stores: StoreRow[];
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const TARGET = 85;

export default async function DistributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await guardRetail(["brand", "superadmin"]);
  const { id } = await params;
  const d = await apiGet<Detail>(`/api/retail/distributors/${id}`).catch(() => null);
  if (!d) notFound();
  const p = d.profile;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto w-full">
      <div>
        <Link href="/retail/distributors" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--text)] mb-1"><ArrowLeft size={15} /> Back to distributors</Link>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight flex items-center gap-2"><Building size={18} className="text-[var(--accent)]" /> {p?.companyName ?? d.node.name}</h1>
        {p?.companyName && p.companyName !== d.node.name && <p className="text-[12px] text-[var(--faint)]">Channel node: {d.node.name}</p>}
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Users size={15} />} label="Partners" value={String(d.stats.partners)} />
        <Kpi icon={<Store size={15} />} label="Stores" value={String(d.stats.stores)} />
        <Kpi icon={<IndianRupee size={15} />} label="Sell-through (30d)" value={inr(d.stats.revenue)} accent="var(--text)" />
        <Kpi icon={<TrendingUp size={15} />} label="Conversion" value={`${d.stats.conversion}%`} />
      </div>

      {/* KYC profile */}
      <Section title="Company profile" icon={<ShieldCheck size={15} />}>
        {!p ? (
          <p className="text-sm text-[var(--faint)] py-2">No onboarding profile captured for this distributor yet.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3 text-[13px]">
            <F label="Company / firm" value={p.companyName} />
            <F label="GSTIN" value={p.gstin} mono />
            <F label="PAN" value={p.pan} mono />
            <F label="Registered address" value={[p.address, p.pincode].filter(Boolean).join(", ")} />
            <F label="Website" value={p.website} />
            <F label="Credit terms" value={p.creditTerms} />
            <F label="Categories handled" value={p.categoriesHandled} />
            <div className="sm:col-span-2 md:col-span-3 border-t border-[var(--border)] pt-3 mt-1 grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
              <F label="Primary contact" value={p.contactName} icon={<Phone size={11} />} />
              <F label="Mobile" value={p.contactMobile} />
              <F label="Email" value={p.contactEmail} />
              <F label="Alt. contact" value={p.altContactName} />
              <F label="Alt. mobile" value={p.altContactMobile} />
              <F label="Trade references" value={p.tradeReferences} />
            </div>
            <div className="sm:col-span-2 md:col-span-3 border-t border-[var(--border)] pt-3 mt-1 grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <F label="Bank" value={p.bankName} icon={<Landmark size={11} />} />
              <F label="Account no." value={p.bankAccountNo} mono />
              <F label="IFSC" value={p.bankIfsc} mono />
            </div>
          </div>
        )}
      </Section>

      {/* Stores under this distributor */}
      <Section title={`Stores (${d.stores.length})`} icon={<Store size={15} />}>
        {d.stores.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-2 text-center">No stores under this distributor yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)]"><Th>Store</Th><Th>Partner</Th><Th right>Footfall</Th><Th right>Conv.</Th><Th right>Compliance</Th><Th right>Revenue</Th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {d.stores.map((s) => (
                <tr key={s.nodeId}>
                  <Td className="text-[var(--text)]">{s.name}</Td>
                  <Td>{s.partnerName ?? "—"}</Td>
                  <Td right className="tabular-nums">{s.footfall}</Td>
                  <Td right className="tabular-nums">{s.conversion}%</Td>
                  <Td right>{s.compliance == null ? <span className="text-[var(--faint)]">—</span> : <span className={`tabular-nums font-medium ${s.compliance < TARGET ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{s.compliance}</span>}</Td>
                  <Td right className="tabular-nums text-[var(--text)] font-medium">{inr(s.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function F({ label, value, mono, icon }: { label: string; value: string | null; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] text-[var(--faint)] uppercase tracking-wide flex items-center gap-1">{icon}{label}</p>
      <p className={`text-[var(--text)] ${mono ? "tabular-nums" : ""} ${value ? "" : "text-[var(--faint)]"}`}>{value || "—"}</p>
    </div>
  );
}
function Kpi({ icon, label, value, accent = "var(--accent)" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="rlp-card p-3.5">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)", color: accent }}>{icon}</span>
      <p className="text-[16px] font-bold text-[var(--text)] tabular-nums mt-2 leading-none truncate">{value}</p>
      <p className="text-[11px] font-medium text-[var(--muted)] mt-1">{label}</p>
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
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
