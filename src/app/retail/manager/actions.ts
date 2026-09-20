"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";
import type { ActionResult } from "../_components/action-types";

// Store Manager mutations (TB-14/15/13/16). Auth + subtree validation run
// server-side in the retail backend. Each returns an ActionResult (never
// throws) so the client ActionForm can toast success/error; on success we
// revalidate the board so the fresh data streams back in.

// Server-safe error extraction (no @/lib/toast import — that pulls react-hot-toast).
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export async function replenish(skuId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/replenish", "POST", { skuId, qtyRequested: formData.get("qty") });
    revalidatePath("/retail/manager");
    return { ok: true, message: "Replenishment requested" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not raise the replenishment request") };
  }
}

export async function assignFinding(id: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend(`/api/retail/manager/findings/${id}/assign`, "POST", { assignedTo: formData.get("assignedTo") });
    revalidatePath("/retail/manager");
    return { ok: true, message: "Finding assigned" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not assign the finding") };
  }
}

export async function resolveFinding(id: number, _prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  try {
    await apiSend(`/api/retail/manager/findings/${id}/resolve`, "POST");
    revalidatePath("/retail/manager");
    return { ok: true, message: "Finding resolved" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not resolve the finding") };
  }
}

export async function decideApproval(id: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const decision = String(formData.get("decision") ?? "");
  try {
    await apiSend(`/api/retail/manager/approvals/${id}/decide`, "POST", { decision, note: formData.get("note") });
    revalidatePath("/retail/manager");
    return { ok: true, message: decision === "approved" ? "Approved" : "Rejected" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not record the decision") };
  }
}

export async function closeEod(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/eod/close", "POST", {});
    revalidatePath("/retail/manager");
    return { ok: true, message: "Day closed" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not close the day") };
  }
}

// Month target for one agent at this store. retail_targets had no write path at
// all before this — targets could only be seeded straight into the DB.
export async function setAgentTarget(agentId: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await apiSend("/api/retail/manager/targets", "POST", {
      agentId,
      metric: formData.get("metric"),
      target: formData.get("target"),
    });
    revalidatePath("/retail/manager");
    revalidatePath("/retail/agent");
    return { ok: true, message: "Target saved" };
  } catch (e) {
    return { ok: false, error: errMsg(e, "Could not save the target") };
  }
}
