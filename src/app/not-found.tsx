import Link from "next/link";
import { Compass } from "lucide-react";
import "./retail/retail-theme.css";

// App-wide 404. The retail shell has its own (src/app/retail/not-found.tsx) so
// a bad retail URL keeps its sidebar; this one catches everything else.
export default function NotFound() {
  return (
    <div className="retail-theme min-h-screen flex flex-col items-center justify-center px-8 py-20 text-center bg-[var(--bg)]" data-theme="light">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[var(--accent-light)]">
        <Compass size={22} className="text-[var(--accent-dark)]" />
      </span>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--faint)]">404</p>
      <h1 className="text-lg font-semibold text-[var(--text)] mt-1 mb-1">Page not found</h1>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-xs">
        That link doesn&apos;t point anywhere — it may have moved, or never existed.
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
