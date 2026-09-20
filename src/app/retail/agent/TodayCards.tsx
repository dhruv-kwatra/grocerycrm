import Link from "next/link";
import {
  TrendingUp, ReceiptText, Footprints, Target, ArrowUpRight, ArrowDownRight,
  Megaphone, Award, Flame, ShoppingCart, Wallet,
} from "lucide-react";

// Server components, all of them. Every card here is a static render of data the
// page already fetched, so none of it ships JavaScript — the sparklines and the
// donut are plain SVG rather than a chart library.

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

export type SeriesPoint = { date: string; revenue: number; bills: number; units: number; footfall: number; won: number };
export type Trend = { comparedTo: string; revenue: number | null; bills: number | null; units: number | null; footfall: number | null } | null;
export type Category = { category: string; units: number; revenue: number; share: number };
export type Payment = { method: string; bills: number; revenue: number; share: number };
export type Achievements = { billsAllTime: number; unitsAllTime: number; revenueAllTime: number; streakDays: number; nextMilestone: number | null };
export type Note = { id: number; kind: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string | null };

// ── Top KPI row ───────────────────────────────────────────────────────────────

// The sparkline is the agent's own last seven days, so it carries information
// rather than decoration. Flat line = a flat week, and that's worth seeing.
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 52, h = 22, pad = 1;
  if (values.length < 2) return <span className="w-[52px] shrink-0" />;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-[var(--faint)]">no prior day</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${up ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

export function KpiCards({
  revenue, bills, footfall, conversion, target, series, trend,
}: {
  revenue: number; bills: number; footfall: number; conversion: number;
  target?: number; series: SeriesPoint[]; trend: Trend;
}) {
  const cards = [
    { label: "Revenue", value: inr(revenue), icon: TrendingUp, color: "var(--chart-1)", spark: series.map((d) => d.revenue), delta: trend?.revenue ?? null },
    { label: "Bills", value: String(bills), icon: ReceiptText, color: "var(--chart-2)", spark: series.map((d) => d.bills), delta: trend?.bills ?? null },
    { label: "Footfall", value: String(footfall), icon: Footprints, color: "var(--chart-3)", spark: series.map((d) => d.footfall), delta: trend?.footfall ?? null },
    // won / walk-ins, matching how the backend computes the headline number.
    // This used to be bills / footfall, which is a different quotient — the
    // sparkline and the figure above it would have drifted apart.
    { label: "Conversion", value: `${conversion}%`, icon: Target, color: "var(--chart-4)", spark: series.map((d) => (d.footfall > 0 ? Math.round((d.won / d.footfall) * 100) : 0)), delta: null },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rlp-card relative overflow-hidden p-4 space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--surface-raised)" }}>
                <c.icon size={13} style={{ color: c.color }} />
              </span>
              {/* Label wraps rather than truncating: at this size "Conversion"
                  overflows the tile on a phone, and a KPI whose name reads
                  "CONVE…" isn't a KPI. */}
              <span className="rlp-stat-label text-[9.5px] leading-tight">{c.label}</span>
            </span>
            <Sparkline values={c.spark} color={c.color} />
          </div>
          <p className="rlp-stat-value text-xl md:text-[1.8rem] truncate">{c.value}</p>
          <Delta value={c.delta} />
          {target && c.label === "Revenue" && (
            <div className="mt-1.5 h-1 rounded-full bg-[var(--surface-raised)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.round((revenue / target) * 100))}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Right rail ────────────────────────────────────────────────────────────────

function RailCard({ title, icon, badge, children }: { title: string; icon?: React.ReactNode; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rlp-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">{title}</h3>
        {badge && <span className="ml-auto text-[9px] font-medium text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

export function TodayProgress({ revenue, target, bills, yesterdayBills }: { revenue: number; target?: number; bills: number; yesterdayBills: number | null }) {
  const pct = target && target > 0 ? Math.min(100, Math.round((revenue / target) * 100)) : 0;
  const remaining = target ? Math.max(0, target - revenue) : 0;
  const diff = yesterdayBills === null ? null : bills - yesterdayBills;

  return (
    <RailCard title="Today's progress" icon={<Target size={14} className="text-[var(--accent)]" />}>
      <div className="space-y-2">
        <Line label="Target" value={target ? inr(target) : "Not set"} />
        <Line label="Achieved" value={inr(revenue)} />
        <Line label="Remaining" value={target ? (remaining > 0 ? inr(remaining) : "Done!") : "—"}
          tone={target ? (remaining > 0 ? "warn" : "good") : undefined} />
        <Line label="Bills completed" value={String(bills)} />
      </div>

      {target ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)]">Progress</span>
            <span className="font-bold text-[var(--text)] tabular-nums">{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface-raised)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[var(--faint)]">No month target set for you yet — ask your manager to set one.</p>
      )}

      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] bg-[var(--surface-raised)] rounded-xl px-3 py-2">
        <ShoppingCart size={12} className="text-[var(--accent)]" />
        <span>{bills} bill{bills === 1 ? "" : "s"} today</span>
        {diff !== null && (
          <span className={`ml-auto font-medium ${diff >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            {diff >= 0 ? "+" : ""}{diff} vs prior day
          </span>
        )}
      </div>
    </RailCard>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: "warn" | "good" }) {
  const colour = tone === "warn" ? "text-[var(--warning)]" : tone === "good" ? "text-[var(--success)]" : "text-[var(--text)]";
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`font-semibold tabular-nums ${colour}`}>{value}</span>
    </div>
  );
}

// Magnitude by category — a bar per category, which reads more precisely than a
// second donut would. Sorted by revenue, longest first.
export function TopCategories({ categories }: { categories: Category[] }) {
  const top = categories.slice(0, 5);
  return (
    <RailCard title="Top categories">
      {top.length === 0 ? (
        <p className="text-[11.5px] text-[var(--faint)] py-1">No sales logged this month yet.</p>
      ) : (
        <div className="space-y-3">
          {top.map((c, i) => (
            <div key={`${c.category}-${i}`} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-[var(--text)] font-medium truncate">{c.category}</span>
                <span className="text-[var(--faint)] tabular-nums shrink-0">{c.share}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, c.share)}%`, background: `var(--chart-${(i % 4) + 1})` }} />
              </div>
              <p className="text-[10px] text-[var(--faint)] tabular-nums">{c.units} unit{c.units === 1 ? "" : "s"} · {inr(c.revenue)}</p>
            </div>
          ))}
        </div>
      )}
    </RailCard>
  );
}

// Payment mix. Part-to-whole over a handful of methods, so a donut works — with
// a 2px surface gap between segments, a legend carrying the numbers (identity is
// never colour alone), and the total as the hero in the hole.
const PAYMENT_SLOT: Record<string, string> = { cash: "var(--chart-1)", upi: "var(--chart-2)", card: "var(--chart-3)" };
const paymentColour = (method: string, i: number) => PAYMENT_SLOT[method] ?? `var(--chart-${(i % 4) + 1})`;
const titleCase = (s: string) => (s === "upi" ? "UPI" : s.charAt(0).toUpperCase() + s.slice(1));

export function PaymentDonut({ payments }: { payments: Payment[] }) {
  const total = payments.reduce((n, p) => n + p.bills, 0);
  const R = 42, C = 2 * Math.PI * R, GAP = 2;

  // Prefix sum, not a running accumulator — each arc's start is derived from the
  // slices before it, so nothing is reassigned mid-render.
  const arcs = payments.map((p, i) => {
    const before = payments.slice(0, i).reduce((n, q) => n + q.bills, 0);
    const safeTotal = total || 1;
    return {
      colour: paymentColour(p.method, i),
      dash: Math.max(0, (p.bills / safeTotal) * C - GAP),
      offset: (before / safeTotal) * C,
    };
  });

  return (
    <RailCard title="Payment mode" icon={<Wallet size={14} className="text-[var(--accent)]" />}>
      {total === 0 ? (
        <p className="text-[11.5px] text-[var(--faint)] py-1">No bills logged this month yet.</p>
      ) : (
        <>
          <div className="flex justify-center py-1">
            <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Payment mode: ${payments.map((p) => `${titleCase(p.method)} ${p.share}%`).join(", ")}`}>
              <g transform="rotate(-90 60 60)">
                {arcs.map((a, i) => (
                  <circle
                    key={i}
                    cx="60" cy="60" r={R}
                    fill="none"
                    stroke={a.colour}
                    strokeWidth="16"
                    strokeDasharray={`${a.dash} ${C - a.dash}`}
                    strokeDashoffset={-a.offset}
                  />
                ))}
              </g>
              <text x="60" y="56" textAnchor="middle" className="fill-[var(--text)]" style={{ fontSize: 20, fontWeight: 700 }}>{total}</text>
              <text x="60" y="72" textAnchor="middle" className="fill-[var(--faint)]" style={{ fontSize: 9.5 }}>bills</text>
            </svg>
          </div>
          <ul className="space-y-1.5">
            {payments.map((p, i) => (
              <li key={p.method} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: paymentColour(p.method, i) }} />
                <span className="text-[var(--muted)] truncate">{titleCase(p.method)}</span>
                <span className="ml-auto tabular-nums text-[var(--text)] font-semibold">{p.share}%</span>
                <span className="tabular-nums text-[var(--faint)] w-14 text-right">{p.bills} bill{p.bills === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </RailCard>
  );
}

export function Announcements({ notes }: { notes: Note[] }) {
  const recent = notes.slice(0, 4);
  return (
    <RailCard title="Announcements" icon={<Megaphone size={14} className="text-[var(--accent)]" />} badge={recent.length ? String(recent.length) : undefined}>
      {recent.length === 0 ? (
        <p className="text-[11.5px] text-[var(--faint)] py-1">Nothing from your store right now.</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((n) => {
            const unread = !n.readAt;
            const row = (
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: unread ? "var(--accent)" : "var(--border-strong)" }} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] truncate ${unread ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--muted)]"}`}>{n.title}</p>
                  {n.body && <p className="text-[10.5px] text-[var(--faint)] truncate">{n.body}</p>}
                  <p className="text-[10px] text-[var(--faint)] mt-0.5">{ago(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link
              ? <Link key={n.id} href={n.link} className="block hover:opacity-80">{row}</Link>
              : <div key={n.id}>{row}</div>;
          })}
        </div>
      )}
      <Link href="/retail/notifications" className="block text-[11px] font-semibold text-[var(--accent)] hover:underline">All notifications →</Link>
    </RailCard>
  );
}

export function AchievementCard({ a }: { a: Achievements }) {
  const next = a.nextMilestone;
  const pct = next ? Math.min(100, Math.round((a.billsAllTime / next) * 100)) : 100;
  return (
    <RailCard title="Achievements" icon={<Award size={14} className="text-[var(--accent)]" />}>
      <div className="flex items-center gap-2 bg-[var(--surface-raised)] rounded-xl px-3 py-2">
        <Flame size={14} className={a.streakDays > 0 ? "text-[var(--warning)]" : "text-[var(--faint)]"} />
        <span className="text-[12px] text-[var(--muted)]">Sale streak</span>
        <span className="ml-auto text-[13px] font-bold tabular-nums text-[var(--text)]">
          {a.streakDays} day{a.streakDays === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-2">
        <Line label="Bills, all time" value={String(a.billsAllTime)} />
        <Line label="Units, all time" value={String(a.unitsAllTime)} />
        <Line label="Revenue, all time" value={inr(a.revenueAllTime)} />
      </div>

      {next ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)]">Next milestone · {next} bills</span>
            <span className="font-bold tabular-nums text-[var(--text)]">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-raised)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-[var(--faint)] tabular-nums">{next - a.billsAllTime} more to go</p>
        </div>
      ) : (
        <p className="text-[11px] font-semibold text-[var(--success)]">Every milestone cleared.</p>
      )}
    </RailCard>
  );
}

// Coarse relative time — enough for a feed, and it avoids shipping a date lib.
function ago(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
