import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { Boxes, Store, Users, TrendingUp, IndianRupee, Trophy, LifeBuoy, ClipboardCheck, ClipboardList } from "lucide-react";
import { InfoHint } from "../_components/InfoHint";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { ModalButton } from "../_components/ModalButton";
import { raiseStoreOrder } from "./actions";
import { fmtDate } from "@/lib/retail/datetime";
import { guardRetail } from "@/lib/retail/guard";
import { ListShell, type Insights } from "../_components/ListShell";

export const dynamic = "force-dynamic";

type StaffRow = { agentId: number; demos: number; bills: number; units: number; revenue: number; avgTxn: number };
type Overview = {
  kpis: { revenue: number; bills: number; units: number; footfall: number; conversion: number };
  deltas: { revenue: number; conversion: number; footfall: number };
  tier: { current: string; next: string | null; toNext: number } | null;
  staff: StaffRow[];
};

const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(1)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${n.toLocaleString("en-IN")}`);
type StoreRow = { nodeId: number; name: string; zone: string; compliance: number | null; revenue: number; conversion: number; footfall: number };
type Territory = { totalStores: number; zones: { stores: StoreRow[] }[] };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const TARGET = 85;
type Product = { id: number; name: string; isFocus: boolean };
type ReqRow = {
  id: number; storeNodeId: number; storeName: string | null; skuId: number; skuName: string | null;
  qtyRequested: number; qtyDispatched: number | null; status: string; requestedAt: string | null;
};

const REQ_TONE: Record<string, string> = {
  open: "bg-[var(--warning-bg)] text-[var(--warning)]",
  dispatched: "bg-[var(--info-bg)] text-[var(--info)]",
  received: "bg-[var(--success-bg)] text-[var(--success)]",
  cancelled: "bg-[var(--surface-raised)] text-[var(--muted)]",
};
const reqDate = (s: string | null) => fmtDate(s);
const selectCls = "mt-1 px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

export default async function PartnerPage() {
  await guardRetail(["partner","superadmin"]);
  const [o, t, { products }, { requests }] = await Promise.all([
    apiGet<Overview>("/api/retail/analytics/overview?period=month").catch(() => null),
    apiGet<Territory>("/api/retail/analytics/territory?period=month").catch(() => null),
    apiGet<{ products: Product[] }>("/api/retail/supply/products").catch(() => ({ products: [] as Product[] })),
    // status=all → every order the outlets have raised, not just the open queue.
    apiGet<{ requests: ReqRow[] }>("/api/retail/supply/requests?status=all").catch(() => ({ requests: [] as ReqRow[] })),
  ]);
  const outlets = (t?.zones ?? []).flatMap((z) => z.stores).sort((a, b) => b.revenue - a.revenue);
  const staff = (o?.staff ?? []).slice().sort((a, b) => b.revenue - a.revenue);
  const active = staff.filter((s) => s.bills > 0 || s.demos > 0);
  const top = active[0] ?? null;
  const coach = active.length > 1 ? active[active.length - 1] : null;

  const insights = await apiGet<Insights>("/api/retail/analytics/sales-series").catch(() => null);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <ListShell insights={insights}>
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0"><Boxes size={17} className="text-[var(--accent)]" /></span>
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Portfolio</h1>
          <p className="text-[12px] text-[var(--faint)]">Your outlets — comparison, agents and conversion. Last 30 days.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={<Store size={15} />} label="Outlets" value={String(t?.totalStores ?? 0)} hint="Number of stores you operate." />
        <Kpi icon={<Users size={15} />} label="Floor agents" value={String(active.length)} hint="Floor agents across your outlets who were active (had a demo or sale) this period." />
        <Kpi icon={<TrendingUp size={15} />} label="Blended conversion" value={`${o?.kpis.conversion ?? 0}%`} delta={o?.deltas.conversion} hint="Bills ÷ footfall across all your outlets combined. ▲/▼ vs the previous period." />
        <Kpi icon={<IndianRupee size={15} />} label="Revenue" value={inr(o?.kpis.revenue ?? 0)} accent="var(--text)" delta={o?.deltas.revenue} hint="Total revenue across your outlets in the last 30 days." />
        <Kpi icon={<Trophy size={15} />} label="Gold Circle" value={o?.tier?.current ?? "—"}
          sub={o?.tier?.next ? `${o.tier.next} at +${inrShort(o.tier.toNext)}` : undefined} hint="Your incentive tier based on period revenue. The sub-line shows the revenue gap to the next tier." />
      </div>

      {/* Store orders — raise one on a store's behalf, and watch every order the
          outlets have raised themselves. */}
      <Section
        title="Store orders"
        icon={<ClipboardList size={15} />}
        hint="Every replenishment order your outlets have raised, plus the ones you raise for them. Your distributor fulfils these and dispatches the stock."
        action={
          outlets.length > 0 && products.length > 0 ? (
            <ModalButton label="Raise an order" title="Raise an order for a store" icon={<ClipboardList size={15} />}>
              <p className="text-[12px] text-[var(--faint)] mb-3">
                Place a replenishment order for one of your outlets on its behalf — your distributor sees it and dispatches the stock.
              </p>
              <ActionForm action={raiseStoreOrder} success="Order raised for the store" className="space-y-2.5">
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Store</span>
                  <select name="nodeId" defaultValue={outlets[0]?.nodeId} className={selectCls}>
                    {outlets.map((s) => <option key={s.nodeId} value={s.nodeId}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Product</span>
                  <select name="skuId" defaultValue={products[0]?.id} className={selectCls}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isFocus ? " ★" : ""}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">Quantity</span>
                  <input name="qty" type="number" min="1" defaultValue="5" className={`${selectCls} tabular-nums`} />
                </label>
                <SubmitButton className="w-full px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:brightness-110">Raise order</SubmitButton>
              </ActionForm>
            </ModalButton>
          ) : null
        }
      >
        {requests.length === 0 ? (
          <Empty>
            {outlets.length === 0 ? "No outlets yet." : "No orders raised yet — use Raise an order to place one for an outlet."}
          </Empty>
        ) : (
          <table className="w-full text-sm min-w-[620px]">
            <thead><tr className="border-b border-[var(--border)]">
              <Th>Raised</Th><Th>Store</Th><Th>Product</Th><Th right>Qty</Th><Th>Status</Th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {requests.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap">{reqDate(r.requestedAt)}</Td>
                  <Td className="text-[var(--text)]">{r.storeName ?? `Store #${r.storeNodeId}`}</Td>
                  <Td>{r.skuName ?? `SKU ${r.skuId}`}</Td>
                  <Td right className="tabular-nums">
                    {r.qtyRequested}
                    {r.qtyDispatched != null && r.qtyDispatched !== r.qtyRequested && (
                      <span className="text-[var(--faint)]"> ({r.qtyDispatched} sent)</span>
                    )}
                  </Td>
                  <Td>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${REQ_TONE[r.status] ?? "bg-[var(--surface-raised)] text-[var(--muted)]"}`}>
                      {r.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        {/* Outlet comparison */}
        <Section title="Outlet comparison" icon={<Store size={15} />} hint="Side-by-side outlet performance — footfall, conversion and planogram compliance per store.">
          {outlets.length === 0 ? <Empty>No outlets yet.</Empty> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)]"><Th>Outlet</Th><Th right>Footfall</Th><Th right>Conv.</Th><Th right>Compliance</Th></tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {outlets.map((s) => (
                  <tr key={s.nodeId}>
                    <Td className="text-[var(--text)]">{s.name}</Td>
                    <Td right className="tabular-nums">{s.footfall}</Td>
                    <Td right className="tabular-nums">{s.conversion}%</Td>
                    <Td right>{s.compliance == null ? <span className="text-[var(--faint)]">—</span> : <span className={`tabular-nums font-medium ${s.compliance < TARGET ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{s.compliance}</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Agent highlights */}
        <Section title="Agent highlights" icon={<Trophy size={15} />} hint="Your top performer and the agent who most needs coaching, plus the full agent list by revenue.">
          {active.length === 0 ? <Empty>No agent activity this period.</Empty> : (
            <div className="space-y-3">
              {top && (
                <Highlight tone="good" icon={<Trophy size={15} />} label="Top performer"
                  who={`Agent #${top.agentId}`} detail={`${top.demos} demos → ${top.bills} sales · ${inr(top.revenue)}`} />
              )}
              {coach && (
                <Highlight tone="warn" icon={<LifeBuoy size={15} />} label="Coach"
                  who={`Agent #${coach.agentId}`} detail={`${coach.demos} demos → ${coach.bills} sales · ${inr(coach.revenue)}`} />
              )}
              <div className="pt-1">
                <p className="text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide mb-1.5">All agents</p>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[var(--border)]"><Th>Agent</Th><Th right>Demos</Th><Th right>Sales</Th><Th right>Revenue</Th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {staff.map((s) => (
                      <tr key={s.agentId}><Td className="text-[var(--text)]">Agent #{s.agentId}</Td><Td right>{s.demos}</Td><Td right>{s.bills}</Td><Td right className="tabular-nums text-[var(--text)] font-medium">{inr(s.revenue)}</Td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      </div>

      <p className="text-[11px] text-[var(--faint)] flex items-center gap-1">
        <ClipboardCheck size={12} /> Full reporting under <Link href="/retail/analytics" className="text-[var(--accent)] hover:underline">Analytics</Link> ·
        estate map under <Link href="/retail/territory" className="text-[var(--accent)] hover:underline">Territory</Link>.
      </p>
      </ListShell>
    </div>
  );
}

function Highlight({ tone, icon, label, who, detail }: { tone: "good" | "warn"; icon: React.ReactNode; label: string; who: string; detail: string }) {
  const bg = tone === "good" ? "bg-[var(--success-bg)]" : "bg-[var(--warning-bg)]";
  const fg = tone === "good" ? "text-[var(--success)]" : "text-[var(--warning)]";
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 ${bg}`}>
      <span className={fg}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-[10.5px] font-semibold uppercase tracking-wide ${fg}`}>{label}</p>
        <p className="text-[13.5px] font-semibold text-[var(--text)]">{who}</p>
        <p className="text-[12px] text-[var(--muted)] truncate">{detail}</p>
      </div>
    </div>
  );
}
function Kpi({ icon, label, value, accent = "var(--accent)", delta, sub, hint }: { icon: React.ReactNode; label: string; value: string; accent?: string; delta?: number; sub?: string; hint?: string }) {
  return (
    <div className="rlp-card p-3.5">
      <div className="flex items-start justify-between">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)", color: accent }}>{icon}</span>
        <div className="flex items-center gap-1.5">
          {delta != null && delta !== 0 && <span className={`text-[10.5px] font-semibold tabular-nums ${delta > 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>}
          {hint && <InfoHint text={hint} />}
        </div>
      </div>
      <p className="text-[16px] font-bold text-[var(--text)] tabular-nums mt-2 leading-none truncate">{value}</p>
      <p className="text-[11px] font-medium text-[var(--muted)] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[var(--faint)] mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
function Section({ title, icon, children, hint, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>
        {hint && <InfoHint text={hint} className="ml-0.5" />}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4 overflow-x-auto">{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>; }
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
