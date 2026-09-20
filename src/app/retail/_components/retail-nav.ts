import {
  Boxes, UserCog, Package, Contact, BarChart3,
  MapPin, Building, LayoutGrid, UserRound,
  Users, Megaphone, RotateCcw, ClipboardList,
  LayoutDashboard, Truck, Search, BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GroceryRole } from "@/lib/retail/constants";

// Shared grocery navigation — consumed by the desktop topbar/sidebar and the mobile
// drawer so both stay in sync. Grocery nav is role-driven: each role sees only
// its own screens; superadmin (platform staff) sees all existing pages.
export type GroceryNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: GroceryRole[];
};

/** @deprecated Use GroceryNavItem instead. */
export type RetailNavItem = GroceryNavItem;

export const ROLE_NAV_ITEMS: Record<GroceryRole, GroceryNavItem[]> = {
  brand: [
    { label: "Dashboard",    href: "/retail/estate",        icon: LayoutDashboard, roles: ["brand"] },
    { label: "Analytics",    href: "/retail/analytics",     icon: BarChart3,       roles: ["brand"] },
    { label: "Distributors", href: "/retail/distributors",  icon: Building,        roles: ["brand"] },
    { label: "Products",     href: "/retail/brand-stock",   icon: Package,         roles: ["brand"] },
    { label: "Promotions",   href: "/retail/campaigns",     icon: Megaphone,       roles: ["brand"] },
    { label: "Territories",  href: "/retail/territory",     icon: MapPin,          roles: ["brand"] },
    { label: "Orders",       href: "/retail/orders",        icon: ClipboardList,   roles: ["brand"] },
    { label: "Returns",      href: "/retail/returns",       icon: RotateCcw,       roles: ["brand"] },
    { label: "Customers",    href: "/retail/customers",     icon: Contact,         roles: ["brand"] },
    { label: "Users",        href: "/retail/users",         icon: UserCog,         roles: ["brand"] },
    { label: "Guide",        href: "/retail/guide",         icon: BookOpen,        roles: ["brand"] },
  ],
  distributor: [
    { label: "Dashboard",    href: "/retail/distributor",   icon: LayoutDashboard, roles: ["distributor"] },
    { label: "Supply",       href: "/retail/supply",        icon: Truck,           roles: ["distributor"] },
    { label: "Inventory",    href: "/retail/inventory",     icon: Boxes,           roles: ["distributor"] },
    { label: "Orders",       href: "/retail/orders",        icon: ClipboardList,   roles: ["distributor"] },
    { label: "Returns",      href: "/retail/returns",       icon: RotateCcw,       roles: ["distributor"] },
    { label: "Customers",    href: "/retail/customers",     icon: Contact,         roles: ["distributor"] },
    { label: "Analytics",    href: "/retail/analytics",     icon: BarChart3,       roles: ["distributor"] },
    { label: "Guide",        href: "/retail/guide",         icon: BookOpen,        roles: ["distributor"] },
  ],
  partner: [
    { label: "Dashboard",    href: "/retail/partner",       icon: LayoutDashboard, roles: ["partner"] },
    { label: "Territories",  href: "/retail/territory",     icon: MapPin,          roles: ["partner"] },
    { label: "Orders",       href: "/retail/orders",        icon: ClipboardList,   roles: ["partner"] },
    { label: "Customers",    href: "/retail/customers",     icon: Contact,         roles: ["partner"] },
    { label: "Analytics",    href: "/retail/analytics",     icon: BarChart3,       roles: ["partner"] },
    { label: "Guide",        href: "/retail/guide",         icon: BookOpen,        roles: ["partner"] },
  ],
  store_manager: [
    { label: "Manager",      href: "/retail/manager",       icon: Users,           roles: ["store_manager"] },
    { label: "Associates",   href: "/retail/manager/agents",icon: Users,           roles: ["store_manager"] },
    { label: "Customer",     href: "/retail/customers",     icon: Contact,         roles: ["store_manager"] },
    { label: "Products",     href: "/retail/brand-stock",   icon: Package,         roles: ["store_manager"] },
    { label: "Inventory",    href: "/retail/inventory",     icon: Boxes,           roles: ["store_manager"] },
    { label: "Orders",       href: "/retail/orders",        icon: ClipboardList,   roles: ["store_manager"] },
    { label: "Returns",      href: "/retail/returns",       icon: RotateCcw,       roles: ["store_manager"] },
    { label: "Promotions",   href: "/retail/campaigns",     icon: Megaphone,       roles: ["store_manager"] },
    { label: "Guide",        href: "/retail/guide",         icon: BookOpen,        roles: ["store_manager"] },
  ],
  store_associate: [
    { label: "Today",        href: "/retail/agent",           icon: LayoutGrid,    roles: ["store_associate"] },
    { label: "Stock",        href: "/retail/agent/stock",     icon: Boxes,         roles: ["store_associate"] },
    { label: "Customers",    href: "/retail/agent/customers", icon: Search,        roles: ["store_associate"] },
    { label: "Returns",      href: "/retail/returns",         icon: RotateCcw,     roles: ["store_associate"] },
    { label: "Guide",        href: "/retail/guide",           icon: BookOpen,      roles: ["store_associate"] },
  ],
  superadmin: [
    { label: "Estate",         href: "/retail/estate",          icon: LayoutDashboard, roles: ["superadmin"] },
    { label: "Analytics",      href: "/retail/analytics",       icon: BarChart3,       roles: ["superadmin"] },
    { label: "Distributor",    href: "/retail/distributor",     icon: Truck,           roles: ["superadmin"] },
    { label: "Distributors",   href: "/retail/distributors",    icon: Building,        roles: ["superadmin"] },
    { label: "Supply",         href: "/retail/supply",          icon: Truck,           roles: ["superadmin"] },
    { label: "Partner",        href: "/retail/partner",         icon: Building,        roles: ["superadmin"] },
    { label: "Manager",        href: "/retail/manager",         icon: Users,           roles: ["superadmin"] },
    { label: "Associates",     href: "/retail/manager/agents",  icon: Users,           roles: ["superadmin"] },
    { label: "Associate",      href: "/retail/agent",           icon: LayoutGrid,      roles: ["superadmin"] },
    { label: "Walk-in",        href: "/retail/agent/walkin",    icon: UserRound,       roles: ["superadmin"] },
    { label: "Stock",          href: "/retail/agent/stock",     icon: Boxes,           roles: ["superadmin"] },
    { label: "Agent Cust.",    href: "/retail/agent/customers", icon: Search,          roles: ["superadmin"] },
    { label: "Products",       href: "/retail/brand-stock",     icon: Package,         roles: ["superadmin"] },
    { label: "Inventory",      href: "/retail/inventory",       icon: Boxes,           roles: ["superadmin"] },
    { label: "Orders",         href: "/retail/orders",          icon: ClipboardList,   roles: ["superadmin"] },
    { label: "Returns",        href: "/retail/returns",         icon: RotateCcw,       roles: ["superadmin"] },
    { label: "Promotions",     href: "/retail/campaigns",       icon: Megaphone,       roles: ["superadmin"] },
    { label: "Territories",    href: "/retail/territory",       icon: MapPin,          roles: ["superadmin"] },
    { label: "Customers",      href: "/retail/customers",       icon: Contact,         roles: ["superadmin"] },
    { label: "Users",          href: "/retail/users",           icon: UserCog,         roles: ["superadmin"] },
    { label: "Guide",          href: "/retail/guide",           icon: BookOpen,        roles: ["superadmin"] },
  ],
};

export const navItems: GroceryNavItem[] = Object.values(ROLE_NAV_ITEMS).flat();

export function navFor(role: GroceryRole): GroceryNavItem[] {
  return ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.brand;
}

// Which single nav item is "current" for a pathname. Prefix matching keeps a
// detail page like /retail/customers/12 lighting "Customers". When multiple
// items match (nested routes), the longest (most specific) wins.
export function activeHref(items: { href: string }[], pathname: string): string | undefined {
  return items
    .filter(({ href }) => pathname === href || pathname.startsWith(href + "/"))
    .reduce<string | undefined>((best, { href }) => (!best || href.length > best.length ? href : best), undefined);
}

// The store associate's bottom tab bar (mobile).
export const associateTabs = [
  { label: "Today",     href: "/retail/agent",           icon: LayoutGrid },
  { label: "Walk-in",   href: "/retail/agent/walkin",    icon: UserRound  },
  { label: "Stock",     href: "/retail/agent/stock",     icon: Boxes      },
  { label: "Customers", href: "/retail/agent/customers", icon: Search     },
] satisfies { label: string; href: string; icon: LucideIcon }[];

/** @deprecated Use associateTabs instead. */
export const agentTabs = associateTabs;

