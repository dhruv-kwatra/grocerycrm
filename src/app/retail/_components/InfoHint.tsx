"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRetailTheme } from "./ThemeToggle";

// A small "i" affordance that reveals a one-line explanation on hover/click/focus.
// The tooltip is portaled to <body> so it escapes any `overflow-hidden` card
// clipping and sits at max z-index. Applies explicit Grocery Red theme styles.
export function InfoHint({ text, className = "" }: { text: string; className?: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [light] = useRetailTheme();

  const show = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top, left: r.left + r.width / 2 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span className={`relative inline-flex align-middle ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={text}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        style={{
          color: light ? "#16A34A" : "#34D399",
          borderColor: light ? "rgba(22, 163, 74, 0.4)" : "rgba(52, 211, 153, 0.4)",
          backgroundColor: light ? "rgba(22, 163, 74, 0.08)" : "rgba(16, 185, 129, 0.15)",
        }}
        className="w-[16px] h-[16px] rounded-full border text-[10px] font-bold leading-none flex items-center justify-center cursor-help transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
      >
        i
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            data-theme={light ? "light" : undefined}
            style={{
              position: "fixed",
              top: pos.top - 8,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              zIndex: 2147483647,
              maxWidth: 280,
              color: light ? "#16A34A" : "#34D399",
              backgroundColor: light ? "#FFFFFF" : "#1B2436",
              border: light ? "1px solid #CFD2D8" : "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
            className="pointer-events-none w-max rounded-lg text-[11px] font-semibold leading-snug px-3 py-1.5 text-left normal-case tracking-normal backdrop-blur-xl"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}
