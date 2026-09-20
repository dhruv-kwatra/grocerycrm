"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WRAP, BTN_RED } from "./ui";

// Slim wayfinding bar: slides in once the hero scrolls out of view, keeps the
// brand + app entry visible on a long page. Solid bg (no backdrop-filter —
// GPU-costly on mid-end devices); transform/opacity only.
export function StickyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".rlp header.hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 bg-[rgba(20,21,27,.96)] border-b border-[var(--line-dark)] transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-full"}`}
      aria-hidden={!show}
    >
      <div className={`${WRAP} flex items-center gap-3 py-2.5`}>
        <div
          className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-white font-black text-xs shrink-0"
          style={{ background: "#10B981", boxShadow: "0 0 10px rgba(16,185,129,0.4)" }}
        >
          L
        </div>
        <span className="text-[.95rem] font-extrabold tracking-[-0.5px] inline-flex items-center gap-1.5 leading-none">
          <span className="text-white">Grocery</span>
          <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
          <span style={{ color: "#10B981" }}>CRM</span>
        </span>
        <a
          href="#demo"
          className="ml-auto text-[.82rem] font-semibold text-[var(--paper-ink-2)] no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--red)] focus-visible:outline-offset-2"
        >
          Demo
        </a>
        <Link href="/retail/analytics" className={BTN_RED} tabIndex={show ? 0 : -1}>
          Enter RetailIQ
        </Link>
      </div>
    </div>
  );
}
