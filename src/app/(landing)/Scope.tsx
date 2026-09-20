"use client";

// Scope — six pillars as a scroll story (the folk.app / Attio pattern):
// left rail of pillars, sticky right panel crossfading a mini UI vignette
// per pillar. Driven by IntersectionObserver (no GSAP pinning — position:
// sticky + a class swap is cheaper and can't produce pin-spacer jank).
// Copy verbatim from the pitch; vignettes reuse the mock UI classes
// (.row/.pill/.minibar stay in landing.css — shared with the Demo frame).
// Mobile (<768px): single column, vignette renders inline under each pillar.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { WRAP, LIGHT, SECTION, SecHead } from "./ui";

type Who = { label: string; hot?: boolean };

function R({ l, s, t, v }: { l: string; s?: string; t: string; v: string }) {
  return (
    <div className="row">
      <span className="grow">
        {l}
        {s && <> <span className="sub">{s}</span></>}
      </span>
      <span className={`pill ${t} num`}>{v}</span>
    </div>
  );
}

function Vig({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-[10px] px-[22px] py-5 shadow-[0_20px_60px_-24px_rgba(28,29,33,.18)]">
      <h4 className="text-[.72rem] tracking-[.09em] uppercase text-[var(--ink-2)] mb-2.5">{title}</h4>
      {children}
    </div>
  );
}

const FUNNEL_MINI: [string, string, number, string][] = [
  ["Footfall", "1,400", 100, "#C2170F"],
  ["Engaged", "980", 70, "#D4564F"],
  ["Demo", "460", 33, "#E28F8A"],
  ["Sale", "210", 15, "#EFC1BE"],
];

const PILLARS: { title: string; body: string; who: Who[]; vignette: ReactNode }[] = [
  {
    title: "Product placement & planogram compliance",
    body: "Photo-audit with checklist scoring: is the hero SKU on the right shelf and endcap, this week, in every store? Scored, trended, comparable.",
    who: [{ label: "Grocery", hot: true }, { label: "Partner" }],
    vignette: (
      <Vig title="Photo audit · Nehru Place · Diwali endcap">
        <div className="rows">
          <R l="Premium Rice — endcap" s="photo attached" t="good" v="✓ OK" />
          <R l="Fresh Dairy — shelf 2" s="wrong facing" t="crit" v="✗ Fix" />
          <R l="Organic Honey — shelf 1" s="photo attached" t="good" v="✓ OK" />
          <div className="row">
            <span className="grow sub">Store score this week</span>
            <span className="minibar"><i style={{ width: "87%" }} /></span>
            <span className="num text-[.78rem] font-bold">87</span>
          </div>
        </div>
      </Vig>
    ),
  },
  {
    title: "Store mapping & territory",
    body: "Geo-map of every Supermarket Outlet / Express Store outlet, its catchment, and which distributor and partner own it — the estate on one canvas.",
    who: [{ label: "Grocery", hot: true }, { label: "Distributor", hot: true }],
    vignette: (
      <Vig title="Delhi estate · 42 stores by zone">
        <div className="rows">
          <R l="Nehru Place" s="Supermarket Outlet · Distributor A" t="good" v="96 · 21.1%" />
          <R l="Lajpat Nagar" s="Express Store · Distributor B" t="good" v="88 · 16.3%" />
          <R l="Rajouri Garden" s="Supermarket Outlet · Distributor B" t="warn" v="84 · 14.9%" />
          <R l="Rohini" s="Supermarket Outlet · Distributor B" t="crit" v="71 · 10.1%" />
        </div>
      </Vig>
    ),
  },
  {
    title: "Inventory & sell-through visibility",
    body: "Stock-on-hand and sell-through rolled up store → distributor → brand. Flags dead stock and focus-SKU stockouts before they cost a weekend.",
    who: [{ label: "Distributor", hot: true }, { label: "Grocery" }, { label: "Owner" }],
    vignette: (
      <Vig title="Replenishment queue · Distributor A">
        <div className="rows">
          <R l="Premium Rice · Nehru Place" s="2 days cover left" t="crit" v="Ship today" />
          <R l="Fresh Dairy · Karol Bagh" s="5 days cover" t="warn" v="Plan" />
          <R l="Wheat Flour 5kg · Lajpat Nagar" s="Healthy · 12 days" t="good" v="OK" />
          <R l="Dark Chocolate · Rohini" s="Overstock · 34 days" t="info" v="Rebalance" />
        </div>
      </Vig>
    ),
  },
  {
    title: "Per-agent productivity",
    body: "Walk-ins handled, demos given, conversion rate and average ticket — per floor agent, per shift. Feeds partner-tier incentive programs.",
    who: [{ label: "Owner", hot: true }, { label: "Partner" }, { label: "Grocery" }],
    vignette: (
      <Vig title="Agent leaderboard · this week">
        <div className="rows">
          {([["Ravi K.", "Nehru Place", 84, "21.1%"], ["Sana M.", "Karol Bagh", 75, "18.8%"], ["Amit S.", "Lajpat Nagar", 65, "16.3%"], ["Pooja T.", "Dwarka", 54, "13.5%"]] as const).map(
            ([name, store, w, conv]) => (
              <div className="row" key={name}>
                <span className="grow">{name} <span className="sub">{store}</span></span>
                <span className="minibar"><i style={{ width: `${w}%` }} /></span>
                <span className="num text-[.78rem] font-bold">{conv}</span>
              </div>
            ),
          )}
        </div>
      </Vig>
    ),
  },
  {
    title: "Footfall & conversion analytics",
    body: "Footfall → engaged → demo → sale, per store per day. Conversion rate becomes the network's shared headline metric.",
    who: [{ label: "Everyone", hot: true }],
    vignette: (
      <Vig title="Walk-in funnel · average store, weekly">
        <div className="py-1">
          {FUNNEL_MINI.map(([label, value, w, color]) => (
            <div className="flex items-center gap-2.5 my-2.5" key={label}>
              <span className="flex-none w-16 text-[.75rem] text-[var(--ink-2)] text-right">{label}</span>
              <div className="h-5 rounded" style={{ width: `${w}%`, background: color }} />
              <span className="num text-[.75rem] font-bold">{value}</span>
            </div>
          ))}
        </div>
      </Vig>
    ),
  },
  {
    title: "Clienteling & lead-to-sale",
    body: "Capture the walk-in and close with discounts, loyalty points & basket insights. This is our existing CRM core, re-skinned for retail.",
    who: [{ label: "Owner", hot: true }, { label: "Agent" }],
    vignette: (
      <Vig title="Leads to work · Karol Bagh, today">
        <div className="rows">
          <R l="Rohit Sharma" s="Premium Rice · Discount coupon applied" t="warn" v="Call 4 PM" />
          <R l="Anita V." s="Fresh Dairy · Loyalty redemption" t="good" v="In store" />
          <R l="Corporate: Dua & Co" s="5× Cooking Oil 1L enquiry" t="info" v="Quote" />
          <R l="Walk-in 14:20" s="captured · no demo yet" t="crit" v="Assign" />
        </div>
      </Vig>
    ),
  },
];

export function Scope() {
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Whichever pillar crosses the viewport's middle band becomes active.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    itemsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className={`${LIGHT} ${SECTION}`}>
      <div className={WRAP}>
        <SecHead eyebrow="The scope" title="Six pillars, each mapped to the stakeholder who feels the pain." />

        <div className="grid gap-12 items-start md:grid-cols-2">
          <div>
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                data-i={i}
                ref={(el) => { itemsRef.current[i] = el; }}
                className={`py-[30px] border-t border-[var(--line)] first:border-t-0 first:pt-1.5 transition-opacity duration-300 max-md:opacity-100 ${i === active ? "opacity-100" : "opacity-40"}`}
              >
                <h3 className="text-[1.15rem] font-bold mb-2">{p.title}</h3>
                <p className="text-[.92rem] text-[var(--ink-2)]">{p.body}</p>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {p.who.map((w) => (
                    <span
                      key={w.label}
                      className={`text-[.68rem] font-bold tracking-[.05em] px-[9px] py-[3px] rounded-full ${w.hot ? "bg-[rgba(194,23,15,.09)] text-[var(--red-deep)]" : "bg-[#EFEDE9] text-[var(--ink-2)]"}`}
                    >
                      {w.label}
                    </span>
                  ))}
                </div>
                <div className="hidden max-md:block max-md:mt-4">{p.vignette}</div>
              </div>
            ))}
          </div>
          <div className="sticky top-24 min-h-[420px] max-md:hidden" aria-hidden="true">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className={`absolute top-0 inset-x-0 pointer-events-none transition-opacity duration-[350ms] ${i === active ? "opacity-100" : "opacity-0"}`}
              >
                {p.vignette}
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-7 px-[22px] py-[18px] border-l-[3px] border-[var(--red)] bg-[var(--card)] rounded-r-[10px] text-[.92rem] text-[var(--ink-2)] max-w-[72ch]"
          data-reveal="block"
        >
          <b className="text-[var(--ink)]">Build honesty:</b> the lead and contact engine
          already exists in our CRM today. The genuinely new build is the retail-execution layer
          (planogram, footfall, store-ops) and the four-tier channel RBAC — everything else is
          proven code re-targeted.
        </div>
      </div>
    </section>
  );
}
