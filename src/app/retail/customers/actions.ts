"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// Redeem loyalty points for a customer (1 pt = ₹1 off). Returns an ActionResult
// so the ActionForm toasts success/error.
export async function redeem(customerId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const r = await apiSend<{ balance: number }>(`/api/retail/customers/${customerId}/redeem`, "POST", { points: formData.get("points") });
    revalidatePath(`/retail/customers/${customerId}`);
    return { ok: true, message: `Redeemed — ${r.balance} pts left` };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not redeem points") };
  }
}
