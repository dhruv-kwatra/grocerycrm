"use client";

import { useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { X, ShieldCheck, Building2, Mail, Moon, Sun, ChevronRight, LogOut, UserPlus } from "lucide-react";
import { useRetailTheme } from "./ThemeToggle";
import type { GroceryRole } from "@/lib/retail/constants";

const ROLE_LABEL: Record<GroceryRole, string> = {
  store_associate: "Store Associate",
  store_manager: "Store Manager",
  brand: "Brand",
  distributor: "Distributor",
  partner: "Partner",
  superadmin: "Platform Staff",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// The header avatar, and the card it opens — the newui portal's profile popup.
//
// Built on <dialog showModal()> rather than a hand-rolled overlay, so Esc,
// the focus trap, inert-ing the page behind and the backdrop are the browser's
// job. The prototype's version was a plain div: it couldn't be dismissed with
// the keyboard and left focus loose behind the scrim.
export function ProfileMenu({
  userName,
  email,
  role,
  avatarUrl,
  scopePath,
}: {
  userName: string;
  email: string;
  role: GroceryRole;
  avatarUrl?: string | null;
  scopePath?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [light, toggleTheme] = useRetailTheme();
  const close = () => ref.current?.close();

  const avatar = (size: number, text: string) =>
    avatarUrl ? (
      // Plain <img>: avatarUrl comes from the backend and its origin is unknown
      // here, which next/image would reject at runtime.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
    ) : (
      <span
        className="rounded-full bg-[image:var(--accent-grad)] text-white flex items-center justify-center font-bold"
        style={{ width: size, height: size, fontSize: text }}
      >
        {initials(userName)}
      </span>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={`Account: ${userName}`}
        title={email}
        className="relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="block shadow-[var(--accent-glow)] rounded-full">{avatar(32, "11px")}</span>
        <span className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[var(--success)] border-2 border-white" />
      </button>

      <dialog ref={ref} className="profile-card" aria-label="Account">
        <div className="relative p-6">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
            style={{ background: "var(--surface-raised)" }}
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-4 mb-5">
            <span className="relative shrink-0 shadow-[var(--accent-glow)] rounded-full">
              {avatar(64, "1.5rem")}
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[1.25rem] font-extrabold text-[var(--text)] leading-tight truncate">{userName}</h3>
              <p className="text-[0.82rem] font-semibold text-[var(--accent-dark)] mt-0.5">{ROLE_LABEL[role]}</p>
              <p className="flex items-center gap-1.5 text-[0.75rem] text-[var(--faint)] mt-1">
                <ShieldCheck size={13} className="text-[var(--success)]" /> ThinkShield signed in
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] px-4 py-3 mb-5 space-y-2.5" style={{ background: "var(--surface-raised)" }}>
            {scopePath && (
              <div className="flex items-center justify-between gap-3 text-[0.82rem]">
                <span className="flex items-center gap-1.5 text-[var(--muted)] shrink-0">
                  <Building2 size={14} className="text-[var(--accent)]" /> Assigned scope
                </span>
                <span className="font-semibold text-[var(--text)] truncate">{scopePath}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 text-[0.82rem]">
              <span className="flex items-center gap-1.5 text-[var(--muted)] shrink-0">
                <Mail size={14} className="text-[var(--secondary)]" /> Email
              </span>
              <span className="font-semibold text-[var(--text)] truncate">{email}</span>
            </div>
          </div>

          {/* The prototype also listed a phone number here. Nothing serves one,
              so it is absent rather than filled with a plausible-looking value. */}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-3.5 py-2.5 mb-5" style={{ background: "var(--surface-raised)" }}>
            <span className="flex items-center gap-2 text-[0.84rem] font-semibold text-[var(--text)]">
              {light ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-amber-400" />}
              Appearance ({light ? "Light" : "Dark"})
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-full text-[0.78rem] font-semibold transition-all flex items-center gap-1.5 text-slate-700 bg-slate-200/80 hover:bg-slate-300 dark:text-white dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {light ? "Switch to Dark" : "Switch to Light"}
            </button>
          </div>

          <Link
            href="/retail/profile"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[0.9rem] font-bold text-white no-underline bg-[image:var(--accent-grad)] shadow-[var(--accent-glow)]"
          >
            View full profile &amp; analytics <ChevronRight size={17} />
          </Link>

          <Link
            href="/login?switch=true"
            onClick={close}
            className="mt-2.5 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[0.85rem] font-bold text-[var(--text)] bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors no-underline"
          >
            <UserPlus size={15} /> Switch Role / Quick Login
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2.5 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[0.85rem] font-bold"
            style={{ background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--border)" }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </dialog>
    </>
  );
}
