"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { AiCopilotDrawer } from "./AiCopilotDrawer";

export function AiTopBar({
  title,
  subtitle,
  horizon,
  onHorizonChange,
  actions,
}: {
  title: string;
  subtitle?: string;
  horizon?: string;
  onHorizonChange?: (h: string) => void;
  actions?: React.ReactNode;
}) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const horizons = [
    { key: "tomorrow", label: "Tomorrow (1D)" },
    { key: "week", label: "Next Week (7D)" },
    { key: "month", label: "Next Month (30D)" },
    { key: "quarter", label: "Next Quarter (90D)" },
    { key: "year", label: "Annual (1Y)" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white tracking-tight">{title}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Inference
              </span>
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
          </div>

          {/* Right Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Horizon Switcher */}
            {onHorizonChange && (
              <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                {horizons.map((h) => {
                  const isSelected = (horizon || "month").toLowerCase() === h.key;
                  return (
                    <button
                      key={h.key}
                      onClick={() => onHorizonChange(h.key)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom page actions */}
            {actions}

            {/* AI Copilot Trigger */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all duration-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
              <span>Ask AI Copilot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Copilot Drawer */}
      <AiCopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </>
  );
}
