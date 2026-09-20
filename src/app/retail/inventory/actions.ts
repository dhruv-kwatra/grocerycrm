"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const INVENTORY = "/retail/inventory";
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// Confirm receipt of an inbound dispatch → credits the store's on-hand.
export async function receiveDelivery(id: number): Promise<ActionResult> {
  try {
    await apiSend(`/api/retail/supply/inbound/${id}/receive`, "POST", {});
    revalidatePath(INVENTORY);
    return { ok: true, message: "Delivery received" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not receive the delivery") };
  }
}

// Ask the distributor to restock a low SKU.
export async function replenish(skuId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/replenish", "POST", { skuId, qtyRequested: formData.get("qty") });
    revalidatePath(INVENTORY);
    return { ok: true, message: "Replenishment requested" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not raise the replenishment request") };
  }
}

// Add on-hand for an existing catalog SKU.
export async function addStock(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/stock/add", "POST", {
      skuId: formData.get("skuId"),
      qty: Number(formData.get("qty") ?? 0),
    });
    revalidatePath(INVENTORY);
    return { ok: true, message: "Stock added" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add stock") };
  }
}

// Create an ad-hoc item (bought from another source) and stock it in.
export async function addItem(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/stock/item", "POST", {
      name: formData.get("name"),
      skuCode: formData.get("skuCode") || undefined,
      mrp: formData.get("mrp") || undefined,
      qty: Number(formData.get("qty") ?? 0),
    });
    revalidatePath(INVENTORY);
    return { ok: true, message: "Item added to inventory" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add the item") };
  }
}
