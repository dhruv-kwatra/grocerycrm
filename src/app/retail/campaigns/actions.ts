"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function createCampaign(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/campaigns", "POST", {
      name: formData.get("name"),
      channel: formData.get("channel"),
      targetSegment: formData.get("targetSegment") || "all",
      message: formData.get("message"),
    });
    revalidatePath("/retail/campaigns");
    return { ok: true, message: "Campaign created" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not create the campaign") };
  }
}

export async function sendCampaign(id: number, _prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  try {
    const r = await apiSend<{ recipients: number }>(`/api/retail/campaigns/${id}/send`, "POST");
    revalidatePath(`/retail/campaigns/${id}`);
    revalidatePath("/retail/campaigns");
    return { ok: true, message: `Resolved ${r.recipients} recipient${r.recipients === 1 ? "" : "s"}` };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not send the campaign") };
  }
}
