"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, KeyRound, UserMinus, UserCheck, Trash2, AlertTriangle } from "lucide-react";
import { deactivateUser, activateUser, setPassword, deleteUser } from "./actions";

// Row action menu for the users table: a 3-dot trigger that opens a dropdown to
// change the password, (de)activate, or delete.
//
// The menu is PORTALED into the `.retail-theme` shell rather than rendered in
// place, because the table lives inside an `overflow-x-auto` wrapper — and per
// CSS, a non-visible overflow on one axis forces the other to `auto` too, so an
// in-place dropdown gets clipped on both axes. Portaling to `.retail-theme`
// (not <body>) keeps the CSS theme vars — and therefore light mode — working.
type Panel = "menu" | "password" | "delete";

export function UserRowActions({ userId, userName, active }: { userId: number; userName: string; active: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => setHost(document.querySelector(".retail-theme")), []);

  // Anchor to the trigger. Position is fixed/viewport-relative, so any scroll
  // would detach it — close instead of chasing.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    place();
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPanel("menu");
      setError(null);
      return;
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "That didn't work — try again.");
      }
    });

  const item = "w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left rounded-md disabled:opacity-50";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Actions for ${userName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
      >
        <MoreVertical size={15} />
      </button>

      {open && pos && host &&
        createPortal(
          <div
            ref={popRef}
            role="menu"
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 60, width: 232 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-modal)] p-1.5 text-left"
          >
            {error && (
              <p className="flex items-start gap-1.5 text-[11px] text-[var(--error)] bg-[var(--error-bg)] rounded-md px-2 py-1.5 mb-1">
                <AlertTriangle size={12} className="mt-px shrink-0" /> {error}
              </p>
            )}

            {panel === "menu" && (
              <>
                <button type="button" role="menuitem" className={`${item} text-[var(--text)] hover:bg-[var(--surface-raised)]`} onClick={() => setPanel("password")}>
                  <KeyRound size={14} className="text-[var(--muted)]" /> Change password
                </button>
                {active ? (
                  <button type="button" role="menuitem" disabled={pending} className={`${item} text-[var(--text)] hover:bg-[var(--surface-raised)]`} onClick={() => run(() => deactivateUser(userId))}>
                    <UserMinus size={14} className="text-[var(--muted)]" /> Deactivate
                  </button>
                ) : (
                  <button type="button" role="menuitem" disabled={pending} className={`${item} text-[var(--text)] hover:bg-[var(--surface-raised)]`} onClick={() => run(() => activateUser(userId))}>
                    <UserCheck size={14} className="text-[var(--success)]" /> Activate
                  </button>
                )}
                <div className="h-px bg-[var(--border)] my-1" />
                <button type="button" role="menuitem" className={`${item} text-[var(--error)] hover:bg-[var(--error-bg)]`} onClick={() => setPanel("delete")}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}

            {panel === "password" && (
              <form
                className="p-1.5 space-y-2"
                action={(fd) => run(() => setPassword(userId, fd))}
              >
                <label className="block">
                  <span className="text-[11px] text-[var(--faint)]">New password for {userName}</span>
                  <input
                    name="password" type="text" minLength={8} required autoFocus
                    placeholder="At least 8 chars, letters + numbers"
                    className="mt-1 w-full px-2.5 py-1.5 text-[13px] border border-[var(--border-strong)] rounded-md bg-[var(--surface)]"
                  />
                </label>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setPanel("menu")} className="flex-1 px-2 py-1.5 text-xs font-medium border border-[var(--border-strong)] text-[var(--muted)] rounded-md hover:bg-[var(--surface-raised)]">Cancel</button>
                  <button type="submit" disabled={pending} className="flex-1 px-2 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-dark)] disabled:opacity-50">
                    {pending ? "Saving…" : "Set password"}
                  </button>
                </div>
              </form>
            )}

            {panel === "delete" && (
              <div className="p-1.5 space-y-2">
                <p className="text-[12px] text-[var(--text)] leading-snug">
                  Remove <span className="font-semibold">{userName}</span> from the channel?
                </p>
                <p className="text-[11px] text-[var(--faint)] leading-snug">
                  They lose access and can no longer sign in. Their past sales and demos stay on record.
                </p>
                <div className="flex gap-1.5 pt-0.5">
                  <button type="button" onClick={() => setPanel("menu")} className="flex-1 px-2 py-1.5 text-xs font-medium border border-[var(--border-strong)] text-[var(--muted)] rounded-md hover:bg-[var(--surface-raised)]">Cancel</button>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteUser(userId))} className="flex-1 px-2 py-1.5 text-xs font-semibold bg-[var(--error)] text-white rounded-md hover:brightness-110 disabled:opacity-50">
                    {pending ? "Removing…" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>,
          host,
        )}
    </>
  );
}
