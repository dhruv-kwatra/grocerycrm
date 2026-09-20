// Research / competition — dark section, copy verbatim from the pitch
// (docs/retailcrm/grocery-pitch.html). Server component; reveals are driven
// by RevealManager via data-reveal attributes. Layout/typography in Tailwind;
// the competitor table stays in landing.css (th/td repetition + last-child
// rules read better as CSS).

import { WRAP, DARK, SECTION_TIGHT, TBL_SCROLL, ILLUS, LIFT_DARK, SecHead } from "./ui";

const CORNERS = [
  {
    tag: "Corner one",
    title: "Horizontal CRMs",
    body: "Zoho, Salesforce — strong on pipeline, blind on the retail floor. No planogram, no footfall, no channel hierarchy.",
  },
  {
    tag: "Corner two",
    title: "Retail POS / ERP",
    body: "GoFrugal, Ginesys, Lightspeed — strong on billing and stock inside one store, blind upward. The brand sees nothing.",
  },
  {
    tag: "Corner three",
    title: "FMCG-style DMS",
    body: "Bizom, FieldAssist — model the distributor tree, but built for secondary sales of soap, not data-driven grocery retail.",
  },
];

const CHIP_BASE = "inline-block text-[.7rem] font-bold px-[9px] py-0.5 rounded-full whitespace-nowrap";
const CHIP: Record<"red" | "dim", string> = {
  red: "bg-[rgba(22,163,74,.15)] text-[#6EE7B7]",
  dim: "bg-[rgba(255,255,255,.06)] text-[var(--paper-ink-2)]",
};
type Chip = { label: string; cls: "red" | "dim" };

const COMPETITORS: { player: string; rbac: Chip; execution: Chip; positioning: string; misses: string; us?: boolean }[] = [
  {
    player: "Zoho CRM / One",
    rbac: { label: "No", cls: "dim" },
    execution: { label: "No", cls: "dim" },
    positioning: "Horizontal SMB · ~₹800–2,500 / user / mo",
    misses: "Not brand-hierarchy aware; per-user pricing punishes floor staff",
  },
  {
    player: "Salesforce Retail Cloud",
    rbac: { label: "Partial", cls: "dim" },
    execution: { label: "Partial", cls: "dim" },
    positioning: "Enterprise clienteling · multiples higher",
    misses: "Overkill cost and rollout time for single-city SMB stores",
  },
  {
    player: "Capillary",
    rbac: { label: "No", cls: "dim" },
    execution: { label: "Loyalty only", cls: "dim" },
    positioning: "Consumer engagement led",
    misses: "Loyalty-first, not store-ops or channel visibility",
  },
  {
    player: "GoFrugal / Ginesys",
    rbac: { label: "No", cls: "dim" },
    execution: { label: "Billing / stock", cls: "dim" },
    positioning: "Retail ERP · ~₹1,000–3,000 / store / mo",
    misses: "Store-centric; weak brand→distributor roll-up and agent productivity",
  },
  {
    player: "DMS tools (Bizom etc.)",
    rbac: { label: "Yes", cls: "red" },
    execution: { label: "No", cls: "dim" },
    positioning: "FMCG secondary sales",
    misses: "No planogram, footfall or demo-conversion model",
  },
  {
    player: "RetailIQ",
    rbac: { label: "Yes — 4 tiers", cls: "red" },
    execution: { label: "Yes — shelf to sale", cls: "red" },
    positioning: "Per-store, brand-subsidised",
    misses: "Built for exactly this intersection",
    us: true,
  },
];

export function Research() {
  return (
    <section className={`${DARK} ${SECTION_TIGHT}`}>
      <div className={WRAP}>
        <SecHead dark eyebrow="The research" title="The gap sits between three markets — and nobody owns it.">
          India&apos;s retail-tech stack is growing at a mid-teens-to-20% CAGR through 2030, driven
          by GST formalisation and omnichannel pressure on brand-exclusive stores. Yet every
          incumbent covers only one corner of what an exclusive-store network actually needs.
        </SecHead>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 mb-9">
          {CORNERS.map((c) => (
            <div
              className={`bg-[var(--ground-2)] border border-[var(--line-dark)] rounded-[10px] p-[22px] ${LIFT_DARK}`}
              key={c.tag}
              data-reveal="card"
            >
              <span className="inline-block text-[.68rem] font-bold tracking-[.1em] uppercase text-[var(--red)] mb-3">
                {c.tag}
              </span>
              <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
              <p className="text-[.88rem] text-[var(--paper-ink-2)]">{c.body}</p>
            </div>
          ))}
        </div>

        <div className={TBL_SCROLL} data-reveal="block">
          <table className="comp">
            <thead>
              <tr>
                <th>Player</th>
                <th>Channel-tree RBAC</th>
                <th>In-store execution</th>
                <th>Positioning &amp; typical price</th>
                <th>Why it misses Supermarket Outlet</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.player} className={c.us ? "us" : undefined}>
                  <td>{c.player}</td>
                  <td><span className={`${CHIP_BASE} ${CHIP[c.rbac.cls]}`}>{c.rbac.label}</span></td>
                  <td><span className={`${CHIP_BASE} ${CHIP[c.execution.cls]}`}>{c.execution.label}</span></td>
                  <td className={c.us ? undefined : "gap"}>{c.positioning}</td>
                  <td className={c.us ? undefined : "gap"}>{c.misses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={ILLUS}>
          Competitor pricing shown as indicative public-list ranges gathered during research; confirm
          current quotes before contract-stage comparisons.
        </p>
      </div>
    </section>
  );
}
