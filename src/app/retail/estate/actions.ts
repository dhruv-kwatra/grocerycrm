"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// Flag a store (TB-24/27) — the one downward action brand takes. Lands on that
// store's manager fix-list. Returns an ActionResult so the client can toast.
export async function flagStore(nodeId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/estate/flag", "POST", { nodeId, title: formData.get("title") });
    revalidatePath("/retail/estate");
    return { ok: true, message: "Store flagged" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not flag the store") };
  }
}

// The drawer's three RCM actions. Each lands on the store's fix-list as a
// finding — the same downward-write path as a flag, with the intent in the
// title so the manager (and the partner CC'd on it) knows what was asked.
const ASKS: Record<string, (store: string) => { title: string; detail: string }> = {
  fixlist: (s) => ({ title: `Fix-list sent to partner · ${s}`, detail: "Open audit findings shared with the partner for action this week." }),
  visit: (s) => ({ title: `Field visit scheduled · ${s}`, detail: "RCM field visit booked to review the open findings on site." }),
  escalate: (s) => ({ title: `Escalated to distributor · ${s}`, detail: "Raised with the distributor — compliance below target for consecutive weeks." }),
};

export async function pushAction(nodeId: number, storeName: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const kind = String(formData.get("kind") ?? "");
  const ask = ASKS[kind];
  if (!ask) return { ok: false, error: "Unknown action" };
  const { title, detail } = ask(storeName);
  try {
    await apiSend("/api/retail/estate/flag", "POST", { nodeId, title, detail });
    revalidatePath("/retail/estate");
    return { ok: true, message: title };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not push the action") };
  }
}
