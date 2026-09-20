import { cache } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import type { GroceryRole } from "@/lib/retail/constants";

export type CurrentUser = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  role?: GroceryRole;
  storeId?: number | null;
  warehouseId?: number | null;
  partnerId?: number | null;
  brandId?: number | null;
  territoryId?: number | null;
};

// Dedupe the session decode across a single server request. Every apiGet/apiSend
// calls getCurrentUser() → auth(); without this, a page with N parallel fetches
// re-decrypts the session cookie N times. React `cache` memoizes per request, so
// they all share one auth() call. (Cache the session, not the redirect.)
const getSession = cache(async () => auth());

import { findDummyUserByEmail } from "@/lib/auth/dummy-users";

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const user = { ...session.user } as CurrentUser;
  if (!user.role && user.email) {
    const dummy = findDummyUserByEmail(user.email);
    if (dummy) {
      user.role = dummy.role;
      user.isSuperAdmin = dummy.isSuperAdmin;
      user.storeId = dummy.storeId ?? null;
      user.warehouseId = dummy.warehouseId ?? null;
      user.partnerId = dummy.partnerId ?? null;
      user.brandId = dummy.brandId ?? null;
      user.territoryId = dummy.territoryId ?? null;
    }
  }
  return user;
}

// Returns null instead of redirecting — for optional auth checks.
export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = { ...session.user } as CurrentUser;
  if (!user.role && user.email) {
    const dummy = findDummyUserByEmail(user.email);
    if (dummy) {
      user.role = dummy.role;
      user.isSuperAdmin = dummy.isSuperAdmin;
      user.storeId = dummy.storeId ?? null;
      user.warehouseId = dummy.warehouseId ?? null;
      user.partnerId = dummy.partnerId ?? null;
      user.brandId = dummy.brandId ?? null;
      user.territoryId = dummy.territoryId ?? null;
    }
  }
  return user;
}

// Use in admin-only server components. Redirects to / if not super admin.
export async function requireSuperAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user.isSuperAdmin) redirect("/");
  return user;
}
