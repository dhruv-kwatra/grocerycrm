"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// A partner raises a replenishment order on behalf of one of their stores. The
// backend validates the target is a store inside the partner's subtree; the
// distributor then sees and dispatches it.
export async function raiseStoreOrder(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/replenish", "POST", {
      nodeId: formData.get("nodeId"),
      skuId: formData.get("skuId"),
      qtyRequested: formData.get("qty"),
    });
    revalidatePath("/retail/partner");
    return { ok: true, message: "Order raised for the store" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not raise the order") };
  }
}
