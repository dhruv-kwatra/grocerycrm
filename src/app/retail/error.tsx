"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

// Route-level error boundary for the retail module — catches failed server
// fetches (e.g. /api/retail/* unreachable) and offers a retry instead of a
// blank crash. Renders inside the themed shell (.retail-theme).
export default function RetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[var(--accent-light)]">
        <AlertCircle size={22} className="text-[var(--accent-dark)]" />
      </span>
      <h2 className="text-lg font-semibold text-[var(--text)] mb-1">Something went wrong</h2>
      <p className="text-sm text-[var(--muted)] mb-6 max-w-xs">
        This retail view couldn&apos;t load. Try again — if it persists, contact your administrator.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/retail"
          className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] transition-colors"
        >
          Back to Retail
        </Link>
      </div>
      {error.digest && <p className="mt-4 font-mono text-[11px] text-[var(--faint)]">ref: {error.digest}</p>}
    </div>
  );
}
