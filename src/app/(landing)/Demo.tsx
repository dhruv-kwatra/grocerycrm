"use client";

// Product demo — role tabs × device tabs over a mock dashboard, replicated
// exactly from the pitch (docs/retailcrm/grocery-pitch.html). Data + screen
// live in mock.tsx (shared with the hero product shot). Device switch is a
// plain CSS max-width transition (0.35s ease — cheap on any device, no GSAP).
// The device frame + screen internals stay in landing.css: their styles are
// driven by frame context (.device.tablet/.mobile descendants), which
// per-element Tailwind can't express.

import { useEffect, useState } from "react";
import { ROLES, MockScreen } from "./mock";
import { WRAP, LIGHT, SECTION, SecHead } from "./ui";

const DEVICES = ["desktop", "tablet", "mobile"] as const;
type Device = (typeof DEVICES)[number];

const TAB =
  "text-[.84rem] font-semibold px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-2)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--red-deep)] focus-visible:outline-offset-2";
const ROLE_TAB = `${TAB} aria-selected:bg-[var(--ink)] aria-selected:border-[var(--ink)] aria-selected:text-white`;
const VP_TAB = `${TAB} aria-selected:bg-[rgba(194,23,15,.08)] aria-selected:border-[var(--red-deep)] aria-selected:text-[var(--red-deep)]`;

export function Demo() {
  const [roleKey, setRoleKey] = useState("fmcgBrand");
  const [device, setDevice] = useState<Device>("desktop");
  const r = ROLES[roleKey].data;

  // A "desktop" mock squeezed into a phone viewport is the worst first
  // impression — default narrow screens to the Mobile device once, on mount.
  useEffect(() => {
    if (window.matchMedia("(max-width: 640px)").matches) setDevice("mobile");
  }, []);

  return (
    <section className={`${LIGHT} ${SECTION}`} id="demo">
      <div className={WRAP}>
        <SecHead eyebrow="Product demo" title="One platform, four vantage points.">
          Same data tree, scoped by role. Switch the role to see what each tier sees — and switch
          the device, because partners live on tablets and floor agents live on phones.
        </SecHead>

        <div className="flex flex-wrap gap-[18px] justify-between items-center mb-[22px]">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Role">
            {Object.entries(ROLES).map(([key, { tab }]) => (
              <button
                key={key}
                role="tab"
                className={ROLE_TAB}
                aria-selected={roleKey === key}
                onClick={() => setRoleKey(key)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Device">
            {DEVICES.map((d) => (
              <button key={d} role="tab" className={VP_TAB} aria-selected={device === d} onClick={() => setDevice(d)}>
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={device === "desktop" ? "device" : `device ${device}`} data-reveal="block">
          <div className="device-chrome">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span className="url">{r.url}</span>
          </div>
          <MockScreen role={r} />
        </div>
        <p className="text-[.78rem] text-[var(--ink-3)] mt-3.5 text-center">
          All demo data is illustrative. Store names are real Delhi retail zones; numbers are
          representative, not reported.
        </p>
      </div>
    </section>
  );
}
