"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

// Supply-chain mutations. Role + subtree checks run server-side in the retail
// backend; these return an ActionResult (never throw) so the client ActionForm
// toasts the success/error message (e.g. "Insufficient brand stock…").
const SUPPLY = "/retail/supply";
// The brand fulfils from /retail/brand-stock ("Orders & Stock"), so that page
// has to revalidate too or the stock table it just drew from goes stale.
const BRAND_STOCK = "/retail/brand-stock";
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function createProduct(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/supply/products", "POST", {
      skuCode: formData.get("skuCode"),
      name: formData.get("name"),
      category: formData.get("category") || undefined,
      mrp: formData.get("mrp") || undefined,
      isFocus: formData.get("isFocus") === "on",
    });
    revalidatePath(SUPPLY);
    return { ok: true, message: "Product added" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add the product") };
  }
}

export async function addStock(skuId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend(`/api/retail/supply/products/${skuId}/stock`, "POST", { qty: formData.get("qty") });
    revalidatePath(SUPPLY);
    return { ok: true, message: "Stock added" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not add stock") };
  }
}

export async function placeOrder(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/supply/orders", "POST", {
      items: [{ skuId: formData.get("skuId"), qty: formData.get("qty") }],
      note: formData.get("note") || undefined,
    });
    revalidatePath(SUPPLY);
    return { ok: true, message: "Order placed" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not place the order") };
  }
}

// Fulfil an order, in full or in part. The form posts one qty_<skuId> field per
// line; whatever the brand leaves in those boxes is what actually ships. With
// no such fields the call is unqualified and the backend grants the full
// outstanding amount, which is the old behaviour.
export async function fulfilOrder(id: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const items: { skuId: number; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const skuId = Number(key.slice(4));
    const qty = Number(value);
    if (Number.isFinite(skuId) && Number.isFinite(qty)) items.push({ skuId, qty });
  }
  try {
    const r = await apiSend<{ partial?: boolean }>(
      `/api/retail/supply/orders/${id}/fulfil`, "POST",
      items.length ? { items } : undefined,
    );
    revalidatePath(SUPPLY);
    revalidatePath(BRAND_STOCK);
    return {
      ok: true,
      message: r?.partial
        ? "Part-fulfilled — the balance stays outstanding on the order"
        : "Order fulfilled — stock sent to the distributor",
    };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not fulfil the order") };
  }
}

export async function rejectOrder(id: number, _prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  try {
    await apiSend(`/api/retail/supply/orders/${id}/reject`, "POST");
    revalidatePath(SUPPLY);
    return { ok: true, message: "Order rejected" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not reject the order") };
  }
}

// Confirm the whole van: dispatch every open replenishment request in one go,
// each at the quantity the store asked for. Partial failures (a SKU the
// distributor is short on) don't abort the rest — the count says what moved.
export async function confirmDispatch(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  type Req = { id: number; storeNodeId: number; skuId: number; qtyRequested: number };
  try {
    const { requests } = await apiGet<{ requests: Req[] }>("/api/retail/supply/requests");
    if (requests.length === 0) return { ok: false, error: "Nothing in the queue to dispatch" };
    let sent = 0;
    const failures: string[] = [];
    for (const r of requests) {
      try {
        await apiSend("/api/retail/supply/dispatch", "POST", {
          toNodeId: r.storeNodeId, skuId: r.skuId, qty: r.qtyRequested, requestId: r.id,
        });
        sent++;
      } catch (e) {
        failures.push(errMsg(e, `request #${r.id}`));
      }
    }
    revalidatePath(SUPPLY);
    if (sent === 0) return { ok: false, error: failures[0] ?? "Could not dispatch" };
    return { ok: true, message: `Dispatched ${sent} drop${sent === 1 ? "" : "s"}${failures.length ? ` · ${failures.length} held back` : " · stores notified"}` };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not confirm the dispatch") };
  }
}

export async function dispatch(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/supply/dispatch", "POST", {
      toNodeId: formData.get("toNodeId"),
      skuId: formData.get("skuId"),
      qty: formData.get("qty"),
      requestId: formData.get("requestId") || undefined,
    });
    revalidatePath(SUPPLY);
    return { ok: true, message: "Dispatched to the store" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not dispatch") };
  }
}
