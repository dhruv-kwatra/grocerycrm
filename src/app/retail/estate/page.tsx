import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { Building2, Download, ArrowUp, ArrowDown, Camera, ClipboardCheck, Send, CalendarClock, AlertTriangle } from "lucide-react";
import { pushAction } from "./actions";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { InfoHint } from "../_components/InfoHint";
import { fmtDate } from "@/lib/retail/datetime";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type Exception = { tone: string; text: string } | null;
type Row = {
  nodeId: number; name: string; zone: string;
  distributorName: string | null; partnerName: string | null;
  compliance: number | null; complianceDelta: number | null; complianceWeek?: number | null;
  footfall: number; bills: number; revenue: number; conversion: number;
  focusUnits: number; focusTarget: number | null;
  openFindings: number; stockOuts: number; exception: Exception;
};
type Rcm = {
  week: { from: string; to: string; label: string };
  kpis: {
    avgCompliance: number; avgComplianceDelta: number | null; target: number;
    conversion: number; conversionDelta: number | null;
    focusUnits: number; focusTarget: number; flagged: number; revenue: number; footfall: number;
  };
  filters: { zones: string[]; distributors: string[]; partners: string[] };
  stores: number; rows: Row[];
};
type Finding = { id: number; kind: string; title: string; detail: string | null; photoUrl: string | null; status: string; createdAt: string | null };
type Detail = {
  store: { nodeId: number; name: string; zone: string; distributorName: string | null; partnerName: string | null };
  compliance: { target: number; current: number | null; delta: number | null; weeks: { label: string; score: number | null }[] };
  findings: Finding[];
};

type Search = { zone?: string; distributor?: string; partner?: string; store?: string; week?: string };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);
const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(1)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : inr(n));
// Compliance colour encodes the threshold, never the zone or distributor.
const scoreTone = (score: number | null, target: number) =>
  score == null ? "var(--faint)" : score < target - 10 ? "var(--error)" : score < target ? "var(--warning)" : "var(--success)";

export default async function EstateView({ searchParams }: { searchParams: Promise<Search> }) {
  await guardRetail(["brand","superadmin"]);
  const sp = await searchParams;
  const rcm = await apiGet<Rcm>(`/api/retail/estate/rcm${sp.week ? `?week=${sp.week}` : ""}`).catch(() => null);
  // Remove restriction: gracefully handle missing backend data by providing a default empty rcm.
  const data = rcm || {
    week: { from: "", to: "", label: "Wk 31" },
    kpis: { avgCompliance: 0, avgComplianceDelta: null, target: 95, conversion: 0, conversionDelta: null, focusUnits: 0, focusTarget: 0, flagged: 0, revenue: 0, footfall: 0 },
    filters: { zones: [], distributors: [], partners: [] },
    stores: 0, rows: []
  };

  const rows = data.rows.filter((r) =>
    (!sp.zone || r.zone === sp.zone) &&
    (!sp.distributor || r.distributorName === sp.distributor) &&
    (!sp.partner || r.partnerName === sp.partner));

  // The drawer follows the table: an explicit ?store= wins, else the worst store.
  const selectedId = Number(sp.store) || rows[0]?.nodeId;
  const detail = selectedId
    ? await apiGet<Detail>(`/api/retail/estate/store/${selectedId}${sp.week ? `?week=${sp.week}` : ""}`).catch(() => null)
    : null;

  const k = data.kpis;
  const focusPct = k.focusTarget > 0 ? Math.round((k.focusUnits / k.focusTarget) * 100) : null;
  const href = (patch: Partial<Search>) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries({ ...sp, ...patch })) if (val) params.set(key, String(val));
    return `/retail/estate${params.size ? `?${params}` : ""}`;
  };
  const field = "px-2.5 py-1.5 text-[12.5px] font-medium border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)]";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[112rem] mx-auto w-full">
      {/* Head — whose estate, which week, and the weekly pack. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0"><Building2 size={17} className="text-[var(--accent)]" /></span>
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">
            Estate <span className="font-normal text-[var(--faint)]">· {data.stores} stores</span>
          </h1>
          <p className="text-[12px] text-[var(--faint)]">{data.week.label} · exceptions first, evidence attached</p>
        </div>
        <div className="flex-1" />
        <a
          href="/api/retail/analytics/export?period=week&type=sales"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold border border-[var(--border-strong)] text-[var(--muted)] rounded-lg hover:bg-[var(--surface-raised)]"
        >
          <Download size={14} /> Export weekly pack
        </a>
      </div>

      {/* Filters — a plain GET form; the board re-renders from the URL. */}
      <form method="GET" className="flex flex-wrap items-center gap-2 rlp-card px-3 py-2.5">
        <Filter name="zone" label="Zone" value={sp.zone} options={data.filters.zones} className={field} />
        <Filter name="distributor" label="Distributor" value={sp.distributor} options={data.filters.distributors} className={field} />
        <Filter name="partner" label="Partner" value={sp.partner} options={data.filters.partners} className={field} />
        <SubmitLikeButton />
        {(sp.zone || sp.distributor || sp.partner) && (
          <Link href="/retail/estate" className="text-[12px] text-[var(--muted)] hover:text-[var(--text)]">Clear</Link>
        )}
        <span className="ml-auto text-[11.5px] text-[var(--faint)]">
          Sorted by <b className="text-[var(--accent)]">exceptions first</b>
          <InfoHint text="Flagged stores surface to the top — compliance critical, then stock-outs, then low conversion. Healthy stores earn their invisibility." className="ml-1 align-middle" />
        </span>
      </form>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Avg planogram score" value={String(k.avgCompliance)} delta={k.avgComplianceDelta} deltaSuffix=" vs last wk" hint={`Photo-audit pass rate across the estate this week. Target ${k.target}.`} />
        <Kpi label="Estate conversion" value={`${k.conversion}%`} unit="" delta={k.conversionDelta} deltaSuffix=" pt" hint="Bills ÷ footfall across every store in view, this week." />
        <Kpi label="Focus-SKU units vs target" value={`${k.focusUnits}`} unit={k.focusTarget > 0 ? ` / ${k.focusTarget}` : ""} flat={focusPct != null ? `${focusPct}% · ${focusPct >= 100 ? "target met" : focusPct >= 80 ? "on pace" : "behind"}` : "no weekly target set"} hint="Units of focus SKUs sold this week against the stores' weekly targets." />
        <Kpi label="Stores flagged" value={String(k.flagged)} flat={`${rows.filter((r) => r.exception?.tone === "crit").length} critical`} tone={k.flagged > 0 ? "down" : undefined} hint="Stores carrying an exception this week: compliance below target, a stock-out, or low conversion." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        {/* Estate table — exceptions first. */}
        <div className="rlp-card rlp-card--flat overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <Th>Store</Th><Th>Distributor</Th><Th>Compliance</Th>
                  <Th right>Footfall</Th><Th right>Conv</Th><Th>Focus SKU vs target</Th><Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--faint)]">No stores match these filters.</td></tr>
                )}
                {rows.map((r) => {
                  const sel = r.nodeId === selectedId;
                  const pct = r.focusTarget && r.focusTarget > 0 ? Math.min(100, Math.round((r.focusUnits / r.focusTarget) * 100)) : null;
                  return (
                    <tr key={r.nodeId} className={sel ? "bg-[var(--accent-light)]" : "hover:bg-[var(--surface-raised)]"}>
                      <Td>
                        <Link href={href({ store: String(r.nodeId) })} className={`font-semibold ${sel ? "text-[var(--accent-dark)]" : "text-[var(--text)]"} hover:underline`}>
                          {r.name}
                        </Link>
                        <span className="block text-[10.5px] font-semibold text-[var(--faint)]">{r.zone}</span>
                      </Td>
                      <Td className="text-[var(--muted)]">{r.distributorName ?? "—"}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 font-bold tabular-nums" style={{ color: scoreTone(r.compliance, k.target) }}>
                          {r.compliance ?? "—"}
                          <span className="w-11 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                            <span className="block h-full rounded-full" style={{ width: `${r.compliance ?? 0}%`, background: scoreTone(r.compliance, k.target) }} />
                          </span>
                          {r.complianceDelta == null && r.compliance != null && (
                            // Scored, but not from the week on screen — the
                            // backend now says which week it came from, so an
                            // older audit reads as older rather than current.
                            <span className="text-[10px] text-[var(--faint)]" title="No audit in the viewed week — showing the most recent earlier one">stale</span>
                          )}
                          {r.complianceDelta != null && r.complianceDelta !== 0 && (
                            <span className={`text-[11px] ${r.complianceDelta > 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                              {r.complianceDelta > 0 ? "▲" : "▼"}{Math.abs(r.complianceDelta)}
                            </span>
                          )}
                        </span>
                      </Td>
                      <Td right className="tabular-nums text-[var(--muted)]">{r.footfall.toLocaleString("en-IN")}</Td>
                      <Td right className="tabular-nums text-[var(--muted)]">{r.conversion}%</Td>
                      <Td>
                        {pct == null ? <span className="text-[var(--faint)]">—</span> : (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-16 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                              <span className="block h-full rounded-full" style={{ width: `${Math.max(3, pct)}%`, background: pct < 50 ? "var(--error)" : pct < 80 ? "var(--warning)" : "var(--accent)" }} />
                            </span>
                            <span className="text-[11.5px] font-semibold text-[var(--muted)] tabular-nums">{r.focusUnits}/{r.focusTarget}</span>
                          </span>
                        )}
                      </Td>
                      <Td>{r.exception && <Pill tone={r.exception.tone}>{r.exception.text}</Pill>}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[var(--faint)] px-3.5 py-2.5 border-t border-[var(--border)]">
            Showing {rows.length} of {data.stores} stores · conversion = bills ÷ footfall, weekly ·{" "}
            <b className="text-[var(--muted)]">no customer PII or store margins at this tier</b>
          </p>
        </div>

        {/* Drill-down — beside the table, never over it. */}
        {detail ? <Drawer d={detail} /> : (
          <div className="rlp-card p-5 text-center text-[13px] text-[var(--faint)]">
            Pick a store to see its evidence.
          </div>
        )}
      </div>
    </div>
  );
}

function Drawer({ d }: { d: Detail }) {
  const { store, compliance: c, findings } = d;
  const flagged = c.current != null && c.current < c.target;
  return (
    <aside className="rlp-card p-4 space-y-4">
      <div>
        <p className="text-[15px] font-bold text-[var(--text)] flex items-center gap-2">
          {store.name}
          {flagged && <Pill tone="crit">Flagged</Pill>}
        </p>
        <p className="text-[11.5px] text-[var(--muted)]">
          {[store.zone, store.distributorName, store.partnerName].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div>
        <H5>Compliance · 6 weeks</H5>
        <Spark weeks={c.weeks} target={c.target} />
      </div>

      <div>
        <H5>Open findings{findings.length ? ` · ${findings.length}` : ""}</H5>
        {findings.length === 0 ? (
          <p className="text-[12px] text-[var(--success)] py-1">Nothing open — last audit came back clean.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {findings.map((f) => (
              <div key={f.id} className="flex gap-2.5 py-2 first:pt-0">
                {/* Evidence attached: the audit photo when the agent shot one. */}
                {f.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] flex items-center justify-center shrink-0 text-[var(--faint)]"><Camera size={14} /></span>
                )}
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[var(--text)] flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: f.kind === "planogram" || f.kind === "stock_out" ? "var(--error)" : "var(--warning)" }} />
                    {f.title}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] ml-3.5">
                    {f.detail ?? f.kind.replace("_", " ")}{f.createdAt ? ` · ${fmtDate(f.createdAt)}` : ""} · {f.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[11.5px] text-[var(--muted)]">
        <b className="text-[var(--text)]">Partner:</b> {store.partnerName ?? "—"}<br />
        <b className="text-[var(--text)]">Distributor:</b> {store.distributorName ?? "—"}
      </div>

      {/* The three asks. Each lands on the store's fix-list as a finding. */}
      <ActionForm action={pushAction.bind(null, store.nodeId, store.name)} success="Action pushed" className="space-y-2">
        <SubmitButton name="kind" value="fixlist" className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-bold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">
          <Send size={14} /> Send fix-list to partner
        </SubmitButton>
        <SubmitButton name="kind" value="visit" className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border border-[var(--border-strong)] text-[var(--text)] rounded-lg hover:bg-[var(--surface-raised)]">
          <CalendarClock size={14} /> Schedule field visit
        </SubmitButton>
        <SubmitButton name="kind" value="escalate" className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border border-[var(--border-strong)] text-[var(--text)] rounded-lg hover:bg-[var(--surface-raised)]">
          <AlertTriangle size={14} /> Escalate to {store.distributorName ?? "distributor"}
        </SubmitButton>
      </ActionForm>
    </aside>
  );
}

// Six weekly scores as a polyline. Gaps (no audit that week) break the line
// rather than reading as a zero.
function Spark({ weeks, target }: { weeks: { label: string; score: number | null }[]; target: number }) {
  const W = 210, H = 54, PAD = 6;
  const step = weeks.length > 1 ? (W - PAD * 2) / (weeks.length - 1) : 0;
  const y = (s: number) => H - PAD - ((H - PAD * 2) * s) / 100;
  const pts = weeks.map((w, i) => (w.score == null ? null : { x: PAD + i * step, y: y(w.score), score: w.score, label: w.label }));
  const drawn = pts.filter((p): p is { x: number; y: number; score: number; label: string } => p != null);
  const last = drawn[drawn.length - 1];
  const stroke = last ? scoreTone(last.score, target) : "var(--faint)";
  // The backend deliberately returns a null for a week with no audit. "Now"
  // used to print the most recent SCORED week regardless of age, so a store
  // last audited five weeks ago read as if that were today's score. Say which
  // week the number is from whenever it isn't the current one.
  const currentWeek = weeks[weeks.length - 1];
  const stale = last != null && currentWeek.score == null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
        aria-label={`Compliance over ${weeks.length} weeks, latest ${last?.score ?? "no"} score`}>
        <line x1={PAD} x2={W - PAD} y1={y(target)} y2={y(target)} stroke="var(--border-strong, var(--border))" strokeDasharray="3 3" strokeWidth="1" />
        {drawn.length > 1 && <polyline fill="none" stroke={stroke} strokeWidth="2" points={drawn.map((p) => `${p.x},${p.y}`).join(" ")} />}
        {last && <circle cx={last.x} cy={last.y} r="3.5" fill={stroke} stroke="var(--surface)" strokeWidth="1.5" />}
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--faint)] tabular-nums">
        {weeks.map((w, i) => <span key={i}>{w.label}</span>)}
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-1">
        {stale ? <>{last!.label} <b className="tabular-nums" style={{ color: stroke }}>{last!.score}</b></> : <>Now <b className="tabular-nums" style={{ color: stroke }}>{last?.score ?? "—"}</b></>} · target {target}
        {drawn.length > 1 && (() => {
          const d = last!.score - drawn[drawn.length - 2].score;
          return d === 0 ? null : <span className={d > 0 ? "text-[var(--success)]" : "text-[var(--error)]"}> · {d > 0 ? "▲" : "▼"}{Math.abs(d)} vs prev</span>;
        })()}
        {stale && <span className="text-[var(--warning)]"> · no audit in {currentWeek.label}</span>}
        {drawn.length === 0 && <span className="text-[var(--faint)]"> · no audits in this window</span>}
      </p>
    </div>
  );
}

function Filter({ name, label, value, options, className }: { name: string; label: string; value?: string; options: string[]; className: string }) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-[11px] text-[var(--faint)]">{label}</span>
      <select name={name} defaultValue={value ?? ""} className={className}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// Plain submit — the filter form is a GET, not a server action.
function SubmitLikeButton() {
  return <button type="submit" className="px-3 py-1.5 text-[12.5px] font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Apply</button>;
}

function Kpi({ label, value, unit = "", delta, deltaSuffix = "", flat, tone, hint }: {
  label: string; value: string; unit?: string; delta?: number | null; deltaSuffix?: string; flat?: string; tone?: "down"; hint?: string;
}) {
  const dir = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const Icon = dir === "up" ? ArrowUp : ArrowDown;
  return (
    <div className="rlp-card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[22px] font-bold text-[var(--text)] tabular-nums leading-none">
          {value}{unit && <span className="text-[13px] font-semibold text-[var(--faint)]">{unit}</span>}
        </p>
        {hint && <InfoHint text={hint} />}
      </div>
      <p className="text-[11.5px] text-[var(--muted)] mt-1.5">{label}</p>
      {dir && dir !== "flat" ? (
        <p className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${dir === "up" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
          <Icon size={11} />{delta! > 0 ? "+" : ""}{delta}{deltaSuffix}
        </p>
      ) : flat ? (
        <p className={`text-[11px] font-semibold mt-1 ${tone === "down" ? "text-[var(--error)]" : "text-[var(--faint)]"}`}>{flat}</p>
      ) : null}
    </div>
  );
}

const PILL: Record<string, string> = {
  crit: "bg-[var(--error-bg,var(--surface-raised))] text-[var(--error)]",
  warn: "bg-[var(--warning-bg)] text-[var(--warning)]",
  info: "bg-[var(--accent-light)] text-[var(--accent-dark)]",
};
function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${PILL[tone] ?? PILL.warn}`}>{children}</span>;
}
function H5({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-[var(--faint)] mb-2 flex items-center gap-1.5"><ClipboardCheck size={11} />{children}</p>;
}
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10px] font-bold text-[var(--faint)] uppercase tracking-[0.09em] ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${right ? "text-right" : ""} ${className}`}>{children}</td>;
}
