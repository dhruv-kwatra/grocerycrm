"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const FEED = "/retail/notifications";
const SETTINGS = "/retail/notifications/settings";

export async function markRead(id: number) {
  try { await apiSend(`/api/retail/notifications/${id}/read`, "POST", {}); revalidatePath(FEED); } catch { /* noop */ }
}
export async function markAllRead() {
  try { await apiSend("/api/retail/notifications/read-all", "POST", {}); revalidatePath(FEED); } catch { /* noop */ }
}

export async function saveSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/notifications/settings", "PUT", {
      host: formData.get("host"),
      port: formData.get("port"),
      encryption: formData.get("encryption"),
      username: formData.get("username"),
      password: formData.get("password") || undefined, // blank keeps the stored one
      fromName: formData.get("fromName"),
      fromEmail: formData.get("fromEmail"),
      enabled: formData.get("enabled") === "on",
    });
    revalidatePath(SETTINGS);
    return { ok: true, message: "Email settings saved" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not save the settings") };
  }
}

export async function saveTemplate(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/notifications/template", "PUT", {
      useCustom: formData.get("useCustom") === "on",
      subject: formData.get("subject"),
      htmlBody: formData.get("htmlBody"),
    });
    revalidatePath(SETTINGS);
    return { ok: true, message: "Template saved" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not save the template") };
  }
}

export async function sendTest(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const r = await apiSend<{ to: string }>("/api/retail/notifications/test", "POST", { to: formData.get("to") || undefined });
    revalidatePath(SETTINGS);
    return { ok: true, message: `Test email sent to ${r.to}` };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not send the test email") };
  }
}

// Brand → estate broadcast. The only message Grocery can push downward; the
// backend keeps it to the sender's own subtree.
export async function sendAnnouncement(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const roles = formData.getAll("roles").map(String).filter(Boolean);
    const res = await apiSend<{ recipients: number }>("/api/retail/notifications/announce", "POST", {
      title: formData.get("title"),
      body: formData.get("body") || undefined,
      link: formData.get("link") || undefined,
      roles,
    });
    revalidatePath(FEED);
    return { ok: true, message: `Sent to ${res.recipients} ${res.recipients === 1 ? "person" : "people"}` };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not send the announcement") };
  }
}
