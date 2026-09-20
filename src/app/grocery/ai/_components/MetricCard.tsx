"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  subtext?: string;
  icon: LucideIcon;
  gradient?: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "violet";
  tooltip?: string;
  badge?: string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel = "vs baseline",
  subtext,
  icon: Icon,
  badge,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className="rlp-card p-5 flex flex-col justify-between h-full transition-all duration-200">
      <div>
        {/* Top row: title & icon */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="rlp-stat-label">{title}</span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30">
                {badge}
              </span>
            )}
            <div className="p-2 rounded-xl bg-[var(--surface-raised)] text-[var(--accent)] border border-[var(--border)]">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Main Value */}
        <div className="my-1">
          <div className="rlp-stat-value">{value}</div>
        </div>
      </div>

      {/* Bottom Delta & Subtext */}
      <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-[var(--border)]/60">
        {delta !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`rlp-stat-delta px-1.5 py-0.5 rounded text-[11px] font-mono ${
                isPositive
                  ? "bg-[var(--success-bg)] text-[var(--success)]"
                  : "bg-[var(--error-bg)] text-[var(--error)]"
              }`}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}
              {delta}%
            </span>
            <span className="text-[11px] text-[var(--muted)]">{deltaLabel}</span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--muted)]">{subtext || "AI Optimized"}</span>
        )}
        {subtext && delta !== undefined && (
          <span className="text-[11px] text-[var(--muted)] font-medium truncate max-w-[40%] text-right">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
