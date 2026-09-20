"use client";

import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  ShieldAlert,
  Archive,
  CheckCircle2,
  RefreshCw,
  Search,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AiSubBar } from "../_components/AiSubBar";
import { MetricCard } from "../_components/MetricCard";

export default function InventoryForecastPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/inventory");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch inventory forecast:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const summary = data?.summary || {};
  const items = data?.items || [];

  const filteredItems = items.filter((item: any) => {
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Stockout" && item.status === "Stock Out Risk") ||
      (statusFilter === "Overstock" && item.status === "Overstock") ||
      (statusFilter === "Healthy" && item.status === "Healthy Inventory");

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AiSubBar
        title="Predictive Inventory & Stock Depletion Forecast"
        subtitle="Multi-horizon 7, 15, 30, 60, 90-day inventory burn modeling and working capital optimization"
        actions={
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--accent)]" : ""}`} />
          </button>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Stock Out Risk"
            value={`${summary.stockoutRiskCount || 6} SKUs`}
            delta={-18.4}
            deltaLabel="Lead time breached"
            subtext={`Capital at risk: ₹${((summary.capitalAtRisk || 380000) / 1000).toFixed(0)}k`}
            icon={ShieldAlert}
            badge="Action Needed"
          />

          <MetricCard
            title="Overstock Positions"
            value={`${summary.overstockCount || 8} SKUs`}
            delta={12.0}
            deltaLabel="> 55 days turnover"
            subtext={`Holding cost: ₹${((summary.overstockHoldingCost || 45000) / 1000).toFixed(0)}k/mo`}
            icon={Archive}
            badge="Markdown Candidate"
          />

          <MetricCard
            title="Healthy Stock Equilibrium"
            value={`${summary.healthyCount || 21} SKUs`}
            delta={8.2}
            deltaLabel="Target turnover (15-45D)"
            subtext="Optimal safety buffer"
            icon={CheckCircle2}
            badge="Optimal"
          />

          <MetricCard
            title="Total Catalog SKUs"
            value={`${summary.totalSkus || 35} Items`}
            subtext="Automated burn tracking"
            icon={PackageCheck}
          />
        </div>

        {/* 90-Day Aggregate Depletion Curve */}
        <div className="rlp-card rlp-card--flat p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-[var(--accent)]" />
                <span>90-Day Network Aggregate Stock Depletion Curve</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Projected overall unit decay and cumulative capital tied without replenishment
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.aggregateTimeline || []}>
                <defs>
                  <linearGradient id="invGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} tickFormatter={(val) => `${val}u`} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] text-xs font-mono space-y-1 text-[var(--text)]">
                          <div className="font-bold">{d.day}</div>
                          <div className="text-[var(--accent)]">Projected Units: {d.projectedUnits}</div>
                          <div className="text-[var(--success)]">Capital Tied: ₹{d.capitalTied.toLocaleString()}</div>
                          <div className="text-[var(--error)]">Stockout Risk: {d.stockoutProbability}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="projectedUnits"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#invGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKU Depletion Horizon Table */}
        <div className="rlp-card rlp-card--flat p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs">
              {[
                { id: "All", label: "All Items" },
                { id: "Stockout", label: "Stockout Risk" },
                { id: "Overstock", label: "Overstock" },
                { id: "Healthy", label: "Healthy" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === t.id
                      ? "bg-[var(--accent)] text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search Item or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] placeholder:text-[var(--faint)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] font-semibold uppercase text-[10px]">
                  <th className="pb-3">Product / SKU</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Current Stock</th>
                  <th className="pb-3">Burn Rate</th>
                  <th className="pb-3">Lead Time</th>
                  <th className="pb-3">Days Left</th>
                  <th className="pb-3">7D Proj.</th>
                  <th className="pb-3">30D Proj.</th>
                  <th className="pb-3">60D Proj.</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 font-mono">
                {filteredItems.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--surface-raised)]/60 transition-colors">
                    <td className="py-3 font-sans">
                      <div className="font-semibold text-[var(--text)]">{item.name}</div>
                      <div className="text-[11px] text-[var(--muted)]">{item.brand}</div>
                    </td>
                    <td className="py-3 text-[var(--muted)] font-sans">{item.category}</td>
                    <td className="py-3 text-[var(--text)] font-bold">{item.currentStock} units</td>
                    <td className="py-3 text-[var(--muted)]">{item.dailyBurnRate} u/day</td>
                    <td className="py-3 text-[var(--faint)]">{item.leadTimeDays} days</td>
                    <td className="py-3">
                      <span
                        className={`font-bold ${
                          item.daysToStockout <= item.leadTimeDays
                            ? "text-[var(--error)]"
                            : item.daysToStockout > 55
                            ? "text-[var(--warning)]"
                            : "text-[var(--success)]"
                        }`}
                      >
                        {item.daysToStockout}d
                      </span>
                    </td>
                    <td className="py-3 text-[var(--text)]">{item.projectedStock.d7}</td>
                    <td className="py-3 text-[var(--text)]">{item.projectedStock.d30}</td>
                    <td className="py-3 text-[var(--muted)]">{item.projectedStock.d60}</td>
                    <td className="py-3 font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === "Stock Out Risk"
                            ? "bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/30"
                            : item.status === "Overstock"
                            ? "bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/30"
                            : "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
