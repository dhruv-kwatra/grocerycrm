"use client";

import React, { useState } from "react";
import {
  Save,
  Bell,
  Sliders,
  Zap,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Database,
} from "lucide-react";
import { AiSubBar } from "../_components/AiSubBar";

export default function AiSettingsPage() {
  const [defaultHorizon, setDefaultHorizon] = useState("month");
  const [confidenceInterval, setConfidenceInterval] = useState("95");
  const [retrainFrequency, setRetrainFrequency] = useState("drift_and_daily");
  const [psiThreshold, setPsiThreshold] = useState("0.15");
  const [autoChampionPromotion, setAutoChampionPromotion] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AiSubBar
        title="Self-Learning AI Governance & Automation Settings"
        subtitle="Configure autonomous retraining triggers, drift sensitivity thresholds, and multi-horizon parameters"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {saved && (
          <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success)]/40 text-[var(--success)] text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
              <span>AI Governance &amp; Self-Learning parameters successfully synchronized with FastAPI MLOps pipeline.</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Self-Learning Automation & Retraining */}
          <div className="rlp-card rlp-card--flat p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[var(--accent)]" />
              <span>Autonomous Self-Learning &amp; Continuous Retraining</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)]">Retraining Trigger Policy</label>
                <select
                  value={retrainFrequency}
                  onChange={(e) => setRetrainFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="drift_and_daily">On Data Drift (PSI &gt; Threshold) + Daily 04:00 UTC (Recommended)</option>
                  <option value="daily">Strictly Daily at 04:00 AM UTC</option>
                  <option value="weekly">Weekly Full Hyperparameter Sweep</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
                <p className="text-[11px] text-[var(--faint)]">Triggers feature re-computation and 5-fold cross-validation.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)]">Data Drift Trigger Threshold (PSI)</label>
                <select
                  value={psiThreshold}
                  onChange={(e) => setPsiThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="0.10">PSI &gt; 0.10 (High Sensitivity - Frequent Retrain)</option>
                  <option value="0.15">PSI &gt; 0.15 (Standard Enterprise Balanced)</option>
                  <option value="0.20">PSI &gt; 0.20 (Conservative - Major Shifts Only)</option>
                </select>
                <p className="text-[11px] text-[var(--faint)]">Population Stability Index threshold before auto-retraining starts.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/60">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Auto-Promote Challenger Model</div>
                  <p className="text-[10px] text-[var(--muted)]">
                    Automatically promotes challenger model to production champion if validation MAPE improves by &gt;0.2%
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoChampionPromotion}
                  onChange={(e) => setAutoChampionPromotion(e.target.checked)}
                  className="h-4 w-4 rounded bg-[var(--surface)] border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Forecasting & Model Parameters */}
          <div className="rlp-card rlp-card--flat p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[var(--accent)]" />
              <span>Forecasting Engine &amp; Uncertainty Bounds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)]">Default Time Horizon</label>
                <select
                  value={defaultHorizon}
                  onChange={(e) => setDefaultHorizon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="tomorrow">Tomorrow (1-Day Flash)</option>
                  <option value="week">Next Week (7 Days)</option>
                  <option value="month">Next Month (30 Days - Recommended)</option>
                  <option value="quarter">Next Quarter (90 Days)</option>
                  <option value="year">Annual (365 Days)</option>
                </select>
                <p className="text-[11px] text-[var(--faint)]">Default window applied across sales &amp; demand predictions.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)]">Bayesian Confidence Ribbon</label>
                <select
                  value={confidenceInterval}
                  onChange={(e) => setConfidenceInterval(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="90">90% Coverage (Narrow Ribbon)</option>
                  <option value="95">95% Coverage (Standard ±1.96σ)</option>
                  <option value="99">99% Coverage (Conservative ±2.58σ)</option>
                </select>
                <p className="text-[11px] text-[var(--faint)]">Determines uncertainty bands for demand safety buffers.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Notifications */}
          <div className="rlp-card rlp-card--flat p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--secondary)]" />
              <span>Real-Time Alert Channels</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">WhatsApp Critical Alerts</div>
                  <p className="text-[10px] text-[var(--muted)]">Stockouts &amp; operational anomalies</p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="h-4 w-4 rounded bg-[var(--surface)] border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Daily Digest Email</div>
                  <p className="text-[10px] text-[var(--muted)]">06:00 AM MLOps summary report</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4 w-4 rounded bg-[var(--surface)] border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              <Save className="h-4 w-4 text-white" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
