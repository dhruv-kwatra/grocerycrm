import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { ArrowLeft, Phone, Mail, Store, ShoppingBag, IndianRupee, Receipt, Clock, Gift } from "lucide-react";
import { ActionForm, SubmitButton } from "../../_components/ActionForm";
import { redeem } from "../actions";
import { fmtDateFull } from "@/lib/retail/datetime";

export const dynamic = "force-dynamic";

type LedgerEntry = { id: number; kind: string; points: number; note: string | null; createdAt: string | null };
type Detail = {
  customer: { id: number; name: string | null; phone: string | null; email: string | null; storeName: string | null; categoryPref: string | null };
  metrics: { orders: number; spend: number; aov: number; recencyDays: number | null; lastPurchase: string | null; segment: string };
  loyalty: { balance: number; ledger: LedgerEntry[] };
  history: { id: number; skuId: number | null; skuName: string | null; units: number; revenue: string | null; billNo: string | null; soldAt: string | null }[];
};

const inr = (n: number | string | null) => n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
const SEG_LABEL: Record<string, string> = { loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant" };
const SEG_TONE: Record<string, string> = {
  loyal: "bg-[var(--success-bg)] text-[var(--success)]", high_value: "bg-[var(--accent-light)] text-[var(--accent-dark)]",
  regular: "bg-[var(--surface-raised)] text-[var(--muted)]", new: "bg-[var(--info-bg)] text-[var(--info)]",
  at_risk: "bg-[var(--warning-bg)] text-[var(--warning)]", dormant: "bg-[var(--surface-raised)] text-[var(--faint)]",
};

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await guardRetail(["brand", "distributor", "partner", "store_manager", "superadmin"]);
  const { id } = await params;
  const { customer: c, metrics: m, loyalty, history } = await apiGet<Detail>(`/api/retail/customers/${id}`);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <Link href="/retail/customers" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft size={14} /> All customers</Link>

      {/* Profile */}
      <div className="rlp-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">{c.name ?? c.phone ?? `Customer #${c.id}`}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px] text-[var(--muted)]">
              {c.phone && <span className="inline-flex items-center gap-1"><Phone size={13} /> {c.phone}</span>}
              {c.email && <span className="inline-flex items-center gap-1"><Mail size={13} /> {c.email}</span>}
              {c.storeName && <span className="inline-flex items-center gap-1"><Store size={13} /> {c.storeName}</span>}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${SEG_TONE[m.segment] ?? ""}`}>{SEG_LABEL[m.segment] ?? m.segment}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<ShoppingBag size={15} />} label="Orders" value={String(m.orders)} />
        <Metric icon={<IndianRupee size={15} />} label="Lifetime spend" value={inr(m.spend)} accent="var(--text)" />
        <Metric icon={<Receipt size={15} />} label="Avg order" value={m.orders ? inr(m.aov) : "—"} />
        <Metric icon={<Clock size={15} />} label="Last purchase" value={m.recencyDays == null ? "never" : m.recencyDays === 0 ? "today" : `${m.recencyDays}d ago`} />
      </div>

      {/* Loyalty */}
      <div className="rlp-card rlp-card--flat overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
          <span className="text-[var(--accent)]"><Gift size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Loyalty</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[26px] font-bold text-[var(--text)] tabular-nums leading-none">{loyalty.balance}</p>
              <p className="text-[12px] text-[var(--muted)] mt-1">points available · worth {inr(loyalty.balance)}</p>
            </div>
            <ActionForm action={redeem.bind(null, c.id)} success="Points redeemed" className="flex items-end gap-2">
              <label className="block"><span className="text-[11px] text-[var(--faint)]">Redeem points</span>
                <input name="points" type="number" min="1" max={loyalty.balance || undefined} defaultValue={Math.min(100, loyalty.balance) || ""} disabled={loyalty.balance <= 0}
                  className="px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-28 tabular-nums" />
              </label>
              <SubmitButton className="px-3.5 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)] disabled:opacity-50">Redeem</SubmitButton>
            </ActionForm>
          </div>
          {loyalty.ledger.length > 0 && (
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {loyalty.ledger.slice(0, 8).map((l) => (
                <li key={l.id} className="flex items-center justify-between py-1.5 text-[13px]">
                  <span className="text-[var(--muted)] capitalize">{l.note ?? l.kind}</span>
                  <span className={`tabular-nums font-medium ${l.points >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{l.points >= 0 ? "+" : ""}{l.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Purchase history */}
      <div className="rlp-card rlp-card--flat overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)]"><h2 className="text-[13.5px] font-semibold text-[var(--text)]">Purchase history</h2></div>
        <div className="p-5 overflow-x-auto">
          {history.length === 0 ? (
            <p className="text-sm text-[var(--faint)] py-3 text-center">No purchases yet — captured as a walk-in lead.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)]">
                <Th>Product</Th><Th right>Units</Th><Th right>Amount</Th><Th>Bill</Th><Th right>Date</Th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {history.map((h) => (
                  <tr key={h.id}>
                    <Td className="text-[var(--text)]">{h.skuName ?? `SKU ${h.skuId ?? "—"}`}</Td>
                    <Td right className="tabular-nums">{h.units}</Td>
                    <Td right className="tabular-nums font-medium text-[var(--text)]">{inr(h.revenue)}</Td>
                    <Td>{h.billNo ?? "—"}</Td>
                    <Td right className="text-[12px]">{fmtDateFull(h.soldAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, accent = "var(--accent)" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="rlp-card p-3.5">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)", color: accent }}>{icon}</span>
      <p className="text-[16px] font-bold text-[var(--text)] tabular-nums mt-2 leading-none">{value}</p>
      <p className="text-[11px] font-medium text-[var(--muted)] mt-1">{label}</p>
    </div>
  );
}
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>;
}
