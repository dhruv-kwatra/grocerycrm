"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { notify } from "@/lib/toast";
import { getSalesCsv } from "./actions";

export function DownloadCsv({ period }: { period: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const { filename, csv } = await getSalesCsv(period);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify.error("Could not export the CSV");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={go} disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-strong)] text-[var(--text)] rounded-lg hover:bg-[var(--surface-raised)] disabled:opacity-50">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Sales CSV
    </button>
  );
}
