"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// A tab either flips local state (the landing filters) or navigates (the retail
// nav). Give it an href and it renders a real anchor, so the retail nav stays
// middle-clickable and keyboard-navigable instead of becoming a button that
// happens to route.
export type PillTab = { id: string; label: string; icon?: LucideIcon; badge?: string | number; href?: string };

// The prototype's segmented control: a blurred glass track with a red gradient
// lozenge that springs between tabs on a shared layoutId. Used by the landing
// hero and the feature grid.
//
// The lozenge is a -z-10 child of an `isolate` button rather than an absolutely
// positioned element with a negative z-index, so it can't escape the stacking
// context and paint over whatever sits below the track.
export function PillTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = "pillTabActive",
  className = "",
  ariaLabel,
  // The landing shows four wide marketing tabs; the retail header can carry ten
  // nav rows and needs them tighter to fit.
  dense = false,
  lightTrack = false,
}: {
  tabs: PillTab[];
  activeTab: string;
  onChange?: (id: string) => void;
  layoutId?: string;
  className?: string;
  ariaLabel?: string;
  dense?: boolean;
  lightTrack?: boolean;
}) {
  const MotionLink = motion.create(Link);
  return (
    <div
      // Link tabs are navigation, not a tablist — announcing them as tabs
      // promises a panel swap that never happens.
      role={tabs.some((t) => t.href) ? "navigation" : "tablist"}
      aria-label={ariaLabel}
      className={`pill-tabs-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        maxWidth: "100%",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        background: "var(--surface-raised)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border)",
        borderRadius: 30,
        padding: 5,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const Tag = tab.href ? MotionLink : motion.button;
        // A link is not a tab: it navigates rather than swapping a panel, so it
        // gets aria-current instead of the tablist roles.
        const semantics = tab.href
          ? { href: tab.href, "aria-current": isActive ? ("page" as const) : undefined }
          : { type: "button" as const, role: "tab", "aria-selected": isActive, onClick: () => onChange?.(tab.id) };
        return (
          <Tag
            key={tab.id}
            {...semantics}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="isolate"
            style={{
              textDecoration: "none",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: dense ? "8px 13px" : "9px 18px",
              borderRadius: 24,
              border: "none",
              fontSize: dense ? "0.82rem" : "0.86rem",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#FFFFFF" : "var(--muted)",
              background: "transparent",
              flexShrink: 0,
              whiteSpace: "nowrap",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: -1,
                  borderRadius: 24,
                  background: "linear-gradient(135deg, #10B981 0%, #15803D 100%)",
                  boxShadow: "0 4px 20px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                }}
              />
            )}
            {Icon && <Icon size={15} style={{ color: isActive ? "#FFFFFF" : "var(--faint)", transition: "color 0.25s ease" }} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 10,
                  background: isActive ? "rgba(255,255,255,0.22)" : "rgba(0, 0, 0, 0.07)",
                  color: isActive ? "#fff" : "var(--muted)",
                  marginLeft: 4,
                }}
              >
                {tab.badge}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
