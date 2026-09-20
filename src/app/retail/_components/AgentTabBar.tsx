"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { associateTabs } from "./retail-nav";

// Floor agent's bottom tab bar. The agent works standing up, one-handed, with
// the phone low — so the screens live in thumb reach instead of behind a
// hamburger. Walk-in is raised: it's the only tap that happens with a customer
// waiting. It's picked out by href, not by index — the bar used to hardcode
// slot 2 as the raised one, which silently promoted Stock when the follow-ups
// tab was removed.
const WALKIN = "/retail/agent/walkin";

export function AgentTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Agent navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] h-14"
    >
      {associateTabs.map(({ label, href, icon: Icon }) => {
        // Exact match only — /retail/agent would otherwise light up for every tab.
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex-1 flex flex-col items-center justify-end pb-1.5 text-[10px] transition-colors ${
              active ? "text-[var(--accent)] font-bold" : "text-[var(--faint)] font-medium hover:text-[var(--text)]"
            }`}
          >
            <span
              className={`flex items-center justify-center transition-all duration-200 ${
                active
                  ? "w-10 h-10 -mt-5 rounded-full bg-[image:var(--accent-grad)] text-white shadow-[var(--accent-glow)] scale-105"
                  : "h-6 text-[var(--faint)]"
              }`}
            >
              <Icon size={active ? 20 : 19} />
            </span>
            <span className="mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
