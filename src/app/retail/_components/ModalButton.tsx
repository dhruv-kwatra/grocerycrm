"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

// Lightweight modal trigger: renders a button that opens its children in a
// centered dialog. Children can be a server-rendered block or a client form —
// both work since they're passed as `children`. Closes on Escape, backdrop
// click, or the ✕. Theme tokens resolve because the dialog renders inside the
// retail-theme layout subtree.
type Variant = "primary" | "ghost";

export function ModalButton({
  label,
  title,
  icon,
  variant = "primary",
  triggerClassName,
  children,
}: {
  label: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: Variant;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const trigger =
    variant === "primary"
      ? "bg-[var(--accent)] text-white hover:brightness-110"
      : "border border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--surface-raised)]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg ${trigger}`}
      >
        {icon}
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg my-4 sm:my-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text)]">{title ?? label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--faint)] hover:text-[var(--text)]" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
