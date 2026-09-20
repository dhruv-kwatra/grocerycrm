"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Info, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { fmtDateTime } from "@/lib/retail/datetime";

type Notification = { id: number; kind: string; title: string; body: string | null; link: string | null; emailed: boolean; readAt: string | null; createdAt: string | null };

const KIND_ICON: Record<string, React.ReactNode> = {
  info: <Info size={15} />,
  warning: <AlertTriangle size={15} />,
  success: <CheckCircle size={15} />,
  supply: <Package size={15} />,
};

const fmt = (s: string | null) => fmtDateTime(s);

export function NotificationsTableClient({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => {
    const matchQ = !q || (
      n.title?.toLowerCase().includes(q.toLowerCase()) ||
      n.body?.toLowerCase().includes(q.toLowerCase()) ||
      n.kind?.toLowerCase().includes(q.toLowerCase())
    );
    const matchFilter = filter === "all" || !n.readAt;
    return matchQ && matchFilter;
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)]">
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Notifications</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-8 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center">
          <Bell size={26} className="mx-auto text-[var(--faint)]" />
          <p className="mt-2 text-sm text-[var(--muted)]">No notifications match.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {filtered.map((n) => {
            const isUnread = !n.readAt;
            return (
              <li key={n.id} className={`flex items-start gap-3 p-4 ${isUnread ? "bg-[var(--accent-light)]/40" : ""}`}>
                <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUnread ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-raised)] text-[var(--muted)]"}`}>
                  {KIND_ICON[n.kind] ?? <Info size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[14px] ${isUnread ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--muted)]"}`}>{n.title}</p>
                    {n.emailed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--faint)]">emailed</span>}
                  </div>
                  {n.body && <p className="text-[13px] text-[var(--muted)] mt-0.5">{n.body}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-[var(--faint)]">{fmt(n.createdAt)}</span>
                    {n.link && <Link href={n.link} className="text-[11px] font-semibold text-[var(--accent)] hover:underline">Open</Link>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
