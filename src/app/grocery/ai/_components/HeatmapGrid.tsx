"use client";

import React from "react";
import { Building2, MapPin } from "lucide-react";

interface RegionDemandItem {
  region: string;
  demandScore: number;
  growthPct: number;
  stockHealth: number;
  stores: number;
  predictedRevenue: number;
  topCategory: string;
}

export function HeatmapGrid({ regions }: { regions: RegionDemandItem[] }) {
  if (!regions || regions.length === 0) return null;

  return (
    <div className="rlp-card rlp-card--flat p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--accent)]" />
            <span>Regional Demand & Store Matrix</span>
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Real-time geospatial ML demand scoring across distribution clusters
          </p>
        </div>
        <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)]">
          5 Hubs Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {regions.map((r, idx) => {
          return (
            <div
              key={idx}
              className="rlp-card p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[var(--text)]">{r.region}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)] border border-[var(--border)]">
                    {r.stores} Stores
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-[10px] text-[var(--muted)] uppercase font-semibold">Demand Index</div>
                  <div className="text-xl font-black font-mono text-[var(--text)] flex items-baseline gap-1">
                    <span>{r.demandScore}</span>
                    <span className="text-xs text-[var(--success)] font-semibold">+{r.growthPct}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]/60 text-[11px]">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Proj. Rev:</span>
                  <span className="text-[var(--text)] font-mono font-medium">
                    ₹{(r.predictedRevenue / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Top Velocity:</span>
                  <span className="text-[var(--accent)] truncate max-w-[110px] text-right font-medium">
                    {r.topCategory}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Stock Health:</span>
                  <span className="text-[var(--success)] font-mono font-semibold">{r.stockHealth}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
