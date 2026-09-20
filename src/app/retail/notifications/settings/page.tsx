import Link from "next/link";
import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { Mail, FileCode, Send, ArrowLeft, ShieldCheck } from "lucide-react";
import { ActionForm, SubmitButton } from "../../_components/ActionForm";
import { InfoHint } from "../../_components/InfoHint";
import { saveSettings, saveTemplate, sendTest } from "../actions";

export const dynamic = "force-dynamic";

type Settings = { host: string; port: number; encryption: string; username: string; fromName: string; fromEmail: string; enabled: boolean; hasPassword: boolean };
type Template = { useCustom: boolean; subject: string; htmlBody: string; defaultSubject: string; defaultHtml: string };

export default async function NotificationSettingsPage() {
  await guardRetail(["brand", "superadmin"]);
  const [settings, template] = await Promise.all([
    apiGet<Settings>("/api/retail/notifications/settings").catch(() => null),
    apiGet<Template>("/api/retail/notifications/template").catch(() => null),
  ]);

  if (!settings || !template) {
    return <div className="p-6 max-w-3xl mx-auto"><p className="text-sm text-[var(--muted)]">Email settings are managed by the brand (Grocery).</p></div>;
  }

  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto w-full">
      <div>
        <Link href="/retail/notifications" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--text)] mb-1"><ArrowLeft size={15} /> Back to notifications</Link>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Notification settings</h1>
        <p className="text-[12px] text-[var(--faint)]">Your own email (SMTP) credentials and template. The password is stored encrypted and never shown again.</p>
      </div>

      {/* SMTP credentials */}
      <Section title="Email credentials (SMTP)" icon={<Mail size={15} />} hint="These are used to send notification emails from your own mailbox. The password is encrypted (AES-256-GCM) before it's stored.">
        <ActionForm action={saveSettings} success="Email settings saved" className="grid gap-3 sm:grid-cols-2">
          <Field label="SMTP host" required><input name="host" defaultValue={settings.host} required className={input} placeholder="smtp.gmail.com" /></Field>
          <Field label="Port"><input name="port" type="number" defaultValue={settings.port || 587} className={`${input} tabular-nums`} placeholder="587" /></Field>
          <Field label="Encryption">
            <select name="encryption" defaultValue={settings.encryption} className={input}>
              <option value="tls">STARTTLS (587)</option>
              <option value="ssl">SSL/TLS (465)</option>
              <option value="none">None</option>
            </select>
          </Field>
          <Field label="Username"><input name="username" defaultValue={settings.username} className={input} placeholder="you@company.com" /></Field>
          <Field label={settings.hasPassword ? "Password (leave blank to keep)" : "Password / app password"}>
            <input name="password" type="password" className={input} placeholder={settings.hasPassword ? "••••••••" : "app password"} autoComplete="new-password" />
          </Field>
          <Field label="From name"><input name="fromName" defaultValue={settings.fromName} className={input} placeholder="Grocery India" /></Field>
          <Field label="From email"><input name="fromEmail" type="email" defaultValue={settings.fromEmail} className={input} placeholder="no-reply@company.com" /></Field>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)] self-end pb-1.5">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="w-4 h-4" /> Send emails (off = in-app only)
          </label>
          <div className="sm:col-span-2 flex items-center gap-2">
            <SubmitButton className="px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Save credentials</SubmitButton>
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--faint)]"><ShieldCheck size={12} /> encrypted at rest</span>
          </div>
        </ActionForm>
      </Section>

      {/* Send a test */}
      <Section title="Send a test" icon={<Send size={15} />} hint="Sends a test email using the saved credentials + template, and drops a test notification in your feed.">
        <ActionForm action={sendTest} success="Test email sent" className="flex flex-wrap items-end gap-2">
          <Field label="To (defaults to you)"><input name="to" type="email" className={input} placeholder="you@company.com" /></Field>
          <SubmitButton className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Send test</SubmitButton>
        </ActionForm>
      </Section>

      {/* Email template */}
      <Section title="Email template" icon={<FileCode size={15} />} hint="Customize the HTML wrapper for notification emails. Leave 'use custom' off to use our default template. Tokens: {{title}} {{body}} {{brandName}} {{link}} {{year}}.">
        <ActionForm action={saveTemplate} success="Template saved" className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input type="checkbox" name="useCustom" defaultChecked={template.useCustom} className="w-4 h-4" /> Use my custom template (off = use the default)
          </label>
          <Field label="Subject"><input name="subject" defaultValue={template.subject} className={input} placeholder={template.defaultSubject} /></Field>
          <Field label="HTML body">
            <textarea name="htmlBody" defaultValue={template.htmlBody} rows={14} className={`${input} font-mono text-[12px] leading-relaxed`} spellCheck={false} />
          </Field>
          <p className="text-[11px] text-[var(--faint)]">Available tokens: <code>{"{{title}}"}</code> <code>{"{{body}}"}</code> <code>{"{{brandName}}"}</code> <code>{"{{link}}"}</code> <code>{"{{linkButton}}"}</code> <code>{"{{year}}"}</code></p>
          <SubmitButton className="px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Save template</SubmitButton>
        </ActionForm>
      </Section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] text-[var(--faint)]">{label}{required ? <span className="text-[var(--error)]"> *</span> : ""}</span>{children}</label>;
}
function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2"><span className="text-[var(--accent)]">{icon}</span><h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>{hint && <InfoHint text={hint} className="ml-0.5" />}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}
