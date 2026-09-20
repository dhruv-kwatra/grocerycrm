import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { ArrowLeft, Store, TrendingUp, IndianRupee, Trophy, ClipboardCheck, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

type StoreRow = {
  nodeId: number; name: string; zone: string;
  distributorName: string | null; partnerName: string | null;
  compliance: number | null; revenue: number; bills: number; footfall: number; conversion: number;
};
type Tier = { tier: string; floor: number };
type Territory = {
  period: string; totalStores: number; zones: { zone: string; stores: StoreRow[] }[];
  // Programme thresholds, owned by the backend so every screen quotes the same.
  complianceTarget?: number; tiers?: Tier[];
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(1)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`);
// The compliance target and the Gold Circle bands used to be copied here. They
// now arrive on the territory payload, so this screen and the estate board
// cannot quote different numbers for the same programme.
const tierFor = (revenue: number, tiers: Tier[]) =>
  tiers.find((t) => revenue >= t.floor) ?? tiers[tiers.length - 1] ?? { tier: "—", floor: 0 };

export default async function TerritoryStorePage({ params }: { params: Promise<{ nodeId: string }> }) {
  await guardRetail(["brand", "partner", "superadmin"]);
  const { nodeId } = await params;
  const id = Number(nodeId);
  const t = await apiGet<Territory>("/api/retail/analytics/territory?period=month").catch(() => null);
  const all = (t?.zones ?? []).flatMap((z) => z.stores);
  const store = all.find((s) => s.nodeId === id) ?? null;

  if (!t || !store) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-3">
        <Back />
        <p className="text-sm text-[var(--muted)]">That store isn&apos;t in your territory.</p>
      </div>
    );
  }

  // The partner's own estate — every outlet under the same partner, this store
  // included. Unowned stores fall back to just themselves.
  const outlets = (store.partnerName ? all.filter((s) => s.partnerName === store.partnerName) : [store])
    .sort((a, b) => b.revenue - a.revenue);
  const revenue = outlets.reduce((s, o) => s + o.revenue, 0);
  const footfall = outlets.reduce((s, o) => s + o.footfall, 0);
  const bills = outlets.reduce((s, o) => s + o.bills, 0);
  const blended = footfall > 0 ? Math.round((bills / footfall) * 1000) / 10 : 0;
  const compliances = outlets.map((o) => o.compliance).filter((c): c is number => c != null);
  const avgCompliance = compliances.length ? Math.round(compliances.reduce((a, b) => a + b, 0) / compliances.length) : null;

  const tiers = t.tiers ?? [];
  const complianceTarget = t.complianceTarget ?? null;
  const { tier, floor } = tierFor(revenue, tiers);
  const next = tiers[tiers.findIndex((x) => x.tier === tier) - 1] ?? null;
  const toNext = next ? next.floor - revenue : 0;
  const progress = next ? Math.min(100, Math.round(((revenue - floor) / (next.floor - floor)) * 100)) : 100;
  const peak = Math.max(1, ...outlets.map((o) => o.conversion));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div>
        <Back />
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">
            {store.partnerName ?? store.name}
          </h1>
          <span className="text-[10px] font-bold uppercase tracking-[0.09em] px-2 py-0.5 rounded-full bg-[var(--text)] text-[var(--surface)]">Partner</span>
        </div>
        <p className="text-[12px] text-[var(--faint)]">
          {outlets.length} outlet{outlets.length === 1 ? "" : "s"} on one yardstick, and the road to Gold Circle T1 · {t.period}
        </p>
      </div>

      {/* What this tier sees — the same scope line the partner gets. */}
      <p className="text-[12px] text-[var(--muted)] bg-[var(--surface)] border border-dashed border-[var(--border-strong)] rounded-xl px-3.5 py-2.5">
        <b className="text-[var(--accent-dark)]">Sees:</b> only their own outlets.{" "}
        <b className="text-[var(--accent-dark)]">Blocked:</b> other partners&apos; stores, distributor pricing.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Store size={15} />} label="Outlets" value={String(outlets.length)} sub={outlets.map((o) => o.zone).filter((z, i, a) => a.indexOf(z) === i).join(" · ")} />
        <Kpi icon={<TrendingUp size={15} />} label="Blended conversion" value={`${blended}%`} sub={`${bills} bills · ${footfall} footfall`} />
        <Kpi icon={<IndianRupee size={15} />} label="Revenue" value={inrShort(revenue)} sub={t.period} />
        <Kpi icon={<Trophy size={15} />} label="Gold Circle" value={tier} sub={next ? `${next.tier} at +${inrShort(toNext)}` : "Top tier"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
        {/* Outlet comparison — one yardstick, conversion. */}
        <Card title="Outlet comparison" note={t.period} className="lg:col-span-3">
          <div className="divide-y divide-[var(--border)]">
            {outlets.map((o) => {
              const here = o.nodeId === store.nodeId;
              return (
                <div key={o.nodeId} className="flex items-center gap-3 py-2.5 first:pt-0.5 last:pb-0.5">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] truncate ${here ? "font-bold text-[var(--text)]" : "font-medium text-[var(--text)]"}`}>
                      {o.name}
                      {here && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">this store</span>}
                    </p>
                    <p className="text-[11px] text-[var(--faint)] flex items-center gap-1">
                      <MapPin size={10} />{o.zone} · footfall {o.footfall.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="hidden sm:block w-24 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden shrink-0">
                    <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (o.conversion / peak) * 100)}%` }} />
                  </span>
                  <div className="w-24 text-right shrink-0">
                    <p className={`text-[12.5px] font-bold tabular-nums ${o.conversion >= blended ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{o.conversion}% conv</p>
                    <p className="text-[11px] text-[var(--muted)] tabular-nums">{inrShort(o.revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* The road to T1 — how far the estate is from the next band. */}
        <Card title="Road to Gold Circle T1" note={`Now ${tier}`} className="lg:col-span-2">
          <p className="text-[24px] font-bold text-[var(--text)] tabular-nums leading-none">{inrShort(revenue)}</p>
          <p className="text-[11.5px] text-[var(--muted)] mt-1">
            {next ? <>{inrShort(toNext)} more to {next.tier}</> : "Top band held"}
          </p>
          <div className="mt-3 h-2 rounded-full bg-[var(--surface-raised)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(3, progress)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-[var(--faint)] mt-1 tabular-nums">
            <span>{tier} · {inrShort(floor)}</span>
            <span>{next ? `${next.tier} · ${inrShort(next.floor)}` : ""}</span>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
            <Line label="Avg planogram compliance" value={avgCompliance == null ? "—" : String(avgCompliance)}
              tone={avgCompliance != null && complianceTarget != null && avgCompliance < complianceTarget ? "warn" : "good"}
              sub={complianceTarget != null ? `target ${complianceTarget}` : undefined} icon={<ClipboardCheck size={12} />} />
            <Line label="Best outlet" value={`${outlets[0]?.conversion ?? 0}%`} tone="good" sub={outlets[0]?.name ?? "—"} />
            {outlets.length > 1 && (
              <Line label="Needs coaching" value={`${outlets[outlets.length - 1].conversion}%`} tone="warn" sub={outlets[outlets.length - 1].name} />
            )}
            <Line label="Distributor" value={store.distributorName ?? "—"} tone="info" sub={`Revenue this period ${inr(store.revenue)}`} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link href="/retail/territory" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--muted)] hover:text-[var(--text)]">
      <ArrowLeft size={13} /> Territory
    </Link>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rlp-card p-3.5">
      <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">{icon}{label}</span>
      <p className="text-[20px] font-bold text-[var(--text)] tabular-nums leading-none mt-1.5">{value}</p>
      {sub && <p className="text-[11px] text-[var(--faint)] mt-1 truncate">{sub}</p>}
    </div>
  );
}

function Card({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rlp-card p-3.5 ${className}`}>
      <div className="flex items-baseline gap-2 mb-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--faint)]">{title}</h2>
        {note && <span className="ml-auto text-[11px] text-[var(--muted)]">{note}</span>}
      </div>
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  good: "bg-[var(--success-bg)] text-[var(--success)]",
  warn: "bg-[var(--warning-bg)] text-[var(--warning)]",
  info: "bg-[var(--accent-light)] text-[var(--accent-dark)]",
};

function Line({ label, value, sub, tone, icon }: { label: string; value: string; sub?: string; tone: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-[var(--text)] flex items-center gap-1 truncate">{icon}{label}</p>
        {sub && <p className="text-[11px] text-[var(--faint)] truncate">{sub}</p>}
      </div>
      <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${TONE[tone]}`}>{value}</span>
    </div>
  );
}
