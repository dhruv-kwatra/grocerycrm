import Script from "next/script";
import { getCurrentUser } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";
import type { GroceryScope, GroceryRole } from "@/lib/retail/constants";
import { RetailTopBar } from "./_components/RetailTopBar";
import { AgentTabBar } from "./_components/AgentTabBar";
import { StoreAssociateAskFloatingButton } from "./_components/StoreAssociateAskFloatingButton";
import type { Sku } from "./agent/walkin/WalkinForm";
import "./retail-theme.css";

export default async function RetailLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userRole: GroceryRole = user.role ?? (user.isSuperAdmin ? "superadmin" : "brand");
  const scope = await apiGet<GroceryScope>("/api/retail/scope").catch(() => ({
    assigned: true,
    role: userRole,
    storeId: user.storeId ?? null,
    warehouseId: user.warehouseId ?? null,
    partnerId: user.partnerId ?? null,
    brandId: user.brandId ?? null,
    territoryId: user.territoryId ?? null,
    readOnly: false,
    bypass: user.isSuperAdmin,
  }) as GroceryScope);
  const unread = await apiGet<{ count: number }>("/api/retail/notifications/unread-count").then((r) => r.count).catch(() => 0);
  const role: GroceryRole = userRole;
  // The floor agent navigates by the bottom tab bar, not the sidebar, so they
  // hold it all the way up to lg — a 10" tablet is still a handheld for them.
  // Every other role runs on a counter desktop or landscape tablet, where the
  // sidebar earns its space from md up.
  const tabBar = role === "store_associate";
  // The header's walk-in drawer needs the catalog up front. Only the agent sees
  // the button, so only the agent pays for the read.
  const walkinSkus = (tabBar || role === "superadmin")
    ? await apiGet<{ skus: Sku[] }>("/api/retail/agent/skus").then((r) => r.skus).catch(() => [])
    : [];

  // Retail theme (Grocery brand palette) lives in ./retail-theme.css.
  return (
    <div className="retail-theme flex flex-col h-screen bg-[var(--bg)] overflow-hidden" suppressHydrationWarning>
      {/* Dark glass is the default (rendered on the server). Only a user who has
          explicitly chosen light gets data-theme set before paint — so there's
          no flash either way. */}
      <Script
        id="retail-theme-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('retailTheme')==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';var e=document.querySelector('.retail-theme');if(e)e.setAttribute('data-theme','light');}}catch(_){}`,
        }}
      />
      <RetailTopBar userName={user.name} email={user.email} role={role} unread={unread} walkinSkus={walkinSkus}
        avatarUrl={user.avatarUrl} scopePath={scope.assigned ? scope.path : null} />
      {/* The tab bar is fixed, so it sits over the scroll area — pad the last
          screenful back out from under it. */}
      <main className={`flex-1 overflow-y-auto min-w-0 ${tabBar ? "pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}>
        {children}
      </main>
      {tabBar && (
        <>
          <StoreAssociateAskFloatingButton />
          <AgentTabBar />
        </>
      )}
    </div>
  );
}

