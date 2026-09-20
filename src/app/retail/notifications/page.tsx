import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { Bell, Check, CheckCheck, Settings, Truck, PackageX, ReceiptText, Info, Megaphone, Send } from "lucide-react";
import { markRead, markAllRead, sendAnnouncement } from "./actions";
import { fmtDateTime } from "@/lib/retail/datetime";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { NotificationsTableClient } from "./NotificationsTableClient";

export const dynamic = "force-dynamic";

type Note = { id: number; kind: string; title: string; body: string | null; link: string | null; emailed: boolean; readAt: string | null; createdAt: string | null };
type Scope = { assigned: boolean; role?: string };

const KIND_ICON: Record<string, React.ReactNode> = {
  supply: <Truck size={15} />, stock: <PackageX size={15} />, billing: <ReceiptText size={15} />, test: <Bell size={15} />,
  announcement: <Megaphone size={15} />, finding: <Info size={15} />, target: <ReceiptText size={15} />,
};
const fmt = (s: string | null) => fmtDateTime(s, "");

// Mirrors the backend's AUDIENCE list — brand can't address itself.
const AUDIENCE: [string, string][] = [
  ["distributor", "Distributors"],
  ["partner", "Partners"],
  ["store_manager", "Store managers"],
  ["store_associate", "Store associates"],
];

export default async function NotificationsPage() {
  const scope = await guardRetail(["brand", "distributor", "partner", "store_manager", "store_associate", "superadmin"]);
  const { notifications, unread } = await apiGet<{ notifications: Note[]; unread: number }>("/api/retail/notifications").catch(() => ({ notifications: [] as Note[], unread: 0 }));
  const isBrand = scope.assigned && (scope.role === "brand" || scope.role === "superadmin");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight flex items-center gap-2">
            Notifications
            {unread > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white tabular-nums">{unread}</span>}
          </h1>
          <p className="text-[12px] text-[var(--faint)]">Your in-app alerts. Important ones can also arrive by email.</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <form action={markAllRead}>
              <button className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"><CheckCheck size={14} /> Mark all read</button>
            </form>
          )}
          {isBrand && (
            <Link href="/retail/notifications/settings" className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]"><Settings size={14} /> Email settings</Link>
          )}
        </div>
      </div>

      {/* Grocery's one downward message. Everything else the brand can do is a
          read — this writes notification rows, never a store's numbers. */}
      {isBrand && (
        <div className="rlp-card rlp-card--flat overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
            <Megaphone size={15} className="text-[var(--accent)]" />
            <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Send an announcement</h2>
          </div>
          <ActionForm action={sendAnnouncement} success="Announcement sent" className="p-5 space-y-3">
            <input name="title" required placeholder="Headline — e.g. Diwali offer live from Friday"
              className="px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full" />
            <textarea name="body" rows={2} placeholder="Detail (optional)"
              className="px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full" />
            <input name="link" placeholder="Link (optional) — e.g. /retail/supply"
              className="px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full" />
            <fieldset className="flex flex-wrap items-center gap-3">
              <legend className="text-[11px] text-[var(--faint)] mb-1">Audience — leave all unticked to reach the whole estate</legend>
              {AUDIENCE.map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
                  <input type="checkbox" name="roles" value={value} className="w-4 h-4" /> {label}
                </label>
              ))}
            </fieldset>
            <SubmitButton className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">
              <Send size={14} /> Send
            </SubmitButton>
          </ActionForm>
        </div>
      )}

      <NotificationsTableClient notifications={notifications} />
    </div>
  );
}
