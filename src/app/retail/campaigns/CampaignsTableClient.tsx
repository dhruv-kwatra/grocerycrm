"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MessageCircle, MessageSquare, Mail, ChevronRight } from "lucide-react";

type Campaign = { id: number; name: string; channel: string; targetSegment: string | null; status: string; recipientCount: number; sentAt: string | null };

const CHANNEL_ICON: Record<string, React.ReactNode> = { whatsapp: <MessageCircle size={13} />, sms: <MessageSquare size={13} />, email: <Mail size={13} /> };
const SEG_LABEL: Record<string, string> = { all: "All customers", loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant" };

export function CampaignsTableClient({ campaigns }: { campaigns: Campaign[] }) {
  const [q, setQ] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("");

  const filtered = campaigns.filter((c) => {
    const matchQ = !q || (
      c.name?.toLowerCase().includes(q.toLowerCase()) ||
      c.channel?.toLowerCase().includes(q.toLowerCase()) ||
      c.targetSegment?.toLowerCase().includes(q.toLowerCase())
    );
    const matchChannel = !channelFilter || c.channel === channelFilter;
    return matchQ && matchChannel;
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--border)]">
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search campaign..."
              className="w-full pl-8 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {["whatsapp", "sms", "email"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannelFilter(channelFilter === ch ? "" : ch)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors capitalize ${
                channelFilter === ch
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-6 text-center">No campaigns match that search.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link href={`/retail/campaigns/${c.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-[var(--surface-raised)] rounded-lg">
                  <span className="w-8 h-8 rounded-lg bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center shrink-0">{CHANNEL_ICON[c.channel]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{c.name}</p>
                    <p className="text-[11px] text-[var(--faint)] capitalize">{c.channel} · {SEG_LABEL[c.targetSegment ?? "all"]}{c.status === "sent" ? ` · ${c.recipientCount} recipients` : ""}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === "sent" ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--warning-bg)] text-[var(--warning)]"}`}>{c.status}</span>
                  <ChevronRight size={16} className="text-[var(--faint)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
