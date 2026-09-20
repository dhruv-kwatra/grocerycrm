"use client";

// Interactive recharts charts for the in-app analytics page, themed with the
// retail app tokens (--text/--surface/--border/--accent…). Heavy (~100kb gz
// incl. d3), so page.tsx pulls them through lazyAnalyticsCharts (ssr:false).
// Every analytics chart lives here now (the old pure-SVG RetailCharts is gone).

import {
  AreaChart, Area, BarChart, Bar, Cell, LabelList, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, PieChart, Pie,
  ScatterChart, Scatter,
} from "recharts";

export type SkuRow = { name: string; units: number; revenue: number };
export type ScoreWeek = { label: string; score: number };
export type SegRow = { segment: string; n: number };
export type ChannelRow = { name: string; revenue: number; bills: number; avgTxn: number };
export type StepRow = { label: string; rate: number };
export type ScatterRow = { name: string; revenue: number; avgTxn: number; bills: number };

// Indian-format INR, compact above ₹1L (same convention as the CRM dashboard).
const inrC = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    maximumFractionDigits: n >= 1_00_000 ? 1 : 0,
    notation: n >= 1_00_000 ? "compact" : "standard",
  }).format(n);
const num = (n: number) => n.toLocaleString("en-IN");

const RANK = ["var(--accent)", "#D0473F", "#DE726B", "#E99A95", "#F1BCB8", "#F6D4D1"];
const SEG_COLOR: Record<string, string> = {
  high_value: "var(--accent)", loyal: "#2FB68F", regular: "#5B8DEF",
  new: "#7FA3E0", at_risk: "#D9930D", dormant: "#9A9CA3",
};
const SEG_LABEL: Record<string, string> = {
  high_value: "High-Value", loyal: "Loyal", regular: "Regular",
  new: "New", at_risk: "At Risk", dormant: "Dormant",
};

function Tip({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-card)] text-[11px]">
      <p className="font-semibold text-[var(--text)] mb-0.5">{title}</p>
      {rows.map(([k, v]) => (
        <p key={k} className="text-[var(--muted)]">{k} <span className="tabular-nums font-medium text-[var(--text)] ml-1.5">{v}</span></p>
      ))}
    </div>
  );
}
type TP<T> = { active?: boolean; payload?: { payload: T }[] };

/* ---------- top products by revenue ---------- */
function SkuTip({ active, payload }: TP<SkuRow>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.name} rows={[["Revenue", inrC(p.revenue)], ["Units", num(p.units)]]} />;
}
export function TopProductsChart({ data }: { data: SkuRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, bottom: 0, left: 8 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="name" width={128} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false}
          tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<SkuTip />} />
        <Bar dataKey="revenue" barSize={18} radius={4}>
          {data.map((d, i) => (<Cell key={d.name} fill={RANK[i % RANK.length]} />))}
          <LabelList dataKey="revenue" position="right" formatter={(v: any) => inrC(Number(v))}
            style={{ fontSize: 10.5, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- planogram compliance by store ---------- */
export type StoreScore = { name: string; score: number; belowTarget: boolean };
function StoreScoreTip({ active, payload, target }: TP<StoreScore> & { target: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.name} rows={[["Score", `${p.score} / 100`], ["Status", p.belowTarget ? `Below target (${target})` : "On target"]]} />;
}
export function ComplianceByStoreChart({ stores, target }: { stores: StoreScore[]; target: number }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, stores.length * 40)}>
      <BarChart data={stores} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis type="category" dataKey="name" width={128} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false}
          tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<StoreScoreTip target={target} />} />
        <ReferenceLine x={target} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 4"
          label={{ value: `target ${target}`, position: "insideTopRight", fontSize: 10, fill: "var(--warning)" }} />
        <Bar dataKey="score" barSize={20} radius={4} isAnimationActive>
          {stores.map((s) => (<Cell key={s.name} fill={s.belowTarget ? "var(--warning)" : "var(--success)"} />))}
          <LabelList dataKey="score" position="right"
            style={{ fontSize: 11, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- compliance trend (network score / week) ---------- */
function ScoreTip({ active, payload, target }: TP<ScoreWeek> & { target: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.label} rows={[["Network score", `${p.score} / 100`], ["vs target", `${p.score - target >= 0 ? "+" : ""}${p.score - target}`]]} />;
}
export function ComplianceTrendChart({ weeks, target }: { weeks: ScoreWeek[]; target: number }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={weeks} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="raScoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--faint)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10.5, fill: "var(--faint)" }} tickLine={false} axisLine={false} width={28} />
        <Tooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<ScoreTip target={target} />} />
        <ReferenceLine y={target} stroke="var(--warning)" strokeWidth={1.2} strokeDasharray="4 4" />
        <Area type="monotone" dataKey="score" stroke="var(--success)" strokeWidth={2} fill="url(#raScoreFill)" activeDot={{ r: 3.5, fill: "var(--success)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- customer segment mix (donut) ---------- */
function SegTip({ active, payload }: TP<SegRow & { total: number }>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const share = p.total > 0 ? Math.round((p.n / p.total) * 100) : 0;
  return <Tip title={SEG_LABEL[p.segment] ?? p.segment} rows={[["Customers", num(p.n)], ["Share", `${share}%`]]} />;
}
export function SegmentDonut({ segments }: { segments: SegRow[] }) {
  const total = segments.reduce((s, d) => s + d.n, 0);
  const data = segments.map((s) => ({ ...s, total }));
  return (
    <div className="flex items-center gap-4 h-[210px]">
      <div className="relative w-[150px] h-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="n" nameKey="segment" cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={1.5} stroke="var(--surface)" strokeWidth={2}>
              {data.map((d) => (<Cell key={d.segment} fill={SEG_COLOR[d.segment] ?? "#9CA3AF"} />))}
            </Pie>
            <Tooltip content={<SegTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[16px] font-bold text-[var(--text)] tabular-nums leading-none">{num(total)}</span>
          <span className="text-[9.5px] text-[var(--faint)] mt-0.5">customers</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {[...data].sort((a, b) => b.n - a.n).map((d) => (
          <div key={d.segment} className="flex items-center gap-2 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: SEG_COLOR[d.segment] ?? "#9CA3AF" }} />
            <span className="text-[var(--muted)] flex-1 min-w-0 truncate">{SEG_LABEL[d.segment] ?? d.segment}</span>
            <span className="tabular-nums font-semibold text-[var(--text)]">{total > 0 ? Math.round((d.n / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- footfall → sale funnel (recharts: tooltip + animation) ---------- */
export type FunnelStage = { stage: string; value: number; pct: number };
const FUNNEL_RAMP = ["var(--accent)", "#D4564F", "#E28F8A", "#EFC1BE"];
function FunnelTip({ active, payload }: TP<FunnelStage & { step: number | null }>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <Tip title={p.stage} rows={[
      ["Count", num(p.value)],
      ["Of footfall", `${p.pct}%`],
      ...(p.step != null ? ([["From previous stage", `${p.step}%`]] as [string, string][]) : []),
    ]} />
  );
}
export function FunnelBarChart({ stages }: { stages: FunnelStage[] }) {
  const data = stages.map((s, i) => ({
    ...s,
    step: i === 0 ? null : stages[i - 1].value > 0 ? Math.round((s.value / stages[i - 1].value) * 100) : null,
  }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 8 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="stage" width={88} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<FunnelTip />} />
        <Bar dataKey="value" barSize={26} radius={4} isAnimationActive>
          {data.map((d, i) => (<Cell key={d.stage} fill={FUNNEL_RAMP[i % FUNNEL_RAMP.length]} />))}
          <LabelList dataKey="value" position="right" formatter={(v: any) => num(Number(v))}
            style={{ fontSize: 11, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- weekly sell-through (focus vs other, recharts) ---------- */
export type SellWeek = { label: string; focus: number; other: number };
function SellTip({ active, payload }: TP<SellWeek>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const total = p.focus + p.other;
  return (
    <Tip title={p.label} rows={[
      ["Focus SKUs", `${num(p.focus)} u`],
      ["Other SKUs", `${num(p.other)} u`],
      ["Focus share", total > 0 ? `${Math.round((p.focus / total) * 100)}%` : "—"],
    ]} />
  );
}
export function SellThroughChart({ weeks }: { weeks: SellWeek[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={weeks} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="raFocusFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="raOtherFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--faint)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={8} />
        <YAxis tick={{ fontSize: 10.5, fill: "var(--faint)" }} tickLine={false} axisLine={false} width={30} />
        <Tooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<SellTip />} />
        <Area type="monotone" dataKey="other" name="Other SKUs" stroke="#5B8DEF" strokeWidth={1.5} fill="url(#raOtherFill)" activeDot={{ r: 3, fill: "#5B8DEF" }} isAnimationActive />
        <Area type="monotone" dataKey="focus" name="Focus SKUs" stroke="var(--accent)" strokeWidth={2} fill="url(#raFocusFill)" activeDot={{ r: 3.5, fill: "var(--accent)" }} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- daily trend (bills / footfall) & weekly bars (demos / growth) ---------- */
export type Pt = { label: string; value: number };
const isMoney = (fmt?: "money") => fmt === "money";
function PtTip({ active, payload, name, fmt }: TP<Pt> & { name: string; fmt?: "money" }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.label} rows={[[name, isMoney(fmt) ? inrC(p.value) : num(p.value)]]} />;
}

export function TrendAreaChart({ data, color, name, fmt }: { data: Pt[]; color: string; name: string; fmt?: "money" }) {
  const id = `raTrend-${name.replace(/\W/g, "")}`;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9.5, fill: "var(--faint)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" minTickGap={20} />
        <YAxis tick={{ fontSize: 10, fill: "var(--faint)" }} tickLine={false} axisLine={false} width={34} tickFormatter={(v: number) => (isMoney(fmt) ? inrC(v) : num(v))} />
        <Tooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<PtTip name={name} fmt={fmt} />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} activeDot={{ r: 3, fill: color }} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBarChart({ data, color, name }: { data: Pt[]; color: string; name: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--faint)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={0} />
        <YAxis tick={{ fontSize: 10, fill: "var(--faint)" }} tickLine={false} axisLine={false} width={30} />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<PtTip name={name} />} />
        <Bar dataKey="value" barSize={34} radius={[4, 4, 0, 0]} fill={color}>
          <LabelList dataKey="value" position="top" formatter={(v: any) => num(Number(v))}
            style={{ fontSize: 10.5, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- funnel stage-conversion rates ---------- */
function StepTip({ active, payload }: TP<StepRow>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.label} rows={[["Conversion", `${p.rate}%`]]} />;
}
export function StageConvChart({ steps }: { steps: StepRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={steps} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--faint)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={0} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10.5, fill: "var(--faint)" }} tickLine={false} axisLine={false} width={28} unit="%" />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<StepTip />} />
        <Bar dataKey="rate" barSize={54} radius={[4, 4, 0, 0]} fill="var(--accent)">
          <LabelList dataKey="rate" position="top" formatter={(v: any) => `${v}%`}
            style={{ fontSize: 11, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- store efficiency scatter (revenue × avg-ticket, size=bills) ---------- */
function ScatterTip({ active, payload }: TP<ScatterRow>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.name} rows={[["Revenue", inrC(p.revenue)], ["Avg ticket", inrC(p.avgTxn)], ["Bills", num(p.bills)]]} />;
}
export function StoreScatter({ rows }: { rows: ScatterRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <ScatterChart margin={{ top: 10, right: 16, bottom: 4, left: -6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="revenue" name="Revenue" tick={{ fontSize: 10, fill: "var(--faint)" }}
          tickLine={false} axisLine={{ stroke: "var(--border)" }} tickFormatter={(v: number) => inrC(v)} />
        <YAxis type="number" dataKey="avgTxn" name="Avg ticket" tick={{ fontSize: 10, fill: "var(--faint)" }}
          tickLine={false} axisLine={false} tickFormatter={(v: number) => inrC(v)} width={52} />
        <ZAxis type="number" dataKey="bills" range={[80, 520]} name="Bills" />
        <Tooltip cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }} content={<ScatterTip />} />
        <Scatter data={rows} fill="var(--accent)" fillOpacity={0.7}>
          <LabelList dataKey="name" position="top" style={{ fontSize: 10, fill: "var(--muted)" }} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ---------- revenue by channel / store ---------- */
function ChTip({ active, payload }: TP<ChannelRow>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <Tip title={p.name} rows={[["Revenue", inrC(p.revenue)], ["Bills", num(p.bills)], ["Avg ticket", inrC(p.avgTxn)]]} />;
}
export function RevenueByChannelChart({ rows }: { rows: ChannelRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 8 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="name" width={128} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false}
          tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)} />
        <Tooltip cursor={{ fill: "color-mix(in srgb, var(--muted) 10%, transparent)" }} content={<ChTip />} />
        <Bar dataKey="revenue" barSize={22} radius={4} fill="var(--accent)">
          <LabelList dataKey="revenue" position="right" formatter={(v: any) => inrC(Number(v))}
            style={{ fontSize: 10.5, fontWeight: 700, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
