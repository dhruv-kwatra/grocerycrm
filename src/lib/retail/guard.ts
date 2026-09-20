import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api/server";
import { getCurrentUserOrNull } from "@/lib/auth/session";
import { ROLE_HOME, type GroceryRole, type GroceryScope } from "./constants";

type Assigned = Extract<GroceryScope, { assigned: true }>;

// Positive per-role page guard for grocery server pages. Fetches the caller's
// scope once and:
//   - unassigned account        → /retail (landing shows "not provisioned")
//   - role not in `allowed`     → its own ROLE_HOME (never a wrong-role shell/crash)
//   - superadmin                → always allowed (platform staff see everything)
// Returns the resolved scope so the page can reuse it without a second fetch.
export async function guardGrocery(allowed: GroceryRole[]): Promise<Assigned> {
  const user = await getCurrentUserOrNull();
  if (!user) redirect("/login");

  const effectiveRole = (user.role ?? (user.isSuperAdmin ? "superadmin" : "brand")) as GroceryRole;

  const scope = await apiGet<GroceryScope>("/api/retail/scope").catch(() => ({
    assigned: true,
    role: effectiveRole,
    storeId: user.storeId ?? null,
    warehouseId: user.warehouseId ?? null,
    partnerId: user.partnerId ?? null,
    brandId: user.brandId ?? null,
    territoryId: user.territoryId ?? null,
    nodeId: null,
    path: null,
    readOnly: false,
    bypass: user.isSuperAdmin,
  }) as GroceryScope);

  const resolvedScope: Assigned = {
    storeId: user.storeId ?? null,
    warehouseId: user.warehouseId ?? null,
    partnerId: user.partnerId ?? null,
    brandId: user.brandId ?? null,
    territoryId: user.territoryId ?? null,
    readOnly: false,
    ...(scope.assigned ? scope : {}),
    assigned: true,
    role: effectiveRole,
    bypass: user.isSuperAdmin,
  };

  if (effectiveRole !== "superadmin" && !allowed.includes(effectiveRole)) {
    redirect(ROLE_HOME[effectiveRole]);
  }
  return resolvedScope;
}

/** @deprecated Use guardGrocery instead. Kept for incremental migration. */
export const guardRetail = guardGrocery;
