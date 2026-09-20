// Integration marquee — its own slim full-bleed strip between Impact and the
// Demo, floating on a cream gap. The channel's real stack (docs 03/08);
// CSS-only loop (keyframes + seam math + mask stay in landing.css); the
// global reduced-motion rule freezes it to a static row.

import { WRAP } from "./ui";

const INTEGRATIONS = [
  "Tally", "Busy", "Odoo", "WhatsApp Business", "Google Maps",
  "Earn with Grocery", "POS billing", "EMI partners",
];

export function Integrations() {
  return (
    // Cream section with the dark strip floating inside — the paper gap above
    // detaches it from the dark Impact section; Demo's cream follows below.
    <section className="bg-[var(--paper)] pt-14">
      <div className="bg-[var(--ground-2)] border-y border-[var(--line-dark)] pt-9 pb-10">
        <div className={WRAP}>
          <p className="text-[.72rem] font-bold tracking-[.12em] uppercase text-[var(--paper-ink-2)] mb-[22px]">
            Plays well with the stack the channel already runs
          </p>
        </div>
        {/* full-bleed: the marquee sits outside .wrap on purpose */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
              <span className="int-item" key={i}>
                {name}
                <span className="int-dot" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
