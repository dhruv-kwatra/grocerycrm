import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import {
  Check, X, Lock, ClipboardCheck, ArrowUp, ArrowDown, Minus, Search, Contact, ReceiptText as OrdersIcon, UserCog, BookOpen,
} from "lucide-react";
import { decideApproval, closeEod, replenish, resolveFinding, setAgentTarget } from "./actions";
import { fmtTime, fmtDateLong } from "@/lib/retail/datetime";
import { ReceiptText } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Kpis = { footfall: number; demos: number; bills: number; units: number; revenue: number; won: number; lost: number; conversion: number };
type Agent = { agentId: number; name: string | null; walkins: number; demos: number; bills: number; units: number; revenue: number };
type Hourly = { slot: string; today: number; yesterday: number };
type WeekDay = { date: string; footfall: number; demos: number; bills: number; revenue: number };
type Board = {
  date: string; role: string; kpis: Kpis; agents: Agent[]; targets: Record<string, number>;
  // Added after the board shipped — absent until the backend is redeployed.
  hourly?: Hourly[]; week?: WeekDay[];
};
type Approval = { id: number; kind: string; amount: number | null; reason: string | null; requestedBy: number; status: string };
type StockRow = { id: number; skuId: number; skuCode: string | null; skuName: string | null; isFocus?: boolean; onHand: number; lowThreshold: number; low: boolean };
type Finding = { id: number; kind: string; title: string; status: string; createdAt: string | null };
type Activity = { id: number; customerName: string | null; customerPhone: string | null; status: string; skuName: string | null; lastOutcome: string | null; revenue: number };
type AgentTarget = { agentId: number | null; metric: string; target: number };
type Eod = { date: string; totals: { footfall: number; bills: number; units: number; revenue: number }; closed: boolean; lockedAt: string | null };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const inrShort = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(2)} L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : inr(n));
// Yesterday's calendar date from a store-local YYYY-MM-DD (plain date arithmetic,
// UTC-anchored so it never slips a day).
const prevDate = (d?: string) => d ? new Date(new Date(d + "T00:00:00Z").getTime() - 86400000).toISOString().slice(0, 10) : "";
// Left the nav when the store manager's list became the prototype's four
// tabs. The role still has rights to all four, so the board keeps a way in.
const MORE = [
  { label: "Customers", href: "/retail/customers", icon: Contact },
  { label: "Orders", href: "/retail/orders", icon: OrdersIcon },
  { label: "Users", href: "/retail/users", icon: UserCog },
  { label: "Guide", href: "/retail/guide", icon: BookOpen },
];
const AVATAR = ["#2158c9", "#0e8a6d", "#b26a00", "#7c3aed", "#c2170f", "#0891b2"];
const initials = (name: string | null, id: number) =>
  name ? name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() : `#${id}`;

// Mirrors the retail_targets metric enum the backend accepts.
const TARGET_METRICS = ["revenue", "bills", "units", "demos", "focus_sku_units"] as const;
const ACTIVITY_PER_PAGE = 10;

export default async function ManagerBoard({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; ap?: string }> }) {
  await guardRetail(["store_manager","superadmin"]);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const view = ["orders", "lost"].includes(sp.view ?? "") ? sp.view! : "";
  const board = await apiGet<Board>("/api/retail/manager/board");
  const [yesterday, approvals, stock, findings, eod, activity, agentTargets] = await Promise.all([
    apiGet<Board>(`/api/retail/manager/board?date=${prevDate(board.date)}`).then((b) => b.kpis).catch(() => null),
    apiGet<{ approvals: Approval[] }>("/api/retail/manager/approvals").then((r) => r.approvals).catch(() => []),
    apiGet<{ rows: StockRow[]; lowStockFloor?: number }>("/api/retail/manager/stock").then((r) => r.rows).catch(() => []),
    apiGet<{ findings: Finding[] }>("/api/retail/manager/findings").then((r) => r.findings).catch(() => []),
    apiGet<Eod>("/api/retail/manager/eod").catch(() => null),
    apiGet<{ activity: Activity[] }>("/api/retail/manager/activity").then((r) => r.activity).catch(() => [] as Activity[]),
    apiGet<{ targets: AgentTarget[] }>("/api/retail/manager/targets").then((r) => r.targets).catch(() => [] as AgentTarget[]),
  ]);
  // Targets already set this month, so the summary line shows them instead of
  // making the manager guess whether they saved.
  const targetsFor = (agentId: number) => agentTargets.filter((t) => t.agentId === agentId);

  // Every walk-in now closes won or lost, so those two are the whole story.
  // Anything still sitting in new/contacted is legacy and has nowhere to go.
  const orders = activity.filter((a) => a.status === "won");
  const lost = activity.filter((a) => a.status === "lost");
  // The unfiltered list shows the same two buckets, so a legacy new/contacted
  // row can't slip in under "All" after the open bucket was removed.
  const closedActivity = [...orders, ...lost];

  // Today's list, narrowed by the header's view filter + free-text search.
  const matched = (view === "orders" ? orders : view === "lost" ? lost : closedActivity)
    .filter((a) => !q || [a.customerName, a.customerPhone, a.skuName].some((v) => v?.toLowerCase().includes(q)));
  const actPages = Math.max(1, Math.ceil(matched.length / ACTIVITY_PER_PAGE));
  const actPage = Math.min(Math.max(1, Number(sp.ap) || 1), actPages);
  const actStart = (actPage - 1) * ACTIVITY_PER_PAGE;
  const shown = matched.slice(actStart, actStart + ACTIVITY_PER_PAGE);
  const actHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (view) params.set("view", view);
    if (p > 1) params.set("ap", String(p));
    return `/retail/manager${params.size ? `?${params}` : ""}#today`;
  };

  const k = board.kpis;
  // `low` already accounts for the store's threshold AND the service-wide floor
  // — that floor used to be re-applied here, so the board and the endpoint each
  // owned half the rule and could disagree about what "low" meant.
  const low = stock.filter((s) => s.low).sort((a, b) => a.onHand - b.onHand);
  const hourly = board.hourly ?? [];
  const week = board.week ?? [];
  const avgTicket = k.bills > 0 ? k.revenue / k.bills : 0;
  const yAvgTicket = yesterday && yesterday.bills > 0 ? yesterday.revenue / yesterday.bills : 0;
  const decisionCount = low.length + approvals.length + findings.length;

  return (
    <div className="p-4 md:p-6 max-w-[112rem] mx-auto w-full space-y-4">
      {/* Header — store, date, and the close-day ritual. */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Store Manager</h1>
          <p className="text-[12px] text-[var(--faint)]">{fmtDateLong(board.date)} · run the floor by the hour</p>
        </div>
        <div className="flex-1" />
        {eod?.closed ? (
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--success)] bg-[var(--success-bg)] px-3.5 py-2 rounded-lg">
            <Lock size={15} /> Day closed{eod.lockedAt ? ` · ${fmtTime(eod.lockedAt)}` : ""}
          </span>
        ) : (
          <ActionForm action={closeEod} success="Day closed">
            <SubmitButton className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">
              <Lock size={15} /> Close day
            </SubmitButton>
          </ActionForm>
        )}
      </div>

      <nav aria-label="More manager screens" className="flex flex-wrap gap-2">
        {MORE.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-[var(--muted)] border border-[var(--border)] bg-[var(--surface)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors">
            <Icon size={13} /> {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
        {/* ── COLUMN 1 · Floor now — people before numbers ── */}
        <Col title="Floor · now" count={board.agents.length} className="xl:col-span-3">
          {board.agents.length === 0 ? (
            <Panel><Empty>No agent activity logged yet today.</Empty></Panel>
          ) : (
            <Panel className="divide-y divide-[var(--border)]">
              {board.agents.map((a, i) => (
                <div key={a.agentId} className="py-2.5 first:pt-0.5 last:pb-0.5">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: AVATAR[i % AVATAR.length] }}>
                      {initials(a.name, a.agentId)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[var(--text)] truncate">{a.name ?? `Agent #${a.agentId}`}</p>
                      <p className="text-[11px] text-[var(--faint)] tabular-nums">walk · demo · sale</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-[var(--text)] tabular-nums">{a.walkins} · {a.demos} · {a.bills}</p>
                      <p className="text-[11px] text-[var(--muted)] tabular-nums">{inrShort(a.revenue)}</p>
                    </div>
                  </div>
                  {/* The agent's Today screen shows a month target it had no way
                      of getting — this is the only place one can be set. */}
                  <details className="group mt-1.5">
                    <summary className="text-[11px] text-[var(--accent)] cursor-pointer select-none marker:content-none hover:underline">
                      {targetsFor(a.agentId).length
                        ? `Month target · ${targetsFor(a.agentId).map((t) => `${t.metric} ${t.target}`).join(", ")}`
                        : "Set month target"}
                    </summary>
                    <ActionForm action={setAgentTarget.bind(null, a.agentId)} success="Target saved" className="flex items-center gap-1.5 mt-1.5">
                      <select name="metric" aria-label="Metric" defaultValue="revenue"
                        className="px-2 py-1 text-[11.5px] border border-[var(--border-strong)] rounded-md bg-[var(--surface)]">
                        {TARGET_METRICS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                      </select>
                      <input name="target" type="number" min="0" step="1" required aria-label="Target value"
                        className="w-24 px-2 py-1 text-[11.5px] border border-[var(--border-strong)] rounded-md bg-[var(--surface)] tabular-nums" />
                      <SubmitButton className="px-2.5 py-1 text-[11.5px] font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)]">Save</SubmitButton>
                    </ActionForm>
                  </details>
                </div>
              ))}
            </Panel>
          )}
        </Col>

        {/* ── COLUMN 2 · Today vs yesterday — every number carries its comparison ── */}
        <Col title="Today vs yesterday" className="xl:col-span-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Kpi label="Footfall" value={String(k.footfall)} delta={pctDelta(k.footfall, yesterday?.footfall)} />
            <Kpi label="Sales" value={String(k.bills)} sub={inrShort(k.revenue)} delta={countDelta(k.bills, yesterday?.bills)} />
            <Kpi label="Walk-in → sale" value={`${k.conversion}%`} delta={ptDelta(k.conversion, yesterday && yesterday.footfall > 0 ? Math.round((yesterday.won / yesterday.footfall) * 1000) / 10 : undefined)} />
            <Kpi label="Avg ticket" value={inrShort(avgTicket)} delta={rupeeDelta(avgTicket, yAvgTicket)} />
          </div>

          {/* Hourly footfall — today's bars against yesterday's, so a slow
              afternoon is visible while there's still time to fix it. */}
          {hourly.length > 0 && <HourlyChart rows={hourly} />}

          {/* Last 7 days — is today normal for this store, or an outlier? */}
          {week.length > 0 && <WeekStrip rows={week} today={board.date} />}
        </Col>

        {/* ── COLUMN 3 · Funnel, then the decision queue ── */}
        <section className="space-y-4 xl:col-span-3">
          {/* Funnel — where today's walk-ins thinned out. */}
          <Col title="Funnel · today">
            <Panel>
              <div className="space-y-4 py-1.5">
                <FunnelRow label="Walk-ins" value={k.footfall} pct={100} />
                <FunnelRow label="Demos" value={k.demos} pct={k.footfall ? Math.round((k.demos / k.footfall) * 100) : 0} />
                <FunnelRow label="Sales" value={k.won} pct={k.footfall ? Math.round((k.won / k.footfall) * 1000) / 10 : 0} />
              </div>
            </Panel>
          </Col>

        <Col title="Needs a decision" count={decisionCount || undefined}>
          <Panel className="divide-y divide-[var(--border)]">
            {decisionCount === 0 && <Empty>Nothing owed — the rail is clear.</Empty>}

            {/* Low stock → request replenishment */}
            {low.map((s) => {
              const cover = s.onHand; // days-of-cover needs a sell-rate feed we don't have; show raw units.
              return (
                <QueueItem key={`stk-${s.id}`} sev={s.onHand === 0 ? "crit" : "warn"}
                  title={s.skuName ?? s.skuCode ?? `SKU #${s.skuId}`}
                  pill={{ tone: s.onHand === 0 ? "crit" : "warn", text: `${cover} left` }}
                  sub={`Threshold ${s.lowThreshold} · on hand ${s.onHand}`}>
                  <ActionForm action={replenish.bind(null, s.skuId)} success="Replenishment requested" className="flex items-center gap-1.5">
                    <input name="qty" type="number" min="1" defaultValue={Math.max(1, s.lowThreshold - s.onHand)} aria-label="Replenish quantity" className="w-16 px-2 py-1.5 text-xs border border-[var(--border-strong)] rounded-md bg-[var(--surface)] tabular-nums" />
                    <SubmitButton className="px-2.5 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)]">Request</SubmitButton>
                  </ActionForm>
                </QueueItem>
              );
            })}

            {/* Price/discount approvals → approve or decline */}
            {approvals.map((a) => (
              <QueueItem key={`apr-${a.id}`} sev="warn"
                title={a.reason ?? `${a.kind} approval`}
                pill={{ tone: "warn", text: `${a.kind} · #${a.requestedBy}` }}
                sub={a.amount != null ? `${inr(a.amount)} requested` : undefined}>
                <ActionForm action={decideApproval.bind(null, a.id)} success="Decision saved" className="flex items-center gap-1.5">
                  <SubmitButton name="decision" value="approved" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--success)] text-white rounded-md hover:brightness-110"><Check size={13} /> Approve</SubmitButton>
                  <SubmitButton name="decision" value="rejected" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-[var(--border-strong)] text-[var(--muted)] rounded-md hover:bg-[var(--surface-raised)]"><X size={13} /> Decline</SubmitButton>
                </ActionForm>
              </QueueItem>
            ))}

            {/* Open planogram findings → resolve */}
            {findings.map((f) => (
              <QueueItem key={`fnd-${f.id}`} sev={f.status === "assigned" ? "info" : "warn"}
                title={f.title}
                pill={{ tone: f.status === "assigned" ? "info" : "warn", text: f.status }}
                sub={f.kind}>
                <ActionForm action={resolveFinding.bind(null, f.id)} success="Finding resolved">
                  <SubmitButton className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--success)] text-white rounded-md hover:brightness-110"><ClipboardCheck size={13} /> Resolve</SubmitButton>
                </ActionForm>
              </QueueItem>
            ))}
          </Panel>
        </Col>
        </section>
      </div>

      {/* ── Today — every lead touched today, across outcomes ── */}
      <section className="space-y-2.5" id="today">
        <div className="flex flex-wrap items-center gap-2 px-0.5">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
            <ReceiptText size={13} /> Today · outcomes
            {activity.length > 0 && (
              <span className="font-medium normal-case tracking-normal text-[var(--muted)]">
                {orders.length} order{orders.length === 1 ? "" : "s"} · {lost.length} lost
              </span>
            )}
          </h2>
          {/* Filter + search — a plain GET form, so the view is shareable and
              needs no client state. Anchored so submitting lands on the list. */}
          <form method="GET" className="ml-auto flex items-center gap-1.5 shrink-0">
            <label className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Search leads..." aria-label="Search today's leads"
                className="w-36 sm:w-44 pl-7 pr-2 py-1.5 text-[12.5px] border border-[var(--border-strong)] rounded-lg bg-[var(--surface)]" />
            </label>
            <select name="view" defaultValue={view} aria-label="Filter by outcome"
              className="px-2 py-1.5 text-[12.5px] border border-[var(--border-strong)] rounded-lg bg-[var(--surface)]">
              <option value="">All</option>
              <option value="orders">Orders</option>
              <option value="lost">Lost</option>
            </select>
            <button type="submit" className="px-2.5 py-1.5 text-[12.5px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Apply</button>
            {(q || view) && (
              <a href="/retail/manager" className="px-2 py-1.5 text-[12.5px] text-[var(--muted)] hover:text-[var(--text)]">Clear</a>
            )}
          </form>
        </div>
        <Panel className="divide-y divide-[var(--border)]">
          {shown.length === 0 ? (
            <Empty>{activity.length === 0 ? "No leads captured or closed today yet." : "Nothing matches that filter."}</Empty>
          ) : (
            shown.map((a) => <ActivityRow key={a.id} a={a} />)
          )}
        </Panel>
        {matched.length > ACTIVITY_PER_PAGE && (
          <div className="flex items-center gap-2 px-0.5 text-[11px] text-[var(--faint)]">
            <span className="tabular-nums">{actStart + 1}–{actStart + shown.length} of {matched.length}</span>
            <span className="ml-auto flex items-center gap-1.5">
              <PageLink href={actHref(actPage - 1)} disabled={actPage <= 1}>Prev</PageLink>
              <span className="tabular-nums">{actPage}/{actPages}</span>
              <PageLink href={actHref(actPage + 1)} disabled={actPage >= actPages}>Next</PageLink>
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const base = "px-2 py-0.5 rounded-md border border-[var(--border)] font-semibold";
  return disabled
    ? <span className={`${base} text-[var(--faint)] opacity-50`}>{children}</span>
    : <a href={href} className={`${base} text-[var(--text)] hover:bg-[var(--surface-raised)]`}>{children}</a>;
}

function ActivityRow({ a }: { a: Activity }) {
  const won = a.status === "won";
  const lost = a.status === "lost";
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0.5 last:pb-0.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--text)] truncate">
          {a.customerName ?? "Walk-in"}
          {a.customerPhone && <span className="font-normal text-[var(--faint)]"> · {a.customerPhone}</span>}
        </p>
        <p className="text-[11.5px] text-[var(--muted)] truncate">
          {a.skuName ?? "—"}
          {lost && a.lastOutcome ? <span className="text-[var(--faint)]"> · {a.lastOutcome}</span> : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {won ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)]">
            Order · {inr(a.revenue)}
          </span>
        ) : lost ? (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--muted)]">Lost</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">
            Open
          </span>
        )}
      </div>
    </div>
  );
}

// ── delta helpers — each returns {dir, text} or null when there's no baseline ──
type Delta = { dir: "up" | "down" | "flat"; text: string } | null;
const dir = (n: number): "up" | "down" | "flat" => (n > 0 ? "up" : n < 0 ? "down" : "flat");
function pctDelta(now: number, prev?: number): Delta {
  if (prev == null) return null;
  if (prev === 0) return now > 0 ? { dir: "up", text: "new" } : { dir: "flat", text: "±0" };
  const p = Math.round(((now - prev) / prev) * 100);
  return { dir: dir(p), text: `${p > 0 ? "+" : ""}${p}% vs yest.` };
}
function countDelta(now: number, prev?: number): Delta {
  if (prev == null) return null;
  const d = now - prev;
  return { dir: dir(d), text: `${d > 0 ? "+" : ""}${d} vs yest.` };
}
function ptDelta(now: number, prev?: number): Delta {
  if (prev == null) return null;
  const d = Math.round((now - prev) * 10) / 10;
  return { dir: dir(d), text: `${d > 0 ? "+" : ""}${d} pt` };
}
function rupeeDelta(now: number, prev: number): Delta {
  if (!prev) return null;
  const d = Math.round(now - prev);
  return { dir: dir(d), text: `${d > 0 ? "+" : ""}${inrShort(Math.abs(d)).replace("₹", d < 0 ? "−₹" : "₹")}` };
}

function Col({ title, count, children, className = "" }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-2.5 ${className}`}>
      <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--faint)] px-0.5">
        {title}
        {count != null && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rlp-card p-3.5 ${className}`}>{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-[var(--faint)] py-4 text-center">{children}</p>;
}

function Kpi({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta: Delta }) {
  const Icon = delta?.dir === "up" ? ArrowUp : delta?.dir === "down" ? ArrowDown : Minus;
  const tone = delta?.dir === "up" ? "text-[var(--success)]" : delta?.dir === "down" ? "text-[var(--error)]" : "text-[var(--faint)]";
  return (
    // Label above the number, matching the agent board and the newui tiles —
    // you read what it is, then how big it is, then which way it moved.
    <div className="rlp-card p-3.5">
      <p className="rlp-stat-label text-[9.5px] leading-tight">{label}</p>
      <p className="rlp-stat-value text-[1.6rem] mt-1">{value}</p>
      {(sub || delta) && (
        <p className={`rlp-stat-delta mt-1.5 text-[11px] ${sub ? "text-[var(--success)]" : tone}`}>
          {delta && !sub && <Icon size={11} />}
          {sub ?? delta?.text}
        </p>
      )}
    </div>
  );
}

// Footfall is tallied per 2-hour slot ("14-16"), so a slot labels as its start
// hour in 12-hour form — 14-16 → "2p". Meridiem only on the first bar and noon,
// which is enough to read the axis without crowding it.
function slotLabel(slot: string, i: number) {
  const h = Number(slot.split("-")[0]);
  if (Number.isNaN(h)) return slot;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return i === 0 || h === 12 ? `${h12}${h < 12 ? "a" : "p"}` : String(h12);
}

// Paired bars, plain SVG — no chart library for eleven rectangles. Bars scale to
// the tallest value across BOTH days so the comparison is honest.
function HourlyChart({ rows }: { rows: Hourly[] }) {
  const peak = Math.max(1, ...rows.map((r) => Math.max(r.today, r.yesterday)));
  const peakIdx = rows.reduce((best, r, i) => (r.today > rows[best].today ? i : best), 0);
  // Plot area is 30% taller than the original 152/130 box.
  const W = 640, H = 198, BASE = 176, TOP = 12;
  const step = W / rows.length;
  const bw = Math.min(14, step / 3.2);
  const h = (v: number) => Math.max(v > 0 ? 2 : 0, ((BASE - TOP) * v) / peak);

  return (
    <Panel>
      <div className="flex items-center gap-3.5 text-[11px] text-[var(--muted)] mb-1.5">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />Today</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--border-strong,var(--border))]" />Yesterday</span>
        <span className="ml-auto tabular-nums">Footfall by hour</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`Footfall by hour, today versus yesterday, peaking at ${rows[peakIdx]?.today ?? 0} walk-ins`}>
        <line x1="8" x2={W - 8} y1={BASE} y2={BASE} stroke="var(--border)" strokeWidth="1" />
        {rows.map((r, i) => {
          const cx = i * step + step / 2;
          const yh = h(r.yesterday), th = h(r.today);
          return (
            <g key={r.slot}>
              <rect x={cx - bw - 1.5} y={BASE - yh} width={bw} height={yh} rx="2" fill="var(--border-strong, #d8d6d1)" />
              <rect x={cx + 1.5} y={BASE - th} width={bw} height={th} rx="2" fill="var(--accent)" />
              {i === peakIdx && r.today > 0 && (
                <text x={cx + 1.5 + bw / 2} y={BASE - th - 5} textAnchor="middle"
                  className="fill-[var(--text)]" fontSize="10.5" fontWeight="700">{r.today}</text>
              )}
              <text x={cx} y={BASE + 15} textAnchor="middle" className="fill-[var(--faint)]" fontSize="10">
                {slotLabel(r.slot, i)}
              </text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
}

// The trailing seven days. Bars are footfall; the day's bills ride underneath,
// so a busy-but-unproductive day stands out from a genuinely quiet one.
function WeekStrip({ rows, today }: { rows: WeekDay[]; today: string }) {
  const peak = Math.max(1, ...rows.map((r) => r.footfall));
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const dow = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
  return (
    <Panel>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Last 7 days</p>
        <span className="ml-auto text-[11.5px] font-semibold text-[var(--text)] tabular-nums">{inrShort(total)}</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {rows.map((r) => (
          <div key={r.date} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
            <span className="text-[10px] font-semibold text-[var(--muted)] tabular-nums leading-none">{r.bills || ""}</span>
            <span
              className={`w-full rounded-t ${r.date === today ? "bg-[var(--accent)]" : "bg-[var(--surface-raised)] border-t border-[var(--border)]"}`}
              style={{ height: `${Math.max(r.footfall > 0 ? 4 : 1, (r.footfall / peak) * 100)}%` }}
              title={`${r.date} · ${r.footfall} footfall · ${r.bills} sales · ${inr(r.revenue)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {rows.map((r) => (
          <span key={r.date} className={`flex-1 text-center text-[10px] tabular-nums ${r.date === today ? "font-bold text-[var(--text)]" : "text-[var(--faint)]"}`}>
            {dow(r.date)}
          </span>
        ))}
      </div>
      <p className="text-[10.5px] text-[var(--faint)] mt-2">Bar height is footfall · number above is bills closed</p>
    </Panel>
  );
}

function FunnelRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-16 shrink-0 text-[var(--muted)]">{label}</span>
      <span className="flex-1 h-7 rounded-md bg-[var(--surface-raised)] overflow-hidden">
        <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right font-semibold text-[var(--text)] tabular-nums">{value} · {pct}%</span>
    </div>
  );
}

const SEV: Record<string, string> = { crit: "var(--error)", warn: "var(--warning)", info: "var(--accent)", good: "var(--success)" };
const PILL: Record<string, string> = {
  crit: "bg-[var(--error-bg,var(--surface-raised))] text-[var(--error)]",
  warn: "bg-[var(--warning-bg)] text-[var(--warning)]",
  info: "bg-[var(--accent-light)] text-[var(--accent-dark)]",
};

function QueueItem({ sev, title, pill, sub, children }: { sev: string; title: string; pill: { tone: string; text: string }; sub?: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0.5 last:pb-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEV[sev] }} />
        <span className="text-[13px] font-semibold text-[var(--text)]">{title}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PILL[pill.tone] ?? PILL.warn}`}>{pill.text}</span>
      </div>
      {sub && <p className="text-[11.5px] text-[var(--muted)] mt-1 ml-4">{sub}</p>}
      <div className="mt-2 ml-4">{children}</div>
    </div>
  );
}
