"use client";

import { useRef } from "react";
import { UserPlus, X } from "lucide-react";
import { WalkinForm, type Sku } from "../agent/walkin/WalkinForm";

// Desktop/tablet only. The floor agent on a phone keeps the bottom tab bar's
// raised centre button, which goes to /retail/agent/walkin — a full page is the
// right shape on a handheld held one-handed. On a counter desktop the same job
// shouldn't cost a navigation, so it opens beside the work instead.
//
// A native <dialog> carries the backdrop, Esc-to-close and the focus trap, so
// there's no click-outside hook or animation library here. The slide comes from
// retail-theme.css (.walkin-drawer).
export function WalkinDrawer({ skus }: { skus: Sku[] }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[12.5px] font-semibold hover:bg-[var(--accent-dark)]"
      >
        <UserPlus size={15} /> Add walk-in
      </button>

      <dialog ref={ref} className="walkin-drawer" aria-label="New walk-in">
        <div className="flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border)] shrink-0">
          <div>
            <p className="text-[13.5px] font-semibold text-[var(--text)] leading-tight">New walk-in</p>
            <p className="text-[11px] text-[var(--faint)] leading-tight">Phone first — the rest is taps.</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <WalkinForm skus={skus} />
        </div>
      </dialog>
    </>
  );
}
