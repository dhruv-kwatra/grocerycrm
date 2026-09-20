"use server";

import { apiSend } from "@/lib/api/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../_components/action-types";

// A manager logging a sale from the Orders page. `agentId` credits it to one of
// the store's floor agents; blank credits the manager themselves (a sale they
// closed on the floor). The backend re-checks that the person works here.
export async function logSaleForAgent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/agent/sales", "POST", {
      agentId: formData.get("agentId") || undefined,
      skuId: formData.get("skuId") || undefined,
      units: Number(formData.get("units") ?? 1),
      revenue: formData.get("revenue") || undefined, // blank → backend auto-prices from SKU MRP
      paymentMethod: formData.get("paymentMethod") || undefined,
      customerName: formData.get("customerName") || undefined,
      customerPhone: formData.get("customerPhone") || undefined,
    });
    revalidatePath("/retail/orders");
    revalidatePath("/retail/customers");
    revalidatePath("/retail/agent/customers");
    revalidatePath("/retail/manager");
    revalidatePath("/retail/agent");
    revalidatePath("/retail/analytics");
    return { ok: true, message: "Sale logged" };
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message ? e.message : "Could not log the sale" };
  }
}

export async function updateOrderStatus(id: number, status: string) {
  try {
    await apiSend(`/api/retail/manager/orders/${id}/status`, "POST", { status });
    revalidatePath("/retail/orders");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not update status" };
  }
}

// Move several orders at once. The backend refuses the whole batch if any id is
// outside the caller's scope, so this never half-applies.
export async function bulkUpdateOrderStatus(ids: number[], status: string) {
  try {
    const r = await apiSend<{ count: number }>("/api/retail/manager/orders/status", "POST", { ids, status });
    revalidatePath("/retail/orders");
    return { ok: true as const, count: r.count };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not update those orders" };
  }
}
