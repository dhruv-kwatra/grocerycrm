"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  Clock,
  Building2,
  Package,
  RefreshCw,
} from "lucide-react";
import { AiSubBar } from "../_components/AiSubBar";
import { MetricCard } from "../_components/MetricCard";

export default function DemandPredictionPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesList = ["All", "Rice", "Dairy", "Cooking Oil", "Wheat Flour", "Snacks", "Beverages", "Sugar"];

  const fetchDemand = async (cat: string) => {
    setLoading(true);
    const catQuery = cat === "All" ? "" : cat;
    try {
      const res = await fetch(`/api/ai/demand?category=${encodeURIComponent(catQuery)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch demand prediction:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand(selectedCategory);
  }, [selectedCategory]);

  const filteredProducts = (data?.products || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AiSubBar
        title="Product & Category Demand Prediction"
        subtitle="Granular SKU-level demand velocity estimation, velocity indices, and peak consumption periods"
        actions={
          <button
            onClick={() => fetchDemand(selectedCategory)}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--accent)]" : ""}`} />
          </button>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total SKUs Analyzed"
            value={data?.totalAnalyzed || 30}
            subtext="Automated daily inference"
            icon={Package}
          />

          <MetricCard
            title="Surging Demand SKUs"
            value={`${data?.highDemandSkus || 18} SKUs`}
            delta={24.5}
            deltaLabel="Demand Score >= 75"
            subtext="Priority replenishment"
            icon={TrendingUp}
            badge="High Growth"
          />

          <MetricCard
            title="Imminent Stockout Risk"
            value={`${data?.stockoutRiskCount || 6} SKUs`}
            delta={-14.2}
            deltaLabel="Supply < 5 days"
            subtext="Action required"
            icon={AlertTriangle}
            badge="Urgent"
          />

          <MetricCard
            title="Low Demand Warnings"
            value={`${data?.lowDemandSkus || 4} SKUs`}
            subtext="Velocity < 2 units/day"
            icon={Clock}
          />
        </div>

        {/* Store Comparison Grid */}
        <div className="rlp-card rlp-card--flat p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[var(--accent)]" />
                <span>Store-Level Demand Velocity Comparison</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Comparative demand index across retail outlet tiers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(data?.storeComparisons || []).map((st: any, idx: number) => (
              <div key={idx} className="rlp-card p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-[var(--text)] truncate max-w-[120px]">{st.store}</span>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-bold">Idx: {st.demandIndex}</span>
                </div>
                <div className="text-[11px] text-[var(--muted)]">{st.city}</div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border)]/60">
                  <span className="text-[11px] text-[var(--muted)]">Growth:</span>
                  <span className="text-[var(--success)] font-mono font-bold">+{st.growthPct}%</span>
                </div>
                <div className="text-[10px] text-[var(--muted)] truncate">
                  Top: <span className="text-[var(--text)] font-medium">{st.topDemandCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Bar & SKU Table */}
        <div className="rlp-card rlp-card--flat p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center flex-wrap gap-1.5">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)] text-white shadow-xs"
                        : "bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search SKU or Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] placeholder:text-[var(--faint)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] font-semibold uppercase text-[10px]">
                  <th className="pb-3">Product Name / Brand</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Demand Score</th>
                  <th className="pb-3">Daily Velocity</th>
                  <th className="pb-3">7-Day Demand</th>
                  <th className="pb-3">30-Day Demand</th>
                  <th className="pb-3">Peak Time Window</th>
                  <th className="pb-3">Days of Supply</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60 font-mono">
                {filteredProducts.map((p: any, idx: number) => {
                  const isHigh = p.demandScore >= 75;
                  const isRisk = p.stockoutRisk;

                  return (
                    <tr key={idx} className="hover:bg-[var(--surface-raised)]/60 transition-colors">
                      <td className="py-3 font-sans">
                        <div className="font-semibold text-[var(--text)]">{p.name}</div>
                        <div className="text-[11px] text-[var(--muted)]">{p.brand} • ₹{p.price}</div>
                      </td>
                      <td className="py-3 text-[var(--muted)] font-sans">{p.category}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[var(--surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]"
                              style={{ width: `${p.demandScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-[var(--text)]">{p.demandScore}</span>
                        </div>
                      </td>
                      <td className="py-3 text-[var(--muted)]">{p.dailyVelocity} units/day</td>
                      <td className="py-3 text-[var(--accent)] font-bold">{p.predictedDemand7D}</td>
                      <td className="py-3 text-[var(--text)] font-bold">{p.predictedDemand30D}</td>
                      <td className="py-3 font-sans text-[var(--muted)]">{p.peakPeriod}</td>
                      <td className="py-3">
                        <span
                          className={`font-bold ${
                            p.daysOfSupply < 5
                              ? "text-[var(--error)]"
                              : p.daysOfSupply < 15
                              ? "text-[var(--warning)]"
                              : "text-[var(--success)]"
                          }`}
                        >
                          {p.daysOfSupply} days
                        </span>
                      </td>
                      <td className="py-3 font-sans">
                        {isRisk ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/30 font-semibold">
                            Stockout Risk
                          </span>
                        ) : isHigh ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30 font-semibold">
                            High Velocity
                          </span>
                        ) : p.lowDemandWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/30">
                            Low Velocity
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/30">
                            Balanced
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
