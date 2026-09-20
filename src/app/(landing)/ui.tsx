// Shared Tailwind class strings + the section-header component for the
// landing page. What Tailwind can't express cleanly (keyframes, pseudo
// elements, the chart draw-in state machine, device-context overrides,
// table last-child rules) stays in landing.css.

import type { ReactNode } from "react";

export const WRAP = "max-w-[1080px] mx-auto px-7";
export const SECTION = "py-[72px] max-md:py-14";
export const SECTION_TIGHT = "pt-0 pb-[72px] max-md:pb-14"; // sections the pitch starts flush
export const DARK = "bg-[var(--ground)] text-[var(--paper-ink)]";
export const LIGHT = "bg-[var(--paper)] text-[var(--ink)]";

export const ILLUS = "text-[.74rem] text-[var(--paper-ink-2)] opacity-70 mt-5";
export const NOTE = "text-[.76rem] text-[var(--ink-2)] mt-2.5";
export const TBL_SCROLL = "overflow-x-auto border border-[var(--line-dark)] rounded-[10px]";

export const BTN_RED =
  "inline-block bg-[var(--red-deep)] text-white rounded-full px-[18px] py-2 text-[.84rem] font-semibold no-underline whitespace-nowrap transition-colors hover:bg-[var(--red)] focus-visible:outline-2 focus-visible:outline-[var(--red)] focus-visible:outline-offset-2";
export const BTN_GHOST =
  "inline-block border border-[var(--line-dark)] text-[var(--paper-ink)] rounded-full px-[18px] py-2 text-[.84rem] font-semibold no-underline whitespace-nowrap transition-colors hover:border-[var(--paper-ink-2)] focus-visible:outline-2 focus-visible:outline-[var(--red)] focus-visible:outline-offset-2";

// Card hover-lift: the transform transition lives ONLY in the hover state so
// the base state never fights GSAP's reveal tween (hover-out snaps, invisible
// at 3px). Tailwind v4's hover: is already gated on hover-capable devices.
export const LIFT_DARK =
  "transition-[border-color] duration-[250ms] hover:-translate-y-[3px] hover:border-[rgba(22,163,74,.45)] hover:transition-[transform,border-color] hover:duration-[250ms]";
export const LIFT_LIGHT =
  "transition-[border-color] duration-[250ms] hover:-translate-y-[3px] hover:border-[rgba(194,23,15,.35)] hover:transition-[transform,border-color] hover:duration-[250ms]";

export function SecHead({
  dark,
  eyebrow,
  title,
  children,
  extra,
}: {
  dark?: boolean;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="max-w-[62ch] mb-10" data-reveal="head">
      <p className={`text-[.72rem] font-bold tracking-[.14em] uppercase ${dark ? "text-[var(--red)]" : "text-[var(--red-deep)]"}`}>
        {eyebrow}
      </p>
      <h2 className={`text-[clamp(1.5rem,2.8vw,2.1rem)] font-extrabold tracking-[-.02em] leading-[1.15] [text-wrap:balance] mt-2.5 ${dark ? "text-white" : ""}`}>
        {title}
      </h2>
      {children && (
        <p className={`mt-3 ${dark ? "text-[var(--paper-ink-2)]" : "text-[var(--ink-2)]"}`}>{children}</p>
      )}
      {extra}
    </div>
  );
}
