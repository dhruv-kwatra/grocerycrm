"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  PackageCheck,
  Zap,
  Clock,
  Users,
  Percent,
  Lightbulb,
  Cpu,
  Settings,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { AiCopilotDrawer } from "./AiCopilotDrawer";

export const AI_NAV_SUBITEMS = [
  { label: "Overview", href: "/grocery/ai", icon: LayoutDashboard },
  { label: "Sales Forecasting", href: "/grocery/ai/sales", icon: TrendingUp },
  { label: "Demand Prediction", href: "/grocery/ai/demand", icon: Target },
  { label: "Inventory Forecast", href: "/grocery/ai/inventory", icon: PackageCheck },
  { label: "AI Insights", href: "/grocery/ai/insights", icon: Lightbulb },
  { label: "Model Performance", href: "/grocery/ai/models", icon: Cpu },
  { label: "AI Settings", href: "/grocery/ai/settings", icon: Settings },
];

export function AiSubBar({
  title,
  subtitle,
  horizon,
  onHorizonChange,
  actions,
}: {
  title?: string;
  subtitle?: string;
  horizon?: string;
  onHorizonChange?: (h: string) => void;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const horizons = [
    { key: "tomorrow", label: "1D" },
    { key: "week", label: "7D" },
    { key: "month", label: "30D" },
    { key: "quarter", label: "90D" },
    { key: "year", label: "1Y" },
  ];

  const currentTab = AI_NAV_SUBITEMS.find((item) => item.href === pathname) || AI_NAV_SUBITEMS[0];

  return (
    <>
      <div className="shrink-0 bg-[var(--surface)] border-b border-[var(--border)] transition-colors duration-200">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="px-3.5 sm:px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)]/60">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--muted)] mb-1">
              <Link href="/retail" className="hover:text-[var(--text)] transition-colors">
                Retail Portal
              </Link>
              <ChevronRight size={12} />
              <span className="text-[var(--accent)] font-bold">AI Intelligence</span>
              <ChevronRight size={12} />
              <span className="text-[var(--text)]">{currentTab.label}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">
                {title || currentTab.label}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                Live Inference
              </span>
            </div>
            {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5 font-medium">{subtitle}</p>}
          </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* Horizon Switcher if applicable */}
            {onHorizonChange && (
              <div className="flex items-center p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs">
                {horizons.map((h) => {
                  const isSelected = (horizon || "month").toLowerCase() === h.key;
                  return (
                    <button
                      key={h.key}
                      onClick={() => onHorizonChange(h.key)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-150 ${
                        isSelected
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            )}

            {actions}

            {/* Ask Me Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 transition-all duration-200 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}
            >
              <Sparkles className="h-4 w-4 animate-pulse text-white" />
              <span>Ask Me</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Pill Tabs Bar */}
        <div
          className="px-3.5 sm:px-4 md:px-6 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none"
          style={{
            scrollbarWidth: "none",
            maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
          }}
        >
          {AI_NAV_SUBITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/40 shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] border border-transparent"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Copilot Slide-over Drawer */}
      <AiCopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </>
  );
}
