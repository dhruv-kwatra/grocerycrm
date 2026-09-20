import Link from "next/link";
import { Compass } from "lucide-react";

// 404 inside the retail shell — renders in the sidebar layout, so the nav
// stays usable instead of dumping the user on a bare page.
export default function RetailNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[var(--accent-light)]">
        <Compass size={22} className="text-[var(--accent-dark)]" />
      </span>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--faint)]">404</p>
      <h2 className="text-lg font-semibold text-[var(--text)] mt-1 mb-1">Page not found</h2>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-xs">
        This retail screen doesn&apos;t exist — check the link, or pick a section from the sidebar.
      </p>
      <Link
        href="/retail"
        className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] transition-colors"
      >
        Back to Retail
      </Link>
    </div>
  );
}
