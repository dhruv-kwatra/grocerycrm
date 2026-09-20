"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";

// Count-up via a motion value on rAF (~1.2s ease-out).
// - Hero usage: runs on mount (onView=false — hero animates on load).
// - Impact usage: onView=true, starts once when scrolled into view.
// Reduced motion renders the final number immediately.
export function CountUp({ to, onView = false }: { to: number; onView?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const mv = useMotionValue(reduced ? to : 0);
  const text = useTransform(mv, (v) => Math.round(v).toString());

  const run = !reduced && (!onView || inView);
  useEffect(() => {
    if (!run) return;
    const controls = animate(mv, to, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [run, mv, to]);

  return <motion.span ref={ref}>{text}</motion.span>;
}
