"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Crown } from "lucide-react";
import { ThemeToggle, useRetailTheme } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { WalkinDrawer } from "./WalkinDrawer";
import { PillTabs } from "@/components/ui/PillTabs";
import { navFor, activeHref } from "./retail-nav";
import type { Sku } from "../agent/walkin/WalkinForm";
import type { GroceryRole } from "@/lib/retail/constants";

const ROLE_LABEL: Record<GroceryRole, string> = {
  store_associate: "Store Associate",
  store_manager: "Store Manager",
  brand: "Brand",
  distributor: "Distributor",
  partner: "Partner",
  superadmin: "Platform Staff",
};

type Props = { userName: string; email: string; role: GroceryRole; unread?: number; walkinSkus?: Sku[]; avatarUrl?: string | null; scopePath?: string | null };

export function RetailTopBar({ userName, email, role, unread = 0, walkinSkus = [], avatarUrl, scopePath }: Props) {
  const pathname = usePathname();
  const [light] = useRetailTheme();
  const items = navFor(role);
  const current = activeHref(items, pathname);

  const tabs = items.map(({ label, href, icon }) => ({ id: href, label, icon, href }));

  return (
    <header className="shrink-0 sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)] shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-4 md:px-6 py-2.5">
        {/* Logo + role */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/retail" className="flex items-center gap-2 sm:gap-2.5 no-underline">
            <span
              className="w-[28px] h-[28px] rounded-[8px] inline-flex items-center justify-center text-white text-[0.95rem] font-black shrink-0 leading-none"
              style={{ background: "#10B981", boxShadow: "0 0 10px rgba(16,185,129,0.4)" }}
            >
              G
            </span>
            <span className="text-[1.05rem] sm:text-[1.1rem] font-extrabold tracking-[-0.5px] inline-flex items-center gap-1 sm:gap-1.5 leading-none whitespace-nowrap">
              <span className="text-[var(--text)]">Grocery</span>
              <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
              <span style={{ color: "#10B981" }}>CRM</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[0.75rem] sm:text-[0.78rem] font-semibold text-[var(--muted)] bg-[var(--surface-raised)] border border-[var(--border)] whitespace-nowrap">
            <Crown size={13} className="text-[var(--warning)]" />
            {ROLE_LABEL[role]}
          </span>
        </div>

        {/* Desktop Nav (Center) */}
        <nav
          className="hidden lg:flex lg:flex-1 lg:justify-center overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            maskImage: "linear-gradient(to right, #000 calc(100% - 28px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 28px), transparent)",
          }}
        >
          <PillTabs tabs={tabs} activeTab={current ?? ""} layoutId="retailHeaderNav" ariaLabel="Retail navigation" dense />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {(role === "store_associate" || role === "superadmin") && <WalkinDrawer skus={walkinSkus} />}
          <ThemeToggle />

          <Link
            href="/retail/notifications"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)] border border-[var(--border)] shrink-0"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="hidden md:block text-right leading-tight">
            <p className="text-[12px] font-semibold text-[var(--text)]">{userName}</p>
            <p className="text-[10.5px] font-medium text-[var(--faint)]" title={email}>{ROLE_LABEL[role]}</p>
          </div>

          <ProfileMenu userName={userName} email={email} role={role} avatarUrl={avatarUrl} scopePath={scopePath} />
        </div>
      </div>

      {/* Mobile Nav strip for non-associate roles */}
      {role !== "store_associate" && tabs.length > 0 && (
        <div
          className="lg:hidden px-3 sm:px-4 pb-2 pt-0.5 overflow-x-auto border-t border-[var(--border)]/40 flex items-center"
          style={{
            scrollbarWidth: "none",
            maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
          }}
        >
          <PillTabs tabs={tabs} activeTab={current ?? ""} layoutId="retailHeaderNavMobile" ariaLabel="Retail navigation mobile" dense />
        </div>
      )}
    </header>
  );
}
