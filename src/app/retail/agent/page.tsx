import { apiGet } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  Target, ClipboardCheck, MessageCircle, Presentation, Users,
} from "lucide-react";
import { fmtDateWeekday } from "@/lib/retail/datetime";
import {
  KpiCards, TodayProgress, TopCategories, PaymentDonut, Announcements, AchievementCard,
  type SeriesPoint, type Trend, type Category, type Payment, type Achievements, type Note,
} from "./TodayCards";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Summary = {
  date: string;
  role: string;
  kpis: { demos: number; bills: number; units: number; revenue: number; footfall: number; won: number; lost: number; conversion: number };
  targets: Record<string, number>;
};
type Insights = {
  date: string;
  series: SeriesPoint[];
  trend: Trend;
  categories: Category[];
  payments: Payment[];
  achievements: Achievements;
};
type Walkin = {
  id: number; customerName: string | null; customerPhone: string | null;
  status: string; lastOutcome: string | null; party: string | null;
  budgetBand: string | null; emiInterest: boolean;
  closeProbability: number | null; createdAt: string | null;
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const waNumber = (p: string | null) => (p ? p.replace(/\D/g, "") : "");
const share = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

// Every number here is read from the backend: the day counters and targets from
// /agent/summary, the 7-day sparkline series, trend, category + payment mix and
// achievement counters from /agent/insights, the queue from the agent's own
// walk-ins, and the announcements from their notification feed. Nothing on this
// screen is a placeholder.
export default async function AgentPage() {
  await guardRetail(["store_associate","superadmin"]);
  const [user, summary, closed, insights, notes] = await Promise.all([
    getCurrentUser(),
    apiGet<Summary>("/api/retail/agent/summary"),
    // Unbounded on purpose: the win-rate line and the party mix below are
    // all-time figures over every closed walk-in, not just the ten listed.
    // The backend now returns these newest-first, so the ten shown really are
    // the ten most recent.
    apiGet<{ walkins: Walkin[] }>("/api/retail/agent/walkins?status=closed").catch(() => ({ walkins: [] as Walkin[] })),
    // The rail degrades to empty cards on an older backend rather than 500ing
    // the whole screen — the counters above it are the part that must render.
    apiGet<Insights>("/api/retail/agent/insights").catch(() => null),
    apiGet<{ notifications: Note[] }>("/api/retail/notifications").catch(() => ({ notifications: [] as Note[] })),
  ]);
  const k = summary.kpis;
  const revenueTarget = summary.targets.revenue;

  // Derived from today's counters — arithmetic on real numbers, no new reads.
  const demoRate = share(k.demos, k.footfall);   // walk-ins that got a demo

  // Outcome split across everything this agent has closed. The closed queue
  // isn't date-scoped, so it's labelled all-time rather than passed off as today.
  const won = closed.walkins.filter((w) => w.status === "won").length;
  const lost = closed.walkins.filter((w) => w.status === "lost").length;
  const winRate = share(won, won + lost);

  // The last day with activity, for "vs prior day" on the progress card. Same
  // rule the backend uses for the KPI trend, so the two can't disagree.
  const priorDay = [...(insights?.series ?? []).slice(0, -1)].reverse().find((d) => d.bills > 0 || d.footfall > 0) ?? null;

  // Party mix — the one segmentation the capture form actually records. Read
  // off the closed queue: every walk-in now ends won or lost, so that is the
  // complete set rather than whatever happened to still be open.
  // Party mix as a time series rather than a single-day breakdown. The x-axis
  // reuses the insights series dates so this chart and the KPI sparklines above
  // it cover exactly the same window.
  const days = (insights?.series ?? []).map((d) => d.date);
  const partyMix = tally(closed.walkins.map((w) => w.party));
  const partySeries = days.length > 1
    ? partyMix.map(([party], i) => ({
        party,
        colour: `var(--chart-${(i % 4) + 1})`,
        total: partyMix.find(([p]) => p === party)?.[1] ?? 0,
        points: days.map((d) => closed.walkins.filter(
          (w) => (w.party ?? "Unknown") === party && (w.createdAt ?? "").slice(0, 10) === d,
        ).length),
      }))
    : [];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-md md:max-w-xl lg:max-w-xl xl:max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">{greeting()}, {user.name.split(" ")[0]}</h1>
          <p className="text-[12px] text-[var(--faint)]">{fmtDateWeekday(summary.date)} · your shift so far</p>
        </div>
      </div>

      <KpiCards
        revenue={k.revenue} bills={k.bills} footfall={k.footfall}
        conversion={k.conversion} target={revenueTarget}
        series={insights?.series ?? []} trend={insights?.trend ?? null}
      />

      {/* Targets — whichever metrics the store actually set for this agent. */}
      {Object.keys(summary.targets).length > 0 && (
        <div className="rlp-card px-4 py-3 space-y-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">
            <Target size={13} /> Month target
          </p>
          {revenueTarget ? <TargetBar label="Revenue" done={k.revenue} target={revenueTarget} fmt={inr} /> : null}
          {summary.targets.bills ? <TargetBar label="Bills" done={k.bills} target={summary.targets.bills} fmt={String} /> : null}
          {summary.targets.units ? <TargetBar label="Units" done={k.units} target={summary.targets.units} fmt={String} /> : null}
          {summary.targets.demos ? <TargetBar label="Demos" done={k.demos} target={summary.targets.demos} fmt={String} /> : null}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        {/* min-w-0: a grid item will not shrink below its min-content by
            default, and the announcement title and body are nowrap
            (truncate), so their full unwrapped width became the floor —
            forcing the column wider than a phone, where the shell clips it. */}
        <div className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">
          {/* The funnel, drawn at today's real percentages rather than a fixed shape. */}
          <Section title="Today's funnel" icon={<Presentation size={15} />}>
            {k.footfall === 0 ? (
              <Empty>Nothing logged yet — tally a walk-in to start the day.</Empty>
            ) : (
              <div className="space-y-3.5 py-1">
                <FunnelRow label="Walk-ins" value={k.footfall} pct={100} />
                <FunnelRow label="Demos" value={k.demos} pct={demoRate} />
                <FunnelRow label="Bills" value={k.bills} pct={k.conversion} />
              </div>
            )}
          </Section>

          {partyMix.length > 0 && (
            <Section title="Who's walking in" icon={<Users size={15} />}
              aside={`${closed.walkins.length} walk-in${closed.walkins.length === 1 ? "" : "s"}`}>
              {partySeries.length > 0
                ? <PartyLines series={partySeries} days={days} />
                : (
                  // Fewer than two days of data draws no line worth reading, so
                  // fall back to the share bars.
                  <div className="space-y-2.5 py-0.5">
                    {partyMix.map(([label, n]) => (
                      <FunnelRow key={label} label={label} value={n} pct={share(n, closed.walkins.length)} />
                    ))}
                  </div>
                )}
            </Section>
          )}

          <Announcements notes={notes.notifications} />

        </div>

        {/* Right rail — progress, mix and achievements. Announcements and the
            party mix moved into the main column above Recent outcomes: both are
            things the agent reads, not glances at, and the rail collapses under
            the main column on anything narrower than xl — which put them below
            the fold on the phone this screen is mostly used on. */}
        <aside className="min-w-0 space-y-4 xl:col-start-2 xl:row-start-1 xl:row-span-2">
          <TodayProgress
            revenue={k.revenue} target={revenueTarget} bills={k.bills}
            yesterdayBills={priorDay ? priorDay.bills : null}
          />
          <TopCategories categories={insights?.categories ?? []} />
          <PaymentDonut payments={insights?.payments ?? []} />
          {insights && <AchievementCard a={insights.achievements} />}
        </aside>

  <Section title="Recent outcomes" icon={<ClipboardCheck size={15} />}
    className="min-w-0 xl:col-start-1 xl:row-start-2"
    aside={won + lost > 0 ? `${winRate}% won · ${won}/${lost} all time` : undefined}>
        {closed.walkins.length === 0 ? (
          <Empty>No closed leads yet. Logged outcomes show up here.</Empty>
        ) : (
          <div className="space-y-2">
            {closed.walkins.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-start gap-2.5 py-2 border-b border-[var(--border)] last:border-0">
                <OutcomeBadge status={w.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-[var(--text)] truncate">{w.customerName ?? "Walk-in"}{w.customerPhone ? <span className="text-[var(--faint)] font-normal"> · {w.customerPhone}</span> : ""}</p>
                  {w.lastOutcome && w.lastOutcome !== w.status && <p className="text-[12px] text-[var(--muted)] truncate">“{w.lastOutcome}”</p>}
                </div>
                {w.customerPhone && (
                  <a href={`https://wa.me/${waNumber(w.customerPhone)}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success)] shrink-0" aria-label="WhatsApp"><MessageCircle size={14} /></a>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
      </div>
    </div>
  );
}


// Server-rendered, so this follows the server's clock — the store and the box
// run in the same timezone.
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Count non-empty values, biggest first. Used for the party mix.
// One line per party across the window. Plain SVG on the server — a handful of
// polylines does not need a chart library or any client JS.
function PartyLines({ series, days }: { series: { party: string; colour: string; total: number; points: number[] }[]; days: string[] }) {
  const W = 300, H = 96, PAD_X = 4, PAD_Y = 8;
  const peak = Math.max(1, ...series.flatMap((s) => s.points));
  const step = days.length > 1 ? (W - PAD_X * 2) / (days.length - 1) : 0;
  const x = (i: number) => PAD_X + i * step;
  const y = (v: number) => H - PAD_Y - ((H - PAD_Y * 2) * v) / peak;

  return (
    <div className="py-0.5">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img"
        aria-label={`Walk-ins per day by party over ${days.length} days, peaking at ${peak}`}>
        {/* Baseline, so a flat run reads as zero rather than as missing. */}
        <line x1={PAD_X} x2={W - PAD_X} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth="1" />
        {series.map((s) => (
          <polyline key={s.party} fill="none" stroke={s.colour} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
        ))}
        {series.map((s) => (
          <circle key={`${s.party}-dot`} cx={x(s.points.length - 1)} cy={y(s.points[s.points.length - 1])} r="2.5" fill={s.colour} />
        ))}
      </svg>

      <div className="flex justify-between text-[9px] text-[var(--faint)] tabular-nums mt-1">
        {days.map((d) => <span key={d}>{d.slice(8)}</span>)}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {series.map((s) => (
          <span key={s.party} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="w-2.5 h-0.5 rounded-full" style={{ background: s.colour }} />
            {s.party}
            <span className="tabular-nums text-[var(--faint)]">{s.total}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function tally(values: (string | null)[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function TargetBar({ label, done, target, fmt }: { label: string; done: number; target: number; fmt: (n: number) => string }) {
  const p = Math.min(100, Math.round((done / target) * 100));
  return (
    <div className="flex items-center gap-2.5 text-[12px]">
      <span className="w-16 shrink-0 text-[var(--muted)]">{label}</span>
      <span className="flex-1 h-2 rounded-full bg-[var(--surface-raised)] overflow-hidden">
        <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${p}%` }} />
      </span>
      <span className="shrink-0 tabular-nums text-[var(--muted)]">
        <span className="font-semibold text-[var(--text)]">{fmt(done)}</span> / {fmt(target)} · {p}%
      </span>
    </div>
  );
}

function FunnelRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-20 shrink-0 text-[var(--muted)] truncate">{label}</span>
      <span className="flex-1 h-6 rounded-md bg-[var(--surface-raised)] overflow-hidden">
        <span className="block h-full rounded-md bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right font-semibold text-[var(--text)] tabular-nums">{value} · {pct}%</span>
    </div>
  );
}

function OutcomeBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    won: { cls: "bg-[var(--success-bg)] text-[var(--success)]", label: "Won" },
    lost: { cls: "bg-[var(--surface-raised)] text-[var(--muted)]", label: "Lost" },
    contacted: { cls: "bg-[var(--warning-bg)] text-[var(--warning)]", label: "Contacted" },
  };
  const m = map[status] ?? { cls: "bg-[var(--surface-raised)] text-[var(--muted)]", label: status };
  return <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${m.cls}`}>{m.label}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--faint)] py-3 text-center">{children}</p>;
}

function Section({ title, icon, children, aside, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; aside?: string; className?: string }) {
  return (
    <div className={`rlp-card rlp-card--flat overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2 className="text-[13px] font-semibold text-[var(--text)]">{title}</h2>
        {aside && <span className="ml-auto text-[11px] text-[var(--faint)] tabular-nums">{aside}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
