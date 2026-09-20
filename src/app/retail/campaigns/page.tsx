import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { Megaphone, MessageCircle, MessageSquare, Mail, ChevronRight } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { createCampaign } from "./actions";
import { CampaignsTableClient } from "./CampaignsTableClient";

import { InfoHint } from "../_components/InfoHint";
export const dynamic = "force-dynamic";

type Campaign = { id: number; name: string; channel: string; targetSegment: string | null; status: string; recipientCount: number; sentAt: string | null };

const CHANNEL_ICON: Record<string, React.ReactNode> = { whatsapp: <MessageCircle size={13} />, sms: <MessageSquare size={13} />, email: <Mail size={13} /> };
const SEG_LABEL: Record<string, string> = { all: "All customers", loyal: "Loyal", high_value: "High-Value", regular: "Regular", new: "New", at_risk: "At Risk", dormant: "Dormant" };

export default async function CampaignsPage() {
  await guardRetail(["brand", "superadmin"]);
  const { campaigns } = await apiGet<{ campaigns: Campaign[] }>("/api/retail/campaigns");
  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Campaigns</h1>
        <p className="text-[12px] text-[var(--faint)]">Target a customer segment over WhatsApp, SMS or email.</p>
      </div>

      <Section title="New campaign" icon={<Megaphone size={15} />} hint="Send a targeted SMS/WhatsApp/Email to a customer segment. Recipients are resolved from your customers in that RFM segment.">
        <ActionForm action={createCampaign} success="Campaign created" className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="text-[11px] text-[var(--faint)]">Name</span><input name="name" required className={input} placeholder="Diwali Sale" /></label>
          <label className="block"><span className="text-[11px] text-[var(--faint)]">Channel</span>
            <select name="channel" className={input} defaultValue="whatsapp"><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option></select>
          </label>
          <label className="block"><span className="text-[11px] text-[var(--faint)]">Target segment</span>
            <select name="targetSegment" className={input} defaultValue="all">
              {["all", "loyal", "high_value", "regular", "new", "at_risk", "dormant"].map((s) => <option key={s} value={s}>{SEG_LABEL[s]}</option>)}
            </select>
          </label>
          <div className="hidden sm:block" />
          <label className="block sm:col-span-2"><span className="text-[11px] text-[var(--faint)]">Message</span><textarea name="message" required rows={3} className={input} placeholder="Flat 10% off this Diwali on all Grocery products…" /></label>
          <div className="sm:col-span-2"><SubmitButton className="px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Create campaign</SubmitButton></div>
        </ActionForm>
      </Section>

      <CampaignsTableClient campaigns={campaigns} />
    </div>
  );
}

function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2"><span className="text-[var(--accent)]">{icon}</span><h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>{hint && <InfoHint text={hint} className="ml-0.5" />}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}
