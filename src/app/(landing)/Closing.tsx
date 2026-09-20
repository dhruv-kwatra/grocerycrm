// Closing sections — access matrix (dark), rollout (light), footer —
// copy verbatim from the pitch (docs/retailcrm/grocery-pitch.html).
// All static server-rendered; reveals via RevealManager attributes.
// The access table and the rollout steps stay in landing.css (last-child
// td rules and the CSS counter ::before can't move to utilities).

import Link from "next/link";
import { WRAP, DARK, LIGHT, SECTION, TBL_SCROLL, BTN_RED, BTN_GHOST, SecHead } from "./ui";

const ACCESS = [
  {
    tier: "Grocery (Brand)",
    sees: "Whole estate, aggregated with drill-down: compliance, sell-through, footfall, conversion",
    does: "Sets focus SKUs, planograms, targets, incentive schemes; benchmarks stores",
    never: "Store cost margins · customer PII",
  },
  {
    tier: "Distributor",
    sees: "Only stores they supply: stock, sell-through, replenishment signals",
    does: "Manages allocation and secondary-sales targets for their stores",
    never: "Other distributors' stores · brand-wide margin data",
  },
  {
    tier: "Partner",
    sees: "Only their own outlets: agent productivity, footfall, inventory",
    does: "Manages staff, targets and local promotions across their outlets",
    never: "Other partners' stores · distributor pricing",
  },
  {
    tier: "Store Owner",
    sees: "Single store: own agents, own customers, own stock and footfall",
    does: "Runs the day — shifts, stock requests, walk-in capture",
    never: "Any other store · network-level analytics",
  },
];

const ROLLOUT = [
  {
    title: "Pilot cohort",
    body: "5–8 Delhi Supermarket Outlet stores across one distributor. Store mapping, footfall capture and the owner app go live in week one.",
  },
  {
    title: "Compliance loop",
    body: "Weekly photo-audits and the Grocery brand dashboard switch on. First network compliance report in week three.",
  },
  {
    title: "Full Delhi estate",
    body: "All Supermarket Outlet / Express Store outlets onboard; distributor replenishment alerts and partner incentive scoreboards activate.",
  },
  {
    title: "Replicate by circle",
    body: "The same tree, re-instanced: Mumbai, Bangalore — and the same architecture serves any OEM's exclusive network.",
  },
];

export function Closing() {
  return (
    <>
      {/* Access matrix */}
      <section className={`${DARK} ${SECTION}`}>
        <div className={WRAP}>
          <SecHead dark eyebrow="Varied access, by design" title="Four tiers, one permission tree. Detail never leaks sideways.">
            Modelled on Grocery&apos;s real channel — Supermarket Outlet and Express Store outlets, LPP partners, regional
            distributors, Gold Circle and T1/T2/T3 programs. Each tier sees its own subtree;
            aggregation rolls up, PII stays down.
          </SecHead>
          <div className={TBL_SCROLL} data-reveal="block">
            <table className="acc">
              <thead>
                <tr><th>Tier</th><th>Sees</th><th>Does</th><th>Never sees</th></tr>
              </thead>
              <tbody>
                {ACCESS.map((a) => (
                  <tr key={a.tier}>
                    <td>{a.tier}</td>
                    <td>{a.sees}</td>
                    <td>{a.does}</td>
                    <td className="no">{a.never}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rollout */}
      <section className={`${LIGHT} ${SECTION}`}>
        <div className={WRAP}>
          <SecHead eyebrow="Rollout" title="Delhi first. Then the template travels." />
          <div className="rollout grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
            {ROLLOUT.map((s) => (
              <div className="step" key={s.title} data-reveal="card">
                <h3 className="text-[.98rem] font-bold mt-2 mb-1.5">{s.title}</h3>
                <p className="text-[.86rem] text-[var(--ink-2)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--ground)] text-[var(--paper-ink-2)] py-14 text-[.85rem]">
        <div className={WRAP}>
          <p className="text-white text-[1.3rem] font-extrabold tracking-[-.02em] mb-2.5">
            Let&apos;s put the Delhi estate on one screen.
          </p>
          <p>RetailIQ · Elcom Digital — prepared for Grocery India, Delhi Circle review.</p>
          <div className="flex flex-wrap gap-2.5 mt-[22px]">
            <Link href="/retail/analytics" className={BTN_RED}>Enter RetailIQ</Link>
            <a href="#demo" className={BTN_GHOST}>See the demo</a>
          </div>
          <p className="mt-[26px] pt-5 border-t border-[var(--line-dark)] text-[.74rem] opacity-80 max-w-[78ch]">
            Market and competitor figures are indicative ranges from desk research (2025–26) and
            should be re-verified at contract stage. Product screens are interactive mockups; demo
            data is illustrative. Grocery, Supermarket Outlet, LPP and Gold Circle are Grocery program names
            referenced for channel-mapping accuracy.
          </p>
        </div>
      </footer>
    </>
  );
}
