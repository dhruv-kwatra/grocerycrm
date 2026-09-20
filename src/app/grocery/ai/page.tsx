"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Zap,
  ShieldAlert,
  Clock,
  Sparkles,
  Package,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AiSubBar } from "./_components/AiSubBar";
import { MetricCard } from "./_components/MetricCard";
import { ConfidenceAreaChart } from "./_components/ConfidenceAreaChart";
import { HeatmapGrid } from "./_components/HeatmapGrid";

export default function AiOverviewPage() {
  const [horizon, setHorizon] = useState("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchOverview = async (h: string) => {
    setLoading(true);
    const horizonDays = h === "tomorrow" ? 1 : h === "week" ? 7 : h === "quarter" ? 90 : h === "year" ? 365 : 30;
    try {
      const res = await fetch(`/api/ai/overview?horizon=${horizonDays}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch overview data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(horizon);
  }, [horizon]);

  const kpis = data?.kpis || {};

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AiSubBar
        title="AI Intelligence & Forecasting Overview"
        subtitle="Unified multi-horizon demand forecasting and autonomous inventory intelligence"
        horizon={horizon}
        onHorizonChange={(h) => setHorizon(h)}
        actions={
          <button
            onClick={() => fetchOverview(horizon)}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Refresh Inference"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--accent)]" : ""}`} />
          </button>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Prescriptive Notification Banner */}
        <div className="rlp-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/40 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-[var(--accent)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[var(--text)]">AI Prescriptive Recommendations</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30 font-semibold">
                  Confidence 97.4%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30 font-bold">
                  Self-Learning • 94.4k DB Records
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Weekend demand surge detected for <span className="text-[var(--accent)] font-semibold">Basmati Rice</span> &amp; <span className="text-[var(--accent)] font-semibold">Amul Milk</span>.
                14 SKUs require automated replenishment before Thursday.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/grocery/ai/insights"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 transition-colors"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              <span>View All Insights</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </Link>
          </div>
        </div>

        {/* 8 Primary KPI Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Predicted Revenue"
            value={`₹${((kpis.predictedRevenue || 17600000) / 100000).toFixed(1)} Lakh`}
            delta={kpis.revenueGrowthPct || 18.5}
            deltaLabel="vs previous cycle"
            subtext="95% CI: [₹16.8L - ₹18.4L]"
            icon={TrendingUp}
            badge="XGBoost"
          />

          <MetricCard
            title="Expected Orders"
            value={Number(kpis.expectedOrders || 66700).toLocaleString("en-IN")}
            delta={kpis.ordersGrowthPct || 14.2}
            deltaLabel="vs baseline"
            subtext="Avg basket: ₹485.50"
            icon={ShoppingCart}
            badge="Prophet"
          />

          <MetricCard
            title="Forecast Accuracy"
            value={`${kpis.forecastAccuracy || 96.4}%`}
            delta={1.2}
            deltaLabel="MAPE: 4.12%"
            subtext="Directional Acc: 93.8%"
            icon={Zap}
            badge="Ensemble"
          />

          <MetricCard
            title="Products At Stockout Risk"
            value={`${kpis.productsAtRisk || 14} SKUs`}
            delta={-21.4}
            deltaLabel="depleting < 5 days"
            subtext="Loss at risk: ₹4.75 Lakh"
            icon={ShieldAlert}
            badge="Critical"
          />
        </div>

        {/* Forecast Timeline Chart */}
        <ConfidenceAreaChart
          data={data?.forecastTrend || []}
          height={380}
          title="Multi-Horizon Revenue Forecast Curve with 95% Confidence Bounds"
        />

        {/* Middle Two-Column Section: Top Growing Categories & Seasonality */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Growing Categories (2 Cols) */}
          <div className="lg:col-span-2 rlp-card rlp-card--flat p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Package className="h-4 w-4 text-[var(--accent)]" />
                  <span>Category Growth Projections</span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Predicted category volume velocities and revenue contribution
                </p>
              </div>
              <Link
                href="/grocery/ai/demand"
                className="text-xs text-[var(--accent)] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Demand Details</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)] font-semibold uppercase text-[10px]">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Predicted Volume</th>
                    <th className="pb-3">Est. Revenue</th>
                    <th className="pb-3">Growth Lift</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60 font-mono">
                  {(data?.categoriesGrowth || []).map((cat: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[var(--surface-raised)]/60 transition-colors">
                      <td className="py-3 font-sans font-semibold text-[var(--text)]">{cat.category}</td>
                      <td className="py-3 text-[var(--muted)]">{Number(cat.predictedVolume).toLocaleString()} units</td>
                      <td className="py-3 text-[var(--text)] font-bold">₹{(cat.revenueEst / 100000).toFixed(1)}L</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-0.5 text-[var(--success)] font-bold">
                          +{cat.growthPct}%
                        </span>
                      </td>
                      <td className="py-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30 font-semibold">
                          {cat.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intraday Seasonality Breakdown (1 Col) */}
          <div className="rlp-card rlp-card--flat p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--secondary)]" />
                  <span>Diurnal Seasonality</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--secondary-light)] text-[var(--secondary-dark)] border border-[var(--secondary)]/30">
                  Hourly Mix
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mb-4">
                Peak shopping hour distribution to optimize staffing and shelf replenishment.
              </p>

              <div className="space-y-3">
                {(data?.seasonality || []).map((s: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text)]">{s.period}</span>
                      <span className="text-[var(--accent)] font-mono">{s.share}% Share</span>
                    </div>
                    <div className="w-full bg-[var(--surface)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className="bg-[var(--accent)] h-full rounded-full"
                        style={{ width: `${s.share * 2}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--muted)]">
                      <span>Peak: {s.peakCategory}</span>
                      <span className="text-[var(--accent)] font-mono font-medium">{s.velocityIndex}x velocity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--muted)] flex items-center justify-between">
              <span>Primary Surge:</span>
              <span className="font-semibold text-[var(--text)]">16:00 - 21:00 (Evening)</span>
            </div>
          </div>
        </div>

        {/* Regional Geospatial Demand Heatmap */}
        <HeatmapGrid regions={data?.regions || []} />
      </main>
    </div>
  );
}
