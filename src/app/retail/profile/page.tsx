import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";
import {
  Contact, Bell, BookOpen, ChevronRight, Target, ShieldCheck, MapPin, Mail,
  Presentation, TrendingUp, Flame, Award, Building2, UserRound, UsersRound,
} from "lucide-react";
import { guardRetail } from "@/lib/retail/guard";
import type { GroceryRole } from "@/lib/retail/constants";

const ROLE_LABEL: Record<GroceryRole, string> = {
  store_associate: "Store Associate",
  store_manager: "Store Manager",
  brand: "Brand",
  distributor: "Distributor",
  partner: "Partner",
  superadmin: "Platform Staff",
};

export const dynamic = "force-dynamic";

type Summary = {
  kpis: { demos: number; bills: number; units: number; revenue: number; footfall: number; conversion: number };
  targets: Record<string, number>;
};
type SeriesPoint = { date: string; revenue: number; bills: number; units: number; footfall: number };
type Achievements = { billsAllTime: number; unitsAllTime: number; revenueAllTime: number; streakDays: number; nextMilestone: number | null };
type Insights = { series: SeriesPoint[]; achievements: Achievements };
type Walkin = { id: number; customerName: string | null; status: string; lastOutcome: string | null };
// GET /api/retail/profile — node, supervisor and headcount, all derived
// server-side from the assignment table.
type Profile = {
  assigned: boolean;
  node: { id: number; name: string; nodeType: string; path: string } | null;
  supervisor: { id: number; name: string; email: string } | null;
  team: { total: number; byRole: Record<string, number> };
};

// Everyone gets the first two. "My customers" is the agent's own book and is
// guarded to store_associate, so offering it to a manager would just bounce them
// back to their role home.
const LINKS = [
  { label: "Notifications", href: "/retail/notifications", icon: Bell },
  { label: "How to use this", href: "/retail/guide", icon: BookOpen },
];
const AGENT_LINKS = [{ label: "My customers", href: "/retail/agent/customers", icon: Contact }];

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}k` : inr(n));

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Seven-day revenue bars. Plain SVG, server-rendered — the shape is the point,
// so it doesn't need a chart library or a kilobyte of client JS.
function Telemetry({ series }: { series: SeriesPoint[] }) {
  if (series.length < 2) return null;
  const max = Math.max(...series.map((d) => d.revenue), 1);
  return (
    // The bar's percentage height needs an ancestor with a resolved height to
    // measure against. The column itself is auto-height, so the bar sits in a
    // flex-1 track inside a fixed-height row — that track has a real height,
    // the label keeps its own space, and the percentages mean something.
    <div className="flex items-stretch gap-1.5 h-24" role="img" aria-label={`Revenue over the last ${series.length} days, peaking at ${inrShort(max)}`}>
      {series.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex-1 flex items-end">
            <div className="w-full rounded-t-[3px] bg-[image:var(--accent-grad)]" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} />
          </div>
          <span className="text-[9px] text-[var(--faint)] tabular-nums truncate w-full text-center">{d.date.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rlp-card p-3.5">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        {icon}
      </span>
      <p className="rlp-stat-label text-[9.5px] leading-tight">{label}</p>
      <p className="rlp-stat-value text-[1.35rem] mt-0.5 truncate">{value}</p>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)] first:border-t-0">
      <span className="text-[var(--faint)] shrink-0">{icon}</span>
      <span className="text-[11.5px] text-[var(--muted)] shrink-0">{label}</span>
      <span className="ml-auto text-[12.5px] font-medium text-[var(--text)] truncate text-right">{value}</span>
    </div>
  );
}

export default async function AgentMePage() {
  // Every role reaches this from the header avatar, so the guard admits all of
  // them. The agent-only panels below are gated on the role instead — a brand
  // user has no walk-in queue and no demos, and empty cards would just be noise.
  const scope = await guardRetail(["store_associate", "store_manager", "brand", "distributor", "partner", "superadmin"]);
  const isAgent = scope.role === "store_associate" || scope.role === "superadmin";
  const [user, profile, summary, insights, closed] = await Promise.all([
    getCurrentUser(),
    apiGet<Profile>("/api/retail/profile").catch(() => null),
    isAgent ? apiGet<Summary>("/api/retail/agent/summary").catch(() => null) : null,
    isAgent ? apiGet<Insights>("/api/retail/agent/insights").catch(() => null) : null,
    isAgent
      // Only the six most recent are shown, so ask for six rather than pulling
      // the agent's whole history down to slice it here.
      ? apiGet<{ walkins: Walkin[] }>("/api/retail/agent/walkins?status=closed&limit=6").catch(() => ({ walkins: [] as Walkin[] }))
      : { walkins: [] as Walkin[] },
  ]);

  const k = summary?.kpis;
  const target = summary?.targets.revenue;
  const ach = insights?.achievements;

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-md lg:max-w-3xl mx-auto w-full">
      {/* Banner */}
      <div className="rlp-card rlp-card--flat relative overflow-hidden p-6 text-center">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-64 h-64 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div className="relative flex flex-col items-center gap-3">
          {user.avatarUrl ? (
            // Deliberately a plain <img>, not next/image: avatarUrl comes from
            // the backend and its origin isn't known here. next/image throws at
            // runtime on a host missing from images.remotePatterns, which would
            // take out the whole page for the sake of one portrait.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
              style={{ boxShadow: "var(--accent-glow)" }}
            />
          ) : (
            <span
              className="w-20 h-20 rounded-full bg-[image:var(--accent-grad)] text-white flex items-center justify-center text-2xl font-bold"
              style={{ boxShadow: "var(--accent-glow)" }}
            >
              {initials(user.name)}
            </span>
          )}
          <div>
            <p className="text-[1.35rem] font-extrabold text-[var(--text)] leading-tight">{user.name}</p>
            <p className="text-[12.5px] text-[var(--muted)] mt-0.5">{ROLE_LABEL[scope.role]}</p>
          </div>
          {ach && ach.streakDays > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              <Flame size={12} /> {ach.streakDays}-day selling streak
            </span>
          )}
        </div>
      </div>

      {/* All-time and today, from the counters the agent screen already reads. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {k && <Stat icon={<Presentation size={14} />} label="Demos today" value={String(k.demos)} />}
        {k && <Stat icon={<TrendingUp size={14} />} label="Conversion" value={`${k.conversion}%`} />}
        {ach && <Stat icon={<Award size={14} />} label="Revenue all time" value={inrShort(ach.revenueAllTime)} />}
        {ach && <Stat icon={<Target size={14} />} label="Bills all time" value={String(ach.billsAllTime)} />}
      </div>

      {insights && insights.series.length > 1 && (
        <div className="rlp-card rlp-card--flat p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">Sales telemetry · last {insights.series.length} days</p>
            {target && k && <p className="text-[11px] text-[var(--muted)] tabular-nums">{inrShort(k.revenue)} of {inrShort(target)} today</p>}
          </div>
          <Telemetry series={insights.series} />
        </div>
      )}

      {/* Personal & system meta — every row is something the app actually
          knows. The prototype also showed a direct phone number, a reporting
          supervisor and a CSAT score; there is no endpoint behind any of the
          three, so they are left out rather than invented. */}
      <div className="rlp-card rlp-card--flat overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">Personal &amp; system</p>
        <MetaRow icon={<Mail size={14} />} label="Corporate email" value={user.email} />
        <MetaRow icon={<ShieldCheck size={14} />} label="Security clearance" value={`${ROLE_LABEL[scope.role]}${scope.readOnly ? " · read only" : ""}`} />
        {profile?.node && <MetaRow icon={<Building2 size={14} />} label="Store" value={profile.node.name} />}
        {profile?.supervisor && <MetaRow icon={<UserRound size={14} />} label="Reports to" value={profile.supervisor.name} />}
        {profile?.team && profile.team.total > 0 && (
          <MetaRow icon={<UsersRound size={14} />} label="Team on this node" value={`${profile.team.total} ${profile.team.total === 1 ? "person" : "people"}`} />
        )}
        {scope.path && <MetaRow icon={<MapPin size={14} />} label="Assigned scope" value={scope.path} />}
      </div>

      {closed.walkins.length > 0 && (
        <div className="rlp-card rlp-card--flat overflow-hidden">
          <p className="px-4 pt-3.5 pb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--faint)]">Recent floor activity</p>
          {closed.walkins.slice(0, 6).map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={
                  w.status === "won"
                    ? { background: "var(--success-bg)", color: "var(--success)" }
                    : { background: "var(--surface-raised)", color: "var(--muted)" }
                }
              >
                {w.status === "won" ? "Won" : "Lost"}
              </span>
              <span className="text-[13px] text-[var(--text)] truncate">{w.customerName ?? "Walk-in"}</span>
              {w.lastOutcome && <span className="ml-auto text-[11px] text-[var(--faint)] truncate max-w-[45%]">{w.lastOutcome}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="rlp-card overflow-hidden">
        {[...(isAgent ? AGENT_LINKS : []), ...LINKS].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 border-t border-[var(--border)] first:border-t-0 text-[14px] text-[var(--text)]">
            <Icon size={17} className="text-[var(--accent)] shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight size={16} className="text-[var(--faint)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
