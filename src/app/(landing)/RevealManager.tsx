"use client";

import { useEffect } from "react";

// One client manager animates every [data-reveal] element on the page —
// sections stay server components. GSAP + ScrollTrigger are dynamic-imported
// so the bundle cost lands on this route only, after hydration.
//
// data-reveal values:
//   "head"  — section headers: fade + y as one block
//   "block" — tables/large blocks: fade as a whole (row-by-row looks busy)
//   "card"  — grid cards: batched staggered reveal
//
// Notes:
// - Reduced motion: bail before hiding anything — SSR content stays visible.
// - Initial hidden state is set in JS, not CSS, so no-JS/reduced-motion users
//   always see content. In-viewport elements could flash for a frame before
//   GSAP loads; all reveal targets sit below the fold so it doesn't show.
// - will-change only during the tween (clearProps removes it on complete).
// - Resize refresh: ScrollTrigger already listens and refreshes natively —
//   no custom debounce needed.
export function RevealManager() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const HIDDEN = { opacity: 0, y: 20, willChange: "transform,opacity" };
        const SHOWN = {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          overwrite: true as const,
          clearProps: "opacity,transform,willChange",
        };

        gsap.set("[data-reveal]", HIDDEN);

        // Headers + whole blocks: one element per reveal.
        ScrollTrigger.batch("[data-reveal='head'], [data-reveal='block']", {
          start: "top 80%",
          once: true,
          onEnter: (batch) => gsap.to(batch, SHOWN),
        });

        // Card grids: batched so siblings entering together stagger as a group
        // (one paint wave instead of a ScrollTrigger tween per card).
        ScrollTrigger.batch("[data-reveal='card']", {
          start: "top 85%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { ...SHOWN, stagger: 0.08 }),
        });
      });
    })();

    return () => {
      cancelled = true;
      ctx?.revert(); // kills the triggers + restores inline styles
    };
  }, []);

  return null;
}
