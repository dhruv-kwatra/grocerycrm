import { apiGet } from "@/lib/api/server";
import { Users, Presentation, ReceiptText, IndianRupee, Trophy, Target } from "lucide-react";
import { guardRetail } from "@/lib/retail/guard";
import { fmtDateLong } from "@/lib/retail/datetime";
import { ActionForm, SubmitButton } from "../../_components/ActionForm";
import { setAgentTarget } from "../actions";

export const dynamic = "force-dynamic";

type Agent = { agentId: number; name: string | null; walkins: number; demos: number; bills: number; units: number; revenue: number };
type Board = { date: string; kpis: { footfall: number; demos: number; bills: number; units: number; revenue: number; conversion: number }; agents: Agent[]; targets: Record<string, number> };
type AgentTarget = { agentId: number | null; metric: string; target: number };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}k` : inr(n));
const share = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

const TARGET_METRICS = ["revenue", "bills", "units", "demos", "focus_sku_units"] as const;
const AVATAR = ["#2158c9", "#0e8a6d", "#b26a00", "#7c3aed", "#c2170f", "#0891b2"];
const initials = (name: string | null, id: number) =>
  name ? name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() : `#${id}`;

// The floor team as its own screen — the newui portal's "Agent Workspace" tab.
// It reads the same /manager/board the floor board does, so it costs one extra
// call, not a new backend surface. It is deliberately not /retail/agent: that
// screen is the agent's own capture surface, and a manager logging a walk-in
// there would book it against their own name.
export default async function ManagerAgentsPage() {
  await guardRetail(["store_manager", "superadmin"]);
  const [board, agentTargets] = await Promise.all([
    apiGet<Board>("/api/retail/manager/board"),
    apiGet<{ targets: AgentTarget[] }>("/api/retail/manager/targets").then((r) => r.targets).catch(() => [] as AgentTarget[]),
  ]);

  const agents = [...board.agents].sort((a, b) => b.revenue - a.revenue);
  const team = board.kpis;
  const targetsFor = (agentId: number) => agentTargets.filter((t) => t.agentId === agentId);
  const best = agents[0];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight flex items-center gap-2">
            <Users size={22} className="text-[var(--accent)]" /> Agent Workspace
          </h1>
          <p className="text-[12px] text-[var(--faint)]">{fmtDateLong(board.date)} · {agents.length} on the floor · targets and per-agent output</p>
        </div>
      </div>

      {/* Team totals — the same counters the floor board opens with, framed as
          the team's rather than the store's. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Users size={14} />, label: "Walk-ins", value: String(team.footfall) },
          { icon: <Presentation size={14} />, label: "Demos", value: String(team.demos) },
          { icon: <ReceiptText size={14} />, label: "Bills", value: String(team.bills) },
          { icon: <IndianRupee size={14} />, label: "Revenue", value: inrShort(team.revenue) },
        ].map((m) => (
          <div key={m.label} className="rlp-card p-3.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              {m.icon}
            </span>
            <p className="rlp-stat-label text-[9.5px] leading-tight">{m.label}</p>
            <p className="rlp-stat-value text-[1.5rem] mt-0.5 truncate">{m.value}</p>
          </div>
        ))}
      </div>

      {agents.length === 0 ? (
        <div className="rlp-card rlp-card--flat p-8 text-center text-[13px] text-[var(--faint)]">
          No agents on this store yet.
        </div>
      ) : (
        <>
          {best && best.revenue > 0 && (
            <div className="rlp-card rlp-card--flat p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
                <Trophy size={17} />
              </span>
              <div className="min-w-0">
                <p className="rlp-stat-label text-[9.5px]">Top performer today</p>
                <p className="text-[14px] font-semibold text-[var(--text)] truncate">
                  {best.name ?? `Agent #${best.agentId}`} · {inr(best.revenue)} · {best.bills} bill{best.bills === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((a, i) => {
              const set = targetsFor(a.agentId);
              const demoRate = share(a.demos, a.walkins);
              const closeRate = share(a.bills, a.demos);
              return (
                <div key={a.agentId} className="rlp-card p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                      style={{ background: AVATAR[i % AVATAR.length] }}
                    >
                      {initials(a.name, a.agentId)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[var(--text)] truncate">{a.name ?? `Agent #${a.agentId}`}</p>
                      <p className="text-[11px] text-[var(--faint)] tabular-nums">{a.walkins} walk · {a.demos} demo · {a.bills} sale</p>
                    </div>
                    <p className="text-[13px] font-bold text-[var(--text)] tabular-nums shrink-0">{inrShort(a.revenue)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Rate label="Demo rate" pct={demoRate} caption={`${a.demos}/${a.walkins} walk-ins`} />
                    <Rate label="Close rate" pct={closeRate} caption={`${a.bills}/${a.demos} demos`} />
                  </div>

                  {set.length > 0 && (
                    <p className="text-[11px] text-[var(--muted)] tabular-nums">
                      Month target · {set.map((t) => `${t.metric.replace("_", " ")} ${t.metric === "revenue" ? inrShort(t.target) : t.target}`).join(" · ")}
                    </p>
                  )}

                  {/* Same action the floor board uses, so a target set here and
                      a target set there are the one write path. */}
                  <ActionForm action={setAgentTarget.bind(null, a.agentId)} success="Target saved" className="flex items-center gap-1.5">
                    <select name="metric" defaultValue="revenue" aria-label={`Target metric for ${a.name ?? `agent ${a.agentId}`}`}
                      className="px-2 py-1 text-[11.5px] border border-[var(--border-strong)] rounded-md bg-[var(--surface)]">
                      {TARGET_METRICS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                    </select>
                    <input name="target" type="number" min="0" required placeholder="Target" aria-label={`Target value for ${a.name ?? `agent ${a.agentId}`}`}
                      className="w-24 px-2 py-1 text-[11.5px] border border-[var(--border-strong)] rounded-md bg-[var(--surface)] tabular-nums" />
                    <SubmitButton className="px-2.5 py-1 text-[11.5px] font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)]">
                      <span className="inline-flex items-center gap-1"><Target size={11} /> Set</span>
                    </SubmitButton>
                  </ActionForm>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Rate({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-raised)] px-2.5 py-2">
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
      <p className="text-[15px] font-bold text-[var(--text)] tabular-nums leading-tight">{pct}%</p>
      <div className="mt-1 h-1 rounded-full bg-[var(--bg)] overflow-hidden">
        <div className="h-full rounded-full bg-[image:var(--accent-grad)]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="text-[9.5px] text-[var(--faint)] mt-1 tabular-nums">{caption}</p>
    </div>
  );
}
