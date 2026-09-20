import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { ArrowLeft, Send, MessageCircle, MessageSquare, Mail } from "lucide-react";
import { ActionForm, SubmitButton } from "../../_components/ActionForm";
import { sendCampaign } from "../actions";

export const dynamic = "force-dynamic";

type Detail = {
  campaign: { id: number; name: string; channel: string; targetSegment: string | null; message: string; status: string; recipientCount: number; sentAt: string | null };
  recipients: { id: number; customerId: number; name: string | null; phone: string | null; email: string | null }[];
};

const SEG_LABEL: Record<string, string> = { all: "All customers", loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant" };
const digits = (p: string | null) => (p ? p.replace(/\D/g, "") : "");

function channelLink(channel: string, r: { phone: string | null; email: string | null }, name: string, message: string): string | null {
  const body = encodeURIComponent(message);
  if (channel === "whatsapp") return r.phone ? `https://wa.me/${digits(r.phone)}?text=${body}` : null;
  if (channel === "sms") return r.phone ? `sms:${r.phone}?body=${body}` : null;
  if (channel === "email") return r.email ? `mailto:${r.email}?subject=${encodeURIComponent(name)}&body=${body}` : null;
  return null;
}

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  await guardRetail(["brand", "superadmin"]);
  const { id } = await params;
  const { campaign: c, recipients } = await apiGet<Detail>(`/api/retail/campaigns/${id}`);
  const ChannelIcon = c.channel === "whatsapp" ? MessageCircle : c.channel === "sms" ? MessageSquare : Mail;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto w-full">
      <Link href="/retail/campaigns" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--accent)]"><ArrowLeft size={14} /> All campaigns</Link>

      <div className="rlp-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">{c.name}</h1>
            <p className="text-[12px] text-[var(--muted)] mt-1 flex items-center gap-1.5 capitalize"><ChannelIcon size={13} /> {c.channel} · {SEG_LABEL[c.targetSegment ?? "all"]}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "sent" ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--warning-bg)] text-[var(--warning)]"}`}>{c.status}</span>
        </div>
        <p className="text-sm text-[var(--text)] mt-3 whitespace-pre-wrap bg-[var(--surface-raised)] rounded-lg p-3">{c.message}</p>
        {c.status === "draft" && (
          <ActionForm action={sendCampaign.bind(null, c.id)} success="Recipients resolved" className="mt-3">
            <SubmitButton className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]"><Send size={15} /> Resolve &amp; send</SubmitButton>
          </ActionForm>
        )}
      </div>

      <div className="rlp-card rlp-card--flat overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Recipients{recipients.length ? ` (${recipients.length})` : ""}</h2>
          {c.status === "sent" && <span className="text-[11px] text-[var(--faint)]">delivery is manual for the pilot — use the links</span>}
        </div>
        <div className="p-2 overflow-x-auto">
          {recipients.length === 0 ? (
            <p className="text-sm text-[var(--faint)] py-6 text-center">{c.status === "draft" ? "Send to resolve recipients from the target segment." : "No reachable recipients."}</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recipients.map((r) => {
                const link = channelLink(c.channel, r, c.name, c.message);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)] truncate">{r.name ?? r.phone ?? r.email}</p>
                      <p className="text-[11px] text-[var(--faint)]">{c.channel === "email" ? r.email : r.phone}</p>
                    </div>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[var(--accent-light)] text-[var(--accent-dark)] rounded-md hover:brightness-95">
                        <ChannelIcon size={13} /> Open
                      </a>
                    ) : <span className="text-[11px] text-[var(--faint)]">no {c.channel === "email" ? "email" : "phone"}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
