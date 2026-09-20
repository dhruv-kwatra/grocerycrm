"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, EyeOff, BarChart3 } from "lucide-react";

// Scoped sales insight rail shared by every retail list page: 4 KPI cards on
// top, a 30-day sales trend card pinned to the right on xl (and floated above
// the list below xl), with a per-browser hide toggle. Data comes from
// GET /api/retail/analytics/sales-series (fetched server-side by each page and
// passed in); a null payload just renders the list with no rail.
export type Insights = {
  role: string;
  kpis: { revenue: number; orders: number; units: number; aov: number };
  deltas: { revenue: number; orders: number; units: number; aov: number };
  series: { date: string; label: string; revenue: number; orders: number; units: number }[];
};

type Metric = "revenue" | "orders" | "units";
const METRICS: { id: Metric; label: string }[] = [
  { id: "revenue", label: "Revenue" },
  { id: "orders", label: "Orders" },
  { id: "units", label: "Units" },
];
const HIDE_KEY = "retail.insights.hidden";

const inrShort = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}k` : `₹${Math.round(n)}`;
const num = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmt: Record<Metric, (n: number) => string> = { revenue: inrShort, orders: num, units: num };

export function ListShell({ insights, children }: { insights: Insights | null; children: React.ReactNode }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(HIDE_KEY) === "1");
    setReady(true);
  }, []);
  const setHide = (v: boolean) => {
    setHidden(v);
    localStorage.setItem(HIDE_KEY, v ? "1" : "0");
  };

  // No data / endpoint 403 / missing kpis → just the list, no rail.
  if (!insights || !insights.kpis) return <>{children}</>;

  const { kpis, deltas } = insights;
  const cards: { label: string; value: string; delta: number }[] = [
    { label: "Revenue · 30d", value: inrShort(kpis.revenue), delta: deltas.revenue },
    { label: "Orders · 30d", value: num(kpis.orders), delta: deltas.orders },
    { label: "Units · 30d", value: num(kpis.units), delta: deltas.units },
    { label: "Avg order", value: inrShort(kpis.aov), delta: deltas.aov },
  ];
  // Avoid the pre-hydration flash: until we've read localStorage, assume shown.
  const showChart = ready ? !hidden : true;

  return (
    <div className="space-y-4">
      {/* 4 KPI cards — always on top, full width */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rlp-card p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--faint)]">{c.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-lg font-bold text-[var(--text)] tabular-nums">{c.value}</span>
              <Delta v={c.delta} />
            </div>
          </div>
        ))}
      </div>

      {/* List (main) + sticky trend (right on xl, above the list below xl) */}
      <div
        className={`flex flex-col-reverse gap-4 xl:grid ${
          showChart ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        <div className="min-w-0 space-y-5">{children}</div>
        <aside className="xl:sticky xl:top-4 xl:self-start">
          {showChart ? (
            <div className="rlp-card p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-[var(--accent)]" /> Sales · 30 days
                </h3>
                <button
                  type="button"
                  onClick={() => setHide(true)}
                  aria-label="Hide sales insights"
                  className="text-[var(--faint)] hover:text-[var(--text)]"
                >
                  <EyeOff size={15} />
                </button>
              </div>
              <div className="flex gap-1 mb-2">
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      metric === m.id ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={insights.series} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="listShellFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--faint)" }} interval={6} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--faint)" }} width={38} tickFormatter={(v: number) => fmt[metric](v)} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(v) => [fmt[metric](Number(v)), METRICS.find((m) => m.id === metric)!.label]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
                    />
                    <Area type="monotone" dataKey={metric} stroke="var(--accent)" strokeWidth={2} fill="url(#listShellFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHide(false)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-raised)] xl:writing-mode-vertical"
            >
              <BarChart3 size={14} /> Show sales
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function Delta({ v }: { v: number }) {
  if (!v) return <span className="text-[11px] text-[var(--faint)]">—</span>;
  const up = v > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${up ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{v}%
    </span>
  );
}
