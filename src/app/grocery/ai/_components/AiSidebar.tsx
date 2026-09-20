"use client";

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
  ArrowLeft,
  Activity,
  ShieldCheck,
} from "lucide-react";

export const AI_NAV_LINKS = [
  { label: "Overview", href: "/grocery/ai", icon: LayoutDashboard, badge: "Live" },
  { label: "Sales Forecasting", href: "/grocery/ai/sales", icon: TrendingUp, badge: "96.4% Acc" },
  { label: "Demand Prediction", href: "/grocery/ai/demand", icon: Target, badge: "+18.5%" },
  { label: "Inventory Forecast", href: "/grocery/ai/inventory", icon: PackageCheck, badge: "14 Risk" },
  { label: "AI Insights", href: "/grocery/ai/insights", icon: Lightbulb, badge: "6 New" },
  { label: "Model Performance", href: "/grocery/ai/models", icon: Cpu, badge: "v4.2.8" },
  { label: "AI Settings", href: "/grocery/ai/settings", icon: Settings, badge: null },
];

export function AiSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70 bg-gradient-to-b from-indigo-950/40 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">AI Intelligence</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Fabric Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">GroceryCRM Predictive ML</p>
            </div>
          </div>
        </div>

        {/* Role & System Status Pill */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium capitalize">{role.replace("_", " ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>RBAC Active</span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Forecasting & Analytics
        </div>

        {AI_NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-transparent text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-500/30 text-indigo-300"
                      : "bg-slate-900/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-400/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 group-hover:border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Return link & Engine telemetry */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Telemetry Latency</span>
          </div>
          <span className="font-mono text-cyan-400">14.2 ms</span>
        </div>

        <Link
          href="/retail/estate"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit to Retail Portal</span>
        </Link>
      </div>
    </aside>
  );
}
