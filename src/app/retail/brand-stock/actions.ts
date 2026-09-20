"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

// Brand-stock mutations. The brand (Grocery) owns the master catalog + its own
// on-hand stock; role + scope checks run server-side in the retail backend.
// These return an ActionResult (never throw) so the client ActionForm toasts.
const BRAND_STOCK = "/retail/brand-stock";
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function addProduct(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/supply/products", "POST", {
      skuCode: formData.get("skuCode"),
      name: formData.get("name"),
      category: formData.get("category") || undefined,
      mrp: formData.get("mrp") || undefined,
      isFocus: formData.get("isFocus") === "on",
    });
    revalidatePath(BRAND_STOCK);
    return { ok: true, message: "Product added to the catalog" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add the product") };
  }
}

export async function addBrandStock(skuId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const remove = formData.get("op") === "remove";
  try {
    const r = await apiSend<{ added?: number; removed?: number }>(`/api/retail/supply/products/${skuId}/stock`, "POST", { qty: formData.get("qty"), remove });
    revalidatePath(BRAND_STOCK);
    if (remove) {
      const n = r.removed ?? 0;
      return { ok: true, message: n > 0 ? `Removed ${n} unit${n === 1 ? "" : "s"} from brand stock` : "Nothing to remove — already at zero" };
    }
    return { ok: true, message: `Added ${r.added} unit${r.added === 1 ? "" : "s"} to brand stock` };
  } catch (e) {
    return { ok: false, error: errMsg(e, remove ? "Could not remove stock" : "Could not add stock") };
  }
}
