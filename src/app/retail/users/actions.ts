"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/server";

// Retail user provisioning mutations. Cascading role + subtree authorization is
// enforced server-side in the retail backend; these just marshal the form.
const USERS = "/retail/users";

export async function createUser(formData: FormData) {
  await apiSend("/api/retail/users", "POST", {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    nodeId: formData.get("nodeId"),
  });
  revalidatePath(USERS);
}

export async function deactivateUser(userId: number) {
  await apiSend(`/api/retail/users/${userId}/deactivate`, "PATCH");
  revalidatePath(USERS);
}

export async function activateUser(userId: number) {
  await apiSend(`/api/retail/users/${userId}/activate`, "PATCH");
  revalidatePath(USERS);
}

// Removes the user from the retail channel (binding + grant dropped, login
// disabled). Their core identity row survives so past sales still resolve.
export async function deleteUser(userId: number) {
  await apiSend(`/api/retail/users/${userId}`, "DELETE");
  revalidatePath(USERS);
}

export async function setPassword(userId: number, formData: FormData) {
  await apiSend(`/api/retail/users/${userId}/password`, "PATCH", {
    password: formData.get("password"),
  });
  revalidatePath(USERS);
}

// Onboard a company/store (a node) under a parent in the caller's subtree. The
// slug is derived from the name. This is what lets an admin create the first
// distributor company before assigning a distributor user to it.
export async function createNode(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "node";
  // Everything beyond the node-level keys is the onboarding profile — pack the
  // non-empty fields so the backend can validate + persist them per type.
  const NODE_KEYS = new Set(["name", "slug", "parentId", "nodeType"]);
  const profile: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (NODE_KEYS.has(k)) continue;
    const s = typeof v === "string" ? v.trim() : "";
    if (s) profile[k] = s;
  }
  await apiSend("/api/retail/nodes", "POST", {
    parentId: formData.get("parentId"),
    nodeType: formData.get("nodeType"),
    name,
    slug,
    ...(Object.keys(profile).length ? { profile } : {}),
  });
  revalidatePath(USERS);
}
