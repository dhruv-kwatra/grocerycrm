"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Subtle card entrance for the analytics dashboard: fade + rise as the card
// scrolls into view (once), with an optional gentle hover-lift. The page is a
// server component; this is the only client bit, kept tiny. Reduced motion
// renders the final state and disables the hover.
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function MotionCard({ className, children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.4, ease: EASE }}
      whileHover={hover && !reduced ? { y: -3, transition: { duration: 0.18, ease: "easeOut" } } : undefined}
    >
      {children}
    </motion.div>
  );
}
