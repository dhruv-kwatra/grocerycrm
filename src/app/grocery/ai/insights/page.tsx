"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AiSubBar } from "../_components/AiSubBar";
import { MetricCard } from "../_components/MetricCard";

export default function AiInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [voted, setVoted] = useState<Record<string, "up" | "down">>({});

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/insights");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch insights:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const insights = data?.insights || [];
  const metrics = data?.metrics || {};

  const handleVote = (id: string, dir: "up" | "down") => {
    setVoted((prev) => ({ ...prev, [id]: dir }));
  };

  const filteredInsights = insights.filter((ins: any) => {
    if (severityFilter === "All") return true;
    return ins.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AiSubBar
        title="AI Prescriptive & Diagnostic Insights Feed"
        subtitle="Automated anomaly detection, correlation mining, and business opportunity alerts"
        actions={
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--accent)]" : ""}`} />
          </button>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Active Insights"
            value={`${metrics.totalInsights || 8} Signals`}
            subtext="Continuous automated scanning"
            icon={Lightbulb}
          />

          <MetricCard
            title="Critical Action Signals"
            value={`${metrics.criticalCount || 2} Alerts`}
            delta={-33.3}
            deltaLabel="Requires intervention"
            subtext="Stockout & Expiry risks"
            icon={ShieldAlert}
            badge="Urgent"
          />

          <MetricCard
            title="Growth Opportunities"
            value={`${metrics.opportunityCount || 4} Signals`}
            delta={25.0}
            deltaLabel="Revenue expansion"
            subtext="Demand surges & bundles"
            icon={TrendingUp}
            badge="High Value"
          />

          <MetricCard
            title="Estimated Value Unlock"
            value={`₹${((metrics.estimatedValueUnlock || 540000) / 100000).toFixed(1)} Lakh`}
            subtext="Potential upside / loss prevented"
            icon={Sparkles}
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs w-fit">
          {["All", "Critical", "Opportunity", "Warning"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                severityFilter === sev
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Insights Cards List */}
        <div className="space-y-4">
          {filteredInsights.map((ins: any) => {
            const isCritical = ins.severity === "CRITICAL";
            const isOpp = ins.severity === "OPPORTUNITY";
            const vote = voted[ins.id];

            return (
              <div
                key={ins.id}
                className="rlp-card p-5 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        isCritical
                          ? "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/30"
                          : isOpp
                          ? "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30"
                          : "bg-[var(--accent-light)] text-[var(--accent-dark)] border-[var(--accent)]/30"
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : isOpp ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <Lightbulb className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[var(--text)]">{ins.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isCritical
                              ? "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]/30"
                              : isOpp
                              ? "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/30"
                              : "bg-[var(--accent-light)] text-[var(--accent-dark)] border-[var(--accent)]/30"
                          }`}
                        >
                          {ins.severity}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">• {ins.category}</span>
                        <span className="text-[10px] text-[var(--faint)] font-mono">Confidence: {ins.confidence}%</span>
                      </div>

                      <p className="text-xs text-[var(--text)] leading-relaxed max-w-3xl font-normal">
                        {ins.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono pt-1 text-[var(--muted)]">
                        <span>Impact: <strong className="text-[var(--text)]">{ins.impactEstimate}</strong></span>
                        <span>Source: <strong className="text-[var(--accent)]">{ins.sourceModel}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Feedback */}
                  <div className="flex items-center md:flex-col md:items-end justify-between gap-3 shrink-0">
                    <Link
                      href={ins.actionHref || "/grocery/ai"}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 transition-all"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                    >
                      <span>{ins.actionLabel || "Take Action"}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </Link>

                    {/* Feedback loop */}
                    <div className="flex items-center gap-1 text-[var(--muted)]">
                      <button
                        onClick={() => handleVote(ins.id, "up")}
                        className={`p-1.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer ${
                          vote === "up" ? "text-[var(--success)] bg-[var(--success-bg)]" : ""
                        }`}
                        title="Helpful insight"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleVote(ins.id, "down")}
                        className={`p-1.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors cursor-pointer ${
                          vote === "down" ? "text-[var(--error)] bg-[var(--error-bg)]" : ""
                        }`}
                        title="Not relevant"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
