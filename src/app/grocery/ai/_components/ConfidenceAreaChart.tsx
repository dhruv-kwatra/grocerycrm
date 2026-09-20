"use client";

import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ForecastDataPoint {
  date: string;
  label: string;
  isFuture: boolean;
  actual?: number | null;
  predicted: number;
  upperCI?: number;
  lowerCI?: number;
  upperBand?: number;
  lowerBand?: number;
  movingAvg7?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const isFuture = data?.isFuture;

    return (
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] p-3.5 shadow-xl text-xs space-y-1.5 min-w-[200px] text-[var(--text)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
          <span className="font-bold text-[var(--text)]">{data?.label || label}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
              isFuture
                ? "bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30"
                : "bg-[var(--secondary-light)] text-[var(--secondary-dark)] border border-[var(--secondary)]/30"
            }`}
          >
            {isFuture ? "AI Prediction" : "Historical Actual"}
          </span>
        </div>

        {data?.actual !== undefined && data?.actual !== null && (
          <div className="flex items-center justify-between text-[var(--secondary)] font-mono">
            <span>Actual Revenue:</span>
            <span className="font-bold">₹{Number(data.actual).toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[var(--accent)] font-mono">
          <span>Predicted Forecast:</span>
          <span className="font-bold">₹{Number(data.predicted).toLocaleString("en-IN")}</span>
        </div>

        {(data?.upperCI || data?.upperBand) && (
          <div className="flex items-center justify-between text-[var(--muted)] font-mono text-[11px]">
            <span>95% Upper Bound:</span>
            <span>₹{Number(data.upperCI || data.upperBand).toLocaleString("en-IN")}</span>
          </div>
        )}

        {(data?.lowerCI || data?.lowerBand) && (
          <div className="flex items-center justify-between text-[var(--muted)] font-mono text-[11px]">
            <span>95% Lower Bound:</span>
            <span>₹{Number(data.lowerCI || data.lowerBand).toLocaleString("en-IN")}</span>
          </div>
        )}

        {data?.movingAvg7 && (
          <div className="flex items-center justify-between text-[var(--warning)] font-mono text-[11px]">
            <span>7-Day Moving Avg:</span>
            <span>₹{Number(data.movingAvg7).toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ConfidenceAreaChart({
  data,
  height = 360,
  title = "Multi-Horizon Forecast vs Historical Actuals",
}: {
  data: ForecastDataPoint[];
  height?: number;
  title?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="rlp-card rlp-card--flat h-64 flex items-center justify-center text-[var(--muted)] text-sm">
        No forecast data available
      </div>
    );
  }

  const todayPoint = data.find((d) => d.isFuture)?.label;

  return (
    <div className="rlp-card rlp-card--flat p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">{title}</h3>
          <p className="text-xs text-[var(--muted)]">
            Shaded ribbon represents 95% Bayesian Confidence Intervals (±2σ)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--secondary)]" />
            <span className="text-[var(--text)]">Actuals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text)]">AI Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded bg-[var(--accent-light)] border border-[var(--accent)]/40" />
            <span className="text-[var(--muted)] text-[11px]">95% CI Ribbon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-[var(--warning)] border-dashed" />
            <span className="text-[var(--muted)] text-[11px]">7D MA</span>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ciBandGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis
              stroke="var(--muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {todayPoint && (
              <ReferenceLine
                x={todayPoint}
                stroke="var(--accent)"
                strokeDasharray="4 4"
                label={{
                  value: "Today (Inference Horizon)",
                  fill: "var(--accent-dark)",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey={(d) => d.upperCI || d.upperBand}
              stroke="transparent"
              fill="url(#ciBandGlow)"
              name="Upper 95% CI"
            />

            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--secondary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--secondary)" }}
              activeDot={{ r: 5, fill: "var(--secondary-dark)" }}
              name="Actuals"
            />

            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "var(--accent-dark)" }}
              name="AI Prediction"
            />

            <Line
              type="monotone"
              dataKey="movingAvg7"
              stroke="var(--warning)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="7D MA"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
