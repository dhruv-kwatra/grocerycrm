"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

// Floor Agent capture mutations (D2). Auth, own-store scoping and role checks
// all run server-side in the retail backend (retail.access.ts); these marshal
// the form, revalidate the agent screen, and return an ActionResult (never
// throw) so the client ActionForm / PlanogramCapture can toast success/error.
const AGENT = "/retail/agent";

// Server-safe error extraction (no @/lib/toast import — that pulls react-hot-toast).
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function tallyFootfall(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/agent/footfall", "POST", { count: Number(formData.get("count") ?? 1) });
    revalidatePath("/retail/agent");
    revalidatePath("/retail/manager");
    revalidatePath("/retail/analytics");
    return { ok: true, message: "Footfall +1" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not record footfall") };
  }
}

// The whole New walk-in sheet in one submit: capture the walk-in, then log the
// demo and the outcome against it. Three endpoints because that's how the floor
// actually splits (a walk-in can get a demo and no sale, or a sale and no demo)
// — the form just spares the agent from visiting three screens to say so.
export async function saveWalkin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const outcome = String(formData.get("outcome") ?? "");
  const skuId = formData.get("skuId") || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;
  try {
    const { id } = await apiSend<{ id: number }>("/api/retail/agent/walkins", "POST", {
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      party: formData.get("party") || undefined,
      interestSkuId: skuId,
      budgetBand: formData.get("budgetBand") || undefined,
      emiInterest: formData.get("emiInterest") === "on",
    });

    if (formData.get("demoGiven") === "yes") {
      await apiSend("/api/retail/agent/demos", "POST", { skuId, walkinId: id });
    }

    if (outcome === "sale") {
      await apiSend("/api/retail/agent/sales", "POST", {
        skuId,
        units: Number(formData.get("units") ?? 1),
        revenue: formData.get("revenue") || undefined, // blank → backend auto-prices from SKU MRP
        paymentMethod: formData.get("paymentMethod") || undefined,
        walkinId: id,
        customerName: formData.get("customerName") || undefined,
        customerPhone: formData.get("customerPhone") || undefined,
      });
      await apiSend(`/api/retail/agent/walkins/${id}/outcome`, "POST", { outcome: "won", note });
    } else {
      // "Why not today" chips lead the note so the reason survives wherever
      // only the first line of lastOutcome is visible.
      const reasons = formData.getAll("reason").join(", ");
      await apiSend(`/api/retail/agent/walkins/${id}/outcome`, "POST", {
        outcome: "lost",
        note: [reasons, note].filter(Boolean).join(" — ") || undefined,
      });
    }

    revalidatePath("/retail/agent");
    revalidatePath("/retail/agent", "layout");
    revalidatePath("/retail/agent/walkin");
    revalidatePath("/retail/customers");
    revalidatePath("/retail/agent/customers");
    revalidatePath("/retail/manager");
    revalidatePath("/retail/orders");
    revalidatePath("/retail/profile");
    revalidatePath("/retail/analytics");
    return { ok: true, message: outcome === "sale" ? "Sale logged" : "Walk-in saved" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not save the walk-in") };
  }
}

export async function submitPlanogram(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const status = String(formData.get("status") ?? "");
  try {
    const dataUrl = formData.get("photoDataUrl");
    let photoUrl: string | undefined;
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
      const up = await apiSend<{ url: string }>("/api/retail/agent/planogram-photo", "POST", { dataUrl });
      photoUrl = up.url;
    }
    await apiSend("/api/retail/agent/planogram", "POST", {
      skuId: formData.get("skuId"),
      counterId: formData.get("counterId") || undefined,
      status,
      photoUrl,
      detail: formData.get("detail") || undefined,
    });
    revalidatePath(AGENT);
    return { ok: true, message: status === "fail" ? "Reported — finding opened" : "Marked compliant" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not submit the planogram check") };
  }
}
