import { cn } from "@/lib/utils/cn";

/**
 * Global loader for the whole unified portal — usable in the portal shell AND
 * inside every module (CRM / HRMS / Pulse / Expenses / Support …).
 *
 * Visual: the multi-ring "atom" spinner (Uiverse by Nawsome). Its keyframes +
 * ring colours live in globals.css (`.pl__ring*` / `@keyframes pl-ring*`), which
 * is loaded app-wide, so this renders identically everywhere.
 *
 * Pure markup (no hooks / no "use client"), so it works in Server Components
 * (e.g. a route `loading.tsx`) as well as Client Components.
 *
 * @example inline        <Loader />
 * @example with label    <Loader size="sm" label="Loading deals…" />
 * @example section fill  <div className="relative min-h-40"><Loader overlay /></div>
 * @example whole page     <PageLoader label="Loading…" />
 * @example blocking modal <Loader fullScreen backdrop label="Saving…" />
 */

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: number; gap: string; text: string }> = {
  xs: { box: 20, gap: "gap-2", text: "text-[11px]" },
  sm: { box: 30, gap: "gap-2.5", text: "text-[12px]" },
  md: { box: 44, gap: "gap-3", text: "text-[13px]" },
  lg: { box: 60, gap: "gap-3", text: "text-[14px]" },
  xl: { box: 88, gap: "gap-3.5", text: "text-[15px]" },
};

export interface LoaderProps {
  /** Preset size, or pass a number for a custom pixel diameter. */
  size?: Size | number;
  /** Optional text shown beside (inline) or under (overlay) the spinner. */
  label?: string;
  /** Force a ring colour. Defaults to the surrounding scope's `var(--accent)`. */
  color?: string;
  /** Fill the nearest positioned ancestor (needs a `relative` parent). */
  overlay?: boolean;
  /** Fixed overlay covering the whole viewport. */
  fullScreen?: boolean;
  /** Dim + blur behind an overlay / fullScreen loader. */
  backdrop?: boolean;
  className?: string;
}

function Rings({ box, color }: { box: number; color?: string }) {
  return (
    <svg className="pl shrink-0" width={box} height={box} viewBox="0 0 240 240" role="status" aria-label="Loading"
      style={color ? ({ display: "block", ["--pl-accent" as string]: color } as React.CSSProperties) : { display: "block" }}>
      <circle className="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round" />
      <circle className="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round" />
      <circle className="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round" />
      <circle className="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round" />
    </svg>
  );
}

export function Loader({ size = "md", label, color, overlay = false, fullScreen = false, backdrop = false, className }: LoaderProps) {
  const preset = typeof size === "number" ? null : SIZES[size];
  const box = typeof size === "number" ? size : preset!.box;
  const gap = preset?.gap ?? "gap-3";
  const text = preset?.text ?? "text-[13px]";

  const stack = fullScreen || overlay; // label sits under the spinner
  const content = label ? (
    <span className={cn("inline-flex items-center", stack ? "flex-col gap-2.5" : gap)}>
      <Rings box={box} color={color} />
      <span className={cn("font-medium tracking-[-0.01em]", text)} style={{ color: "var(--ink-muted, var(--muted, #767672))" }}>
        {label}
      </span>
    </span>
  ) : (
    <Rings box={box} color={color} />
  );

  if (fullScreen || overlay) {
    return (
      <div
        className={cn("grid place-items-center z-50", fullScreen ? "fixed inset-0" : "absolute inset-0", className)}
        style={backdrop ? { background: "color-mix(in srgb, var(--s1, var(--surface, #ffffff)) 60%, transparent)", backdropFilter: "blur(2px)" } : undefined}
      >
        {content}
      </div>
    );
  }

  return <span className={cn("inline-flex", className)}>{content}</span>;
}

/** Centred loader that fills the content area — for a whole page or route
 *  loading.tsx. No label by default (spinner only); pass `label` if you want text. */
export function PageLoader({ label, size = "lg", className }: { label?: string; size?: Size | number; className?: string }) {
  return (
    <div className={cn("grid place-items-center w-full h-full min-h-[70vh]", className)}>
      <Loader size={size} label={label} />
    </div>
  );
}

export default Loader;
