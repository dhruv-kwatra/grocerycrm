import { apiGet } from "@/lib/api/server";
import {
  Smartphone, LayoutDashboard, Warehouse, ReceiptText, Truck, ClipboardList,
  Boxes, Building2, BarChart3, Building, MapPin, UserCog, RotateCcw, BookOpen,
} from "lucide-react";
import type { GroceryRole } from "@/lib/retail/constants";

export const dynamic = "force-dynamic";

type Scope = { assigned: boolean; role?: GroceryRole };

type Step = { title: string; detail: string };
type Guide = { role: GroceryRole; label: string; icon: React.ElementType; intro: string; steps: Step[] };

const ROLE_LABEL: Record<GroceryRole, string> = {
  store_associate: "Store Associate",
  store_manager: "Store Manager",
  distributor: "Distributor",
  partner: "Partner",
  brand: "Brand",
  superadmin: "Platform Staff",
};

// One step-by-step guide per role. Each user sees their own; superadmin sees all.
const GUIDES: Record<Exclude<GroceryRole, "superadmin">, Guide> = {
  store_associate: {
    role: "store_associate", label: "Store Associate", icon: Smartphone,
    intro: "Handle billing, barcode scanning, shelf replenishment, stock checks, customer support, and returns.",
    steps: [
      { title: "Tally footfall", detail: "As customers enter, tap footfall on the Agent screen to record traffic for the day." },
      { title: "Capture a walk-in", detail: "Add the customer's name & mobile, the product they're interested in, and budget, then record the outcome — sale or lost." },
      { title: "Log a demo", detail: "Record product demonstrations you give so conversion is tracked." },
      { title: "Log a sale", detail: "Pick the product, quantity, bill amount and payment method (Cash/UPI/Card/EMI). Stock is deducted from inventory automatically." },
      { title: "Look things up", detail: "Use Customer Lookup for purchase history and Stock Lookup for live availability before you promise a customer." },
    ],
  },
  store_manager: {
    role: "store_manager", label: "Store Manager", icon: LayoutDashboard,
    intro: "Run the store: watch performance, manage inventory, and keep orders moving.",
    steps: [
      { title: "Check the Floor Board", detail: "See today's KPIs — footfall, demos, bills, conversion, revenue — and each agent's performance." },
      { title: "Receive inbound stock", detail: "In Inventory, confirm deliveries from your distributor. Receiving a delivery adds it to your on-hand stock." },
      { title: "Add stock", detail: "In Inventory, add a Grocery/catalog item received off-system, or add an item bought from another source." },
      { title: "Request replenishment", detail: "In Inventory, low SKUs are flagged under Stock & Replenishment — hit Request to ask your distributor to restock." },
      { title: "Manage orders", detail: "In Orders, see every floor-agent sale (customer, product, amount, payment) and update each order's status to delivery." },
      { title: "Log a sale", detail: "In Orders, hit Log a sale. Credit it to the agent who closed it, or leave it as yourself for a sale you rang up." },
      { title: "Provision staff", detail: "In Users, add floor agents for your store and manage their access." },
      { title: "Close the day", detail: "Run End-of-Day on the Floor Board to reconcile and close out the store." },
    ],
  },
  distributor: {
    role: "distributor", label: "Distributor", icon: Truck,
    intro: "Stock from Grocery, supply your stores, and grow your territory.",
    steps: [
      { title: "Order from Grocery", detail: "On Products → Grocery Orders, place a purchase order to Grocery and track its status until fulfilled." },
      { title: "Fulfil replenishment", detail: "On the Replenishment tab, dispatch stock to stores that have requested restocking." },
      { title: "Dispatch & track stock", detail: "On Products & Stock, dispatch stock to any store in your territory and watch your own on-hand." },
      { title: "Onboard companies & stores", detail: "In Users → Add company / store, create partner/store companies, then create their users." },
      { title: "Know your customers", detail: "In Customers, review shoppers and segments across your whole territory." },
      { title: "Track performance", detail: "Use Analytics to monitor sell-through and store performance across the territory." },
    ],
  },
  partner: {
    role: "partner", label: "Partner", icon: Boxes,
    intro: "Oversee your outlet group's performance and staff.",
    steps: [
      { title: "Open your Portfolio", detail: "See the stores in your group and their headline numbers." },
      { title: "Raise an order for a store", detail: "On Portfolio, place a replenishment order on behalf of any of your outlets — your distributor sees it and dispatches the stock." },
      { title: "Track performance", detail: "Use Analytics to compare stores and spot outliers." },
      { title: "Manage staff", detail: "In Users, provision and manage the people across your outlets." },
      { title: "Watch customers", detail: "Review shoppers and segments in Customers across your outlet group." },
    ],
  },
  brand: {
    role: "brand", label: "GroceryCRM (Brand)", icon: Building2,
    intro: "Read the whole estate, fulfil the channel, and keep the catalog stocked.",
    steps: [
      { title: "Read the estate", detail: "Analytics and Estate give you the whole channel's performance top-down." },
      { title: "Fulfil distributor orders", detail: "In Orders, review incoming distributor purchase orders and fulfil (or reject) them — stock moves brand → distributor." },
      { title: "Stock the warehouse", detail: "On Brand Stock, add products to the catalog and stock your master warehouse." },
      { title: "Manage distributors", detail: "In Distributors, maintain your distributor directory, KYC and performance." },
      { title: "Watch the territory", detail: "Use Territory for planogram compliance and conversion by zone." },
    ],
  },
};

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = guide.icon;
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-start gap-3">
        <span className="grid place-items-center rounded-lg shrink-0 mt-0.5" style={{ width: 34, height: 34, background: "var(--accent-light)", color: "var(--accent-dark)" }}>
          <Icon size={17} />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text)]">{guide.label} guide</h2>
          <p className="text-[12px] text-[var(--faint)] mt-0.5">{guide.intro}</p>
        </div>
      </div>
      <ol className="p-5 space-y-3.5">
        {guide.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid place-items-center shrink-0 rounded-full text-[12px] font-bold tabular-nums mt-0.5" style={{ width: 24, height: 24, background: "var(--accent)", color: "#fff" }}>{i + 1}</span>
            <div>
              <p className="text-[13.5px] font-semibold text-[var(--text)]">{s.title}</p>
              <p className="text-[12.5px] text-[var(--muted)] leading-[1.5] mt-0.5">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function GuidePage() {
  const scope = await apiGet<Scope>("/api/retail/scope").catch(() => ({ assigned: false }) as Scope);
  const role = scope.assigned ? scope.role : undefined;

  // Superadmin (platform staff) sees every role's guide; everyone else sees their own.
  const guides: Guide[] =
    role === "superadmin" || !role
      ? Object.values(GUIDES)
      : [GUIDES[role as Exclude<GroceryRole, "superadmin">]].filter(Boolean);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl 2xl:max-w-4xl mx-auto w-full">
      <div className="flex items-start gap-2.5">
        <span className="text-[var(--accent)] mt-0.5"><BookOpen size={20} /></span>
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Guide</h1>
          <p className="text-[12px] text-[var(--faint)]">
            {role === "superadmin" || !role
              ? "Step-by-step guides for every role."
              : `A step-by-step guide for your role — ${ROLE_LABEL[role]}.`}
          </p>
        </div>
      </div>

      {guides.map((g) => <GuideCard key={g.role} guide={g} />)}
    </div>
  );
}
