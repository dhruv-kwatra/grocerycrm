"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function createReturn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const r = await apiSend<{ restocked: boolean }>("/api/retail/returns", "POST", {
      skuId: formData.get("skuId"),
      units: formData.get("units"),
      condition: formData.get("condition"),
      reason: formData.get("reason") || undefined,
    });
    revalidatePath("/retail/returns");
    return { ok: true, message: r.restocked ? "Return processed — item restocked" : "Return processed (damaged — not restocked)" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not process the return") };
  }
}
