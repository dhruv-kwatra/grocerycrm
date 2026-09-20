import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api/server";
import { Building2 } from "lucide-react";
import type { GroceryRole, GroceryScope } from "@/lib/retail/constants";
import { ROLE_HOME } from "@/lib/retail/constants";
import { getCurrentUserOrNull } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Landing — resolves the caller's scope and sends them to their role's
// home screen. Unassigned users get a "not provisioned" message rather than a
// redirect loop.
export default async function RetailHome() {
  const user = await getCurrentUserOrNull();
  if (!user) redirect("/login");

  const effectiveRole = (user.role ?? (user.isSuperAdmin ? "superadmin" : "brand")) as GroceryRole;
  redirect(ROLE_HOME[effectiveRole]);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="rlp-card p-8 text-center">
        <span className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-4">
          <Building2 size={22} className="text-[var(--accent)]" />
        </span>
        <h1 className="text-lg font-semibold text-[var(--text)]">GroceryCRM</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Your account isn&apos;t assigned to a store, territory, or estate yet. Ask an
          administrator to provision your grocery access.
        </p>
      </div>
    </div>
  );
}
