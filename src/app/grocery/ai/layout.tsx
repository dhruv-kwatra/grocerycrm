import Script from "next/script";
import { getCurrentUser } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";
import { guardGrocery } from "@/lib/retail/guard";
import type { GroceryScope, GroceryRole } from "@/lib/retail/constants";
import { RetailTopBar } from "@/app/retail/_components/RetailTopBar";
import { AgentTabBar } from "@/app/retail/_components/AgentTabBar";
import type { Sku } from "@/app/retail/agent/walkin/WalkinForm";
import "@/app/retail/retail-theme.css";

export const metadata = {
  title: "AI Intelligence & Predictive Analytics | GroceryCRM",
  description: "Enterprise predictive AI engine for sales forecasting, demand simulation, inventory optimization, and customer churn intelligence.",
};

export default async function AiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce positive RBAC: Only Superadmin, Brand, Distributor, Partner, Store Manager allowed.
  // Store Associate is strictly excluded and redirected.
  const scope = await guardGrocery([
    "superadmin",
    "brand",
    "distributor",
    "partner",
    "store_manager",
  ]);

  const user = await getCurrentUser();
  const role: GroceryRole = scope.role;
  const unread = await apiGet<{ count: number }>("/api/retail/notifications/unread-count").then((r) => r.count).catch(() => 0);
  const tabBar = role === "store_associate";
  const walkinSkus = (tabBar || role === "superadmin")
    ? await apiGet<{ skus: Sku[] }>("/api/retail/agent/skus").then((r) => r.skus).catch(() => [])
    : [];

  return (
    <div className="retail-theme flex flex-col h-screen bg-[var(--bg)] overflow-hidden" suppressHydrationWarning>
      {/* Dark glass is default. Handles theme toggle switch seamlessly */}
      <Script
        id="retail-theme-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('retailTheme')==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';var e=document.querySelector('.retail-theme');if(e)e.setAttribute('data-theme','light');}}catch(_){}`,
        }}
      />
      <RetailTopBar
        userName={user ? user.name : "User"}
        email={user ? user.email : ""}
        role={role}
        unread={unread}
        walkinSkus={walkinSkus}
        avatarUrl={user?.avatarUrl}
        scopePath={scope.assigned ? scope.path : null}
      />
      <main className={`flex-1 overflow-y-auto min-w-0 ${tabBar ? "pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}>
        {children}
      </main>
      {tabBar && <AgentTabBar />}
    </div>
  );
}
