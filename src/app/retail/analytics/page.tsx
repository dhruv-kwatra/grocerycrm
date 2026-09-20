import Link from "next/link";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api/server";
import { IndianRupee, ReceiptText, TrendingUp, Percent, Users, Trophy, Package, Contact, Network, Truck, PackageX, ChevronLeft, ChevronRight, Filter, LineChart } from "lucide-react";
import { DownloadCsv } from "./DownloadCsv";
import { FunnelBarChart, SellThroughChart, TopProductsChart, ComplianceTrendChart, SegmentDonut, RevenueByChannelChart, StageConvChart, StoreScatter, TrendAreaChart, WeeklyBarChart } from "./lazyAnalyticsCharts";
import { Sparkline } from "./Sparkline";
import { MotionCard } from "./MotionCard";
import { InfoHint } from "../_components/InfoHint";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type BreakdownRow = { nodeId: number; name: string; nodeType: string; revenue: number; bills: number; units: number; avgTxn: number };
type LowStock = { nodeId: number; storeName: string | null; skuId: number; skuName: string | null; onHand: number; lowThreshold: number };
type Overview = {
  period: string;
  role?: string;
  scopeNode: { id: number; name: string; nodeType: string; parentId: number | null; depth: number } | null;
  funnel: { stage: string; value: number; pct: number }[];
  trend: { weeks: { label: string; focus: number; other: number }[] };
  series?: { date: string; label: string; footfall: number; bills: number; units: number; revenue: number; demos: number }[];
  customerGrowth?: { weeks: { label: string; n: number }[] };
  compliance: { target: number; avg: number; belowCount: number; stores: { nodeId: number; name: string; checks: number; score: number; belowTarget: boolean }[]; trend: { weeks: { label: string; score: number }[] } };
  deltas: { revenue: number; bills: number; units: number; footfall: number; conversion: number };
  breakdown: { label: string; rows: BreakdownRow[] } | null;
  supply: { orders: { status: string; n: number }[]; placed: number; pending: number; fulfilled: number; unitsOrdered: number; unitsFulfilled: number; dispatches: number; unitsDispatched: number } | null;
  ops: { lowStock: LowStock[]; replenishmentOpen: number } | null;
  kpis: { revenue: number; bills: number; units: number; footfall: number; demos: number; conversion: number; avgTxn: number; grossMarginEst: number; marginRate: number };
  topSkus: { skuId: number | null; name: string | null; units: number; revenue: number }[];
  staff: { agentId: number; name?: string; store?: string; demos: number; bills: number; units: number; revenue: number; avgTxn: number }[];
  customers: { total: number; purchasers: number; newShoppers: number; avgLtv: number; churnPct: number; segmentMix: { segment: string; n: number }[] };
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const PERIODS = [["day", "Today"], ["week", "7 days"], ["month", "30 days"]] as const;

// Role-specific framing so each tier reads the same KPIs through its own lens.
const ROLE_BLURB: Record<string, string> = {
  brand: "National sell-through across the whole Grocery channel — compare distributors.",
  distributor: "Your territory — compare the partners you supply.",
  partner: "Your stores — compare their performance and mix.",
  store_manager: "Your store — track your floor agents, footfall and customers.",
  superadmin: "Whole-tenant view across every channel.",
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; nodeId?: string }> }) {
  await guardRetail(["brand","distributor","partner","store_manager","superadmin"]);
  const { period, nodeId } = await searchParams;
  const active = period === "day" || period === "week" ? period : "month";
  const drill = nodeId && /^\d+$/.test(nodeId) ? nodeId : undefined;
  // The landing's "Enter RetailIQ" sends everyone here; roles that can't view
  // analytics (e.g. floor agents → 403) fall back to their own role home via
  // /retail. Only swallow the fetch error to redirect — nothing else.
  let o: Overview;
  try {
    o = await apiGet<Overview>(`/api/retail/analytics/overview?period=${active}${drill ? `&nodeId=${drill}` : ""}`);
  } catch {
    redirect("/retail");
  }
  const k = o.kpis;
  // Stage-to-stage funnel conversion (each stage as a % of the one before it).
  const funnelSteps = o.funnel.slice(1).map((f, i) => ({
    label: `→ ${f.stage}`,
    rate: o.funnel[i].value > 0 ? Math.round((f.value / o.funnel[i].value) * 100) : 0,
  }));

  // Daily series (fixed trailing 30 days) → trend charts + KPI sparklines.
  const series = o.series ?? [];
  const billsSeries = series.map((s) => ({ label: s.label, value: s.bills }));
  const footfallSeries = series.map((s) => ({ label: s.label, value: s.footfall }));
  // Demos aggregated into the last 4 full weeks (28 days → 4 equal bars).
  const last28 = series.slice(-28);
  const demoWeeks = [0, 1, 2, 3].map((w) => ({
    label: `W${w + 1}`,
    value: last28.slice(w * 7, w * 7 + 7).reduce((a, s) => a + s.demos, 0),
  }));
  const growthSeries = (o.customerGrowth?.weeks ?? []).map((w) => ({ label: w.label, value: w.n }));
  const sparkRevenue = series.map((s) => s.revenue);
  const sparkUnits = series.map((s) => s.units);
  const sparkConv = series.map((s) => (s.footfall > 0 ? Math.round((s.bills / s.footfall) * 1000) / 10 : 0));
  const hasSeries = series.length > 1;

  const qs = (p: string, node?: string) => `/retail/analytics?period=${p}${node ? `&nodeId=${node}` : ""}`;
  // Drilling up: to the parent node if it's still within scope, else back to root.
  const upHref = o.scopeNode ? qs(active, o.scopeNode.parentId ? String(o.scopeNode.parentId) : undefined) : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">
            Territory &amp; Category Analytics{o.scopeNode ? <span className="text-[var(--muted)] font-normal"> · {o.scopeNode.name}</span> : ""}
          </h1>
          <p className="text-[13px] text-[var(--muted)]">Store comparison, product line share and conversion intelligence · {o.period} · {ROLE_BLURB[o.role ?? ""] ?? "Sales, staff and customers across your territory."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {PERIODS.map(([p, label]) => (
              <Link key={p} href={qs(p, drill)} className={`text-xs px-2.5 py-1 rounded-full font-medium ${active === p ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"}`}>{label}</Link>
            ))}
          </div>
          <DownloadCsv period={active} />
        </div>
      </div>

      {/* Drill-down breadcrumb */}
      {upHref && (
        <Link href={upHref} className="inline-flex items-center gap-1 text-[13px] text-[var(--accent)] hover:underline">
          <ChevronLeft size={15} /> Back to full territory
        </Link>
      )}

      {/* KPIs — the four headline metrics, each with a 30-day sparkline. Bills,
          footfall and demos graduate to their own trend charts below. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<IndianRupee size={15} />} label="Revenue" value={inr(k.revenue)} accent="var(--text)" delta={o.deltas.revenue} spark={sparkRevenue} sparkColor="var(--accent)" hint="Total sales value in this period across your territory. ▲/▼ compares the previous equal-length period; the sparkline is the last 30 days." />
        <Kpi icon={<Percent size={15} />} label={`Gross margin · est ${Math.round(k.marginRate * 100)}%`} value={inr(k.grossMarginEst)} spark={sparkRevenue} sparkColor="var(--success)" hint={`Estimated gross profit at an assumed ${Math.round(k.marginRate * 100)}% margin (no per-SKU cost captured yet).`} />
        <Kpi icon={<TrendingUp size={15} />} label="Conversion" value={`${k.conversion}%`} accent="var(--warning)" delta={o.deltas.conversion} spark={sparkConv} sparkColor="var(--warning)" hint="Bills ÷ footfall — the share of walk-ins that became a sale." />
        <Kpi icon={<Package size={15} />} label="Units sold" value={String(k.units)} delta={o.deltas.units} spark={sparkUnits} sparkColor="var(--accent)" hint="Total product units sold across all bills." />
      </div>

      {/* Funnel + sell-through trend */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <Section title="Footfall → sale funnel" icon={<Filter size={15} />} hint="Where walk-ins drop off: footfall → engaged by an agent → given a demo → sale closed. Each % is of footfall.">
          {o.funnel[0]?.value === 0 ? <Empty>No footfall captured in this period.</Empty> : (
            <>
              <FunnelBarChart stages={o.funnel} />
              <p className="text-[11.5px] text-[var(--faint)] mt-2">Where walk-ins are won and lost — the engaged→demo step is usually the leak.</p>
            </>
          )}
        </Section>
        <Section title="Weekly sell-through · units" icon={<LineChart size={15} />} hint="Units sold per week for the last 8 weeks, split between focus SKUs (the products you're pushing) and everything else.">
          <SellThroughChart weeks={o.trend.weeks} />
          <p className="text-[11.5px] text-[var(--faint)] mt-2">Focus SKUs vs the rest, last 8 weeks.</p>
        </Section>
      </div>

      {/* Stage conversion | Footfall trend */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        {o.funnel[0]?.value > 0 && (
          <Section title="Stage conversion rates" icon={<TrendingUp size={15} />} hint="How much of each funnel stage advances to the next: footfall→engaged, engaged→demo, demo→sale. Low steps are where to coach.">
            <StageConvChart steps={funnelSteps} />
            <p className="text-[11.5px] text-[var(--faint)] mt-2">Each bar is the share of the previous stage that advanced.</p>
          </Section>
        )}
        {hasSeries && (
          <Section title="Footfall trend · 30 days" icon={<Users size={15} />} hint="Daily walk-in footfall over the last 30 days — correlate traffic with the sales and bills trends.">
            <TrendAreaChart data={footfallSeries} color="var(--warning)" name="Footfall" />
            <p className="text-[11.5px] text-[var(--faint)] mt-2">Daily walk-ins across your territory.</p>
          </Section>
        )}
      </div>

      {/* Daily bills trend | Demos by week */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        {hasSeries && (
          <Section title="Daily bills trend · 30 days" icon={<ReceiptText size={15} />} hint="Bills (sales) closed per day over the last 30 days — is billing activity improving or declining?">
            <TrendAreaChart data={billsSeries} color="var(--success)" name="Bills" />
            <p className="text-[11.5px] text-[var(--faint)] mt-2">Sales closed per day.</p>
          </Section>
        )}
        {hasSeries && (
          <Section title="Demos by week" icon={<TrendingUp size={15} />} hint="Product demos given per week over the last 4 weeks — spot which periods generate the most demo activity.">
            <WeeklyBarChart data={demoWeeks} color="var(--accent)" name="Demos" />
            <p className="text-[11.5px] text-[var(--faint)] mt-2">Demos given, last 4 weeks.</p>
          </Section>
        )}
      </div>

      {/* "Planogram compliance by store" is hidden for now — remove this comment
          and restore the <Section> to bring it back (data still flows from
          o.compliance.stores). */}

      {/* Compliance trend — network score over the last 8 weeks */}
      {o.compliance.trend.weeks.length >= 2 && (
        <Section title="Compliance trend · network" icon={<LineChart size={15} />} hint="Weekly photo-audit pass rate averaged across the estate for the last 8 weeks, against the target line — is compliance improving?">
          <ComplianceTrendChart weeks={o.compliance.trend.weeks} target={o.compliance.target} />
          <p className="text-[11.5px] text-[var(--faint)] mt-2">Estate-wide weekly score vs the {o.compliance.target} target.</p>
        </Section>
      )}

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        {/* Top SKUs — revenue bar chart */}
        <Section title="Top products · by revenue" icon={<Package size={15} />} hint="Best-selling SKUs this period by revenue; hover for units sold.">
          {o.topSkus.length === 0 ? <Empty>No sales in this period.</Empty> : (
            <TopProductsChart data={o.topSkus.map((t) => ({ name: t.name ?? `SKU ${t.skuId}`, units: t.units, revenue: t.revenue }))} />
          )}
        </Section>

        {/* Channel breakdown (upper tiers) — performance of the units directly
            beneath the caller: brand→distributors, distributor→partners,
            partner→stores. Store managers have no child tier, so they see the
            per-agent staff scorecard instead. */}
        {o.breakdown ? (
          <Section title={`Channel performance · ${o.breakdown.label.toLowerCase()}`} icon={<Network size={15} />} hint="Revenue, bills and units for the units directly beneath you (brand→distributors, distributor→partners, partner→stores). Click a row to drill in.">
            {o.breakdown.rows.length === 0 ? <Empty>No sales in this period.</Empty> : (
              <>
              {o.breakdown.rows.length >= 2 && (
                <>
                  <div className="mb-4"><RevenueByChannelChart rows={o.breakdown.rows.map((r) => ({ name: r.name, revenue: r.revenue, bills: r.bills, avgTxn: r.avgTxn }))} /></div>
                  <div className="mb-5">
                    <p className="text-[11.5px] text-[var(--faint)] mb-1">Store efficiency — revenue × average ticket, bubble size is bill volume.</p>
                    <StoreScatter rows={o.breakdown.rows.map((r) => ({ name: r.name, revenue: r.revenue, avgTxn: r.avgTxn, bills: r.bills }))} />
                  </div>
                </>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="border-b border-[var(--border)]"><Th>{o.breakdown.label.replace(/^By /, "")}</Th><Th right>Bills</Th><Th right>Units</Th><Th right>Revenue</Th><Th right>Avg txn</Th><Th></Th></tr></thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {o.breakdown.rows.map((r) => (
                    <tr key={r.nodeId} className="hover:bg-[var(--surface-2)]">
                      <Td className="text-[var(--text)]">
                        {/* store rows have no deeper analytics tier — not a link */}
                        {r.nodeType === "store"
                          ? r.name
                          : <Link href={qs(active, String(r.nodeId))} className="text-[var(--accent)] font-medium hover:underline">{r.name}</Link>}
                        <span className="ml-1.5 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)]">{r.nodeType}</span>
                      </Td>
                      <Td right>{r.bills}</Td><Td right>{r.units}</Td>
                      <Td right className="font-medium text-[var(--text)]">{inr(r.revenue)}</Td><Td right>{inr(r.avgTxn)}</Td>
                      <Td right>{r.nodeType !== "store" && <ChevronRight size={14} className="text-[var(--faint)] inline" />}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </>
            )}
          </Section>
        ) : (
          <Section title="Staff scorecard" icon={<Trophy size={15} />} hint="Per-agent productivity — demos, bills, units, revenue and average ticket. Shown at store level.">
            {o.staff.length === 0 ? <Empty>No staff activity in this period.</Empty> : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="border-b border-[var(--border)]"><Th>Agent</Th><Th>Store</Th><Th right>Demos</Th><Th right>Bills</Th><Th right>Units</Th><Th right>Revenue</Th><Th right>Avg txn</Th></tr></thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {o.staff.map((s) => (
                    <tr key={s.agentId}><Td className="text-[var(--text)]">{s.name ?? `Agent #${s.agentId}`}</Td><Td>{s.store || "—"}</Td><Td right>{s.demos}</Td><Td right>{s.bills}</Td><Td right>{s.units}</Td><Td right className="font-medium text-[var(--text)]">{inr(s.revenue)}</Td><Td right>{inr(s.avgTxn)}</Td></tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Customer analytics — growth trend + segment donut */}
      <Section title="Customers" icon={<Contact size={15} />} hint="Customer base health: total shoppers, average lifetime value, churn %, new customers captured per week, and the RFM segment mix.">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Mini label="Total" value={String(o.customers.total)} />
          <Mini label="Avg LTV" value={inr(o.customers.avgLtv)} />
          <Mini label="Churn" value={`${o.customers.churnPct}%`} />
        </div>
        {growthSeries.length >= 2 && (
          <div className="mb-4">
            <p className="text-[11.5px] text-[var(--faint)] mb-1">New customers captured per week</p>
            <TrendAreaChart data={growthSeries} color="var(--accent)" name="New customers" />
          </div>
        )}
        {/* Only show the segment donut when there's a genuine mix (avoid a "100% New" ring). */}
        {o.customers.segmentMix.filter((s) => s.n > 0).length >= 2 ? (
          <>
            <p className="text-[11.5px] text-[var(--faint)] mb-1">By RFM segment</p>
            <SegmentDonut segments={o.customers.segmentMix} />
          </>
        ) : o.customers.total === 0 ? <Empty>No customers captured yet.</Empty> : null}
      </Section>


      {/* Supply & fulfilment (brand / distributor) */}
      {o.supply && (
        <Section title="Supply & fulfilment" icon={<Truck size={15} />} hint="Distributor order pipeline: orders placed vs fulfilled, units ordered/fulfilled, and dispatch volume to stores.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Mini label="Orders placed" value={String(o.supply.placed)} />
            <Mini label="Pending" value={String(o.supply.pending)} />
            <Mini label="Units fulfilled" value={`${o.supply.unitsFulfilled} / ${o.supply.unitsOrdered}`} />
            <Mini label="Dispatched (units)" value={`${o.supply.unitsDispatched} · ${o.supply.dispatches} runs`} />
          </div>
          {o.supply.orders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {o.supply.orders.map((s) => (
                <span key={s.status} className="text-[11px] px-2 py-1 rounded-full bg-[var(--surface-raised)] text-[var(--muted)] capitalize">{s.status}: <span className="font-semibold text-[var(--text)]">{s.n}</span></span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Low stock & replenishment (oversight tiers) */}
      {o.ops && (
        <Section title={`Low stock & replenishment${o.ops.replenishmentOpen ? ` · ${o.ops.replenishmentOpen} pending request${o.ops.replenishmentOpen === 1 ? "" : "s"}` : ""}`} icon={<PackageX size={15} />} hint="Stores at or below their stock threshold, plus the count of open replenishment requests waiting to be dispatched.">
          {o.ops.lowStock.length === 0 ? <Empty>No stores below their stock threshold. 🎉</Empty> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)]"><Th>Store</Th><Th>Product</Th><Th right>On hand</Th><Th right>Threshold</Th></tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {o.ops.lowStock.map((r) => (
                  <tr key={`${r.nodeId}-${r.skuId}`}>
                    <Td className="text-[var(--text)]">{r.storeName ?? `Store #${r.nodeId}`}</Td>
                    <Td>{r.skuName ?? `SKU ${r.skuId}`}</Td>
                    <Td right className={`font-medium ${r.onHand <= 0 ? "text-[var(--error)]" : "text-[var(--warning)]"}`}>{r.onHand}</Td>
                    <Td right>{r.lowThreshold}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, accent = "var(--accent)", delta, hint, spark, sparkColor }: { icon: React.ReactNode; label: string; value: string; accent?: string; delta?: number; hint?: string; spark?: number[]; sparkColor?: string }) {
  return (
    <MotionCard hover className="rlp-card p-3.5">
      <div className="flex items-start justify-between">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)", color: accent }}>{icon}</span>
        <div className="flex items-center gap-1.5">
          {delta != null && <Delta pct={delta} />}
          {hint && <InfoHint text={hint} />}
        </div>
      </div>
      {/* Label first, then the number — same reading order as the agent and
          manager tiles, so the three boards don't each teach a new one. */}
      <p className="rlp-stat-label text-[9.5px] leading-tight mt-2">{label}</p>
      <p className="rlp-stat-value text-[1.5rem] mt-0.5 truncate">{value}</p>
      {spark && spark.length > 1 && <div className="mt-2 -mb-0.5"><Sparkline points={spark} color={sparkColor ?? "var(--accent)"} /></div>}
    </MotionCard>
  );
}
// Period-over-period change chip (vs the previous equal-length window).
function Delta({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-[10.5px] font-semibold text-[var(--faint)] tabular-nums">·</span>;
  const up = pct > 0;
  return (
    <span className={`text-[10.5px] font-semibold tabular-nums ${up ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--surface-raised)] rounded-lg px-2.5 py-2"><p className="text-[10.5px] text-[var(--faint)]">{label}</p><p className="text-[14px] font-semibold text-[var(--text)] tabular-nums">{value}</p></div>;
}
function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <MotionCard className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>
        {hint && <InfoHint text={hint} className="ml-0.5" />}
      </div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </MotionCard>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>; }
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right tabular-nums" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
