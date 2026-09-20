// Impact — dark stat section, copy verbatim from the pitch
// (docs/retailcrm/grocery-pitch.html). Cards reveal via the card batch;
// the big numbers count up once when scrolled into view (CountUp onView).
// "+2–4 pts" is a range, not a number — it stays static by design.

import { CountUp } from "./CountUp";
import { WRAP, DARK, SECTION, ILLUS, LIFT_DARK, SecHead } from "./ui";

const STATS: {
  value: React.ReactNode;
  unit: string;
  k: string;
  how: string;
}[] = [
  {
    value: <CountUp to={100} onView />,
    unit: "%",
    k: "of Delhi Supermarket Outlet stores visible weekly on planogram compliance",
    how: "Today: sampled manual visits, weeks apart. With RetailIQ: every store, every week, photo-evidenced.",
  },
  {
    value: "+2–4",
    unit: " pts",
    k: "walk-in conversion headroom once demo-stage drop-off is measured per agent",
    how: "You can't coach what you can't see. Funnel telemetry finds the leak store-by-store.",
  },
  {
    value: <>−<CountUp to={30} onView /></>,
    unit: "%",
    k: "focus-SKU stockout days via distributor replenishment alerts",
    how: "Stockouts surface to the distributor the day they trend, not at month-end reconciliation.",
  },
  {
    value: <CountUp to={1} onView />,
    unit: " week",
    k: "from incentive-scheme launch to first per-agent scoreboard",
    how: "Gold Circle and partner-tier programs read directly off tracked productivity, not self-reported sheets.",
  },
];

export function Impact() {
  return (
    <section className={`${DARK} ${SECTION}`}>
      <div className={WRAP}>
        <SecHead dark eyebrow="The impact" title="What changes for Grocery when the network reports itself." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          {STATS.map((s) => (
            <div
              className={`bg-[var(--ground-2)] border border-[var(--line-dark)] rounded-[10px] px-[22px] py-6 ${LIFT_DARK}`}
              key={s.k}
              data-reveal="card"
            >
              <div className="num text-[2.3rem] font-extrabold text-white tracking-[-.03em]">
                {s.value}
                <span className="text-[1.2rem] text-[var(--red)]">{s.unit}</span>
              </div>
              <div className="text-[.86rem] text-[var(--paper-ink-2)] mt-1.5">{s.k}</div>
              <div className="text-[.76rem] text-[var(--paper-ink-2)] opacity-75 mt-3 pt-3 border-t border-[var(--line-dark)]">
                {s.how}
              </div>
            </div>
          ))}
        </div>
        <p className={ILLUS}>
          Impact figures are pilot targets modelled from the research pass, not measured results —
          the Delhi pilot exists to prove them.
        </p>
      </div>
    </section>
  );
}
