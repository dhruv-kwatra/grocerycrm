// Mock dashboard data + screen — shared by the hero product shot and the
// interactive Demo section. Data verbatim from the pitch
// (docs/retailcrm/grocery-pitch.html). Pure presentational, no hooks.

import type { ReactNode } from "react";

// "warn" is a legit delta in the pitch (owner's "Open leads" KPI).
export type Delta = "up" | "down" | "flat" | "warn";
export type Tone = "good" | "warn" | "crit" | "info";
export type Row = [label: string, sub: string, tone: Tone, value: string];
export type Role = {
  url: string;
  badge: string;
  badgeCls?: string;
  who: ReactNode;
  scope: ReactNode;
  kpis: [value: string, label: string, delta: Delta, note: string][];
  left: { title: string; rows: Row[] };
  right: { title: string; rows: Row[] };
};

export const ROLES: Record<string, { tab: string; data: Role }> = {
  fmcgBrand: {
    tab: "Grocery (Brand)",
    data: {
      url: "retailiq.in/fmcg/delhi",
      badge: "Grocery · Brand",
      badgeCls: "fmcgBrand",
      who: (<><b>Delhi Circle</b> · 42 stores · all distributors</>),
      scope: (<><b>Sees:</b> whole estate, aggregated → drill-down. <b>Blocked:</b> store margins, customer PII.</>),
      kpis: [
        ["42", "Stores live", "up", "+3 this quarter"],
        ["87", "Avg planogram score", "up", "+4 vs last month"],
        ["15.2%", "Network conversion", "up", "+0.8 pt"],
        ["₹1.9 Cr", "Focus-SKU sell-through / wk", "up", "+11%"],
      ],
      left: {
        title: "Stores by zone — compliance & conversion",
        rows: [
          ["Nehru Place", "Supermarket Outlet · Distributor A", "good", "96 · 21.1%"],
          ["Karol Bagh", "Supermarket Outlet · Distributor A", "good", "91 · 18.8%"],
          ["Lajpat Nagar", "Express Store · Distributor B", "good", "88 · 16.3%"],
          ["Rajouri Garden", "Supermarket Outlet · Distributor B", "warn", "84 · 14.9%"],
          ["Dwarka", "Express Store · Distributor A", "warn", "79 · 13.5%"],
          ["Rohini", "Supermarket Outlet · Distributor B", "crit", "71 · 10.1%"],
        ],
      },
      right: {
        title: "Brand actions",
        rows: [
          ["Planogram reset: Fresh Dairy endcap", "Pushed to all 42 stores", "info", "Live"],
          ["Focus SKU: Premium Rice", "W4–W8 push", "info", "Tracking"],
          ["Incentive: Diwali sprint", "Gold Circle tiers", "good", "Draft"],
          ["Audit flag: Rohini", "3 weeks below target", "crit", "Escalated"],
        ],
      },
    },
  },
  distributor: {
    tab: "Distributor",
    data: {
      url: "retail.retailcrm.in/dist-a/stores",
      badge: "Distributor",
      who: (<><b>Distributor A</b> · 19 supplied stores</>),
      scope: (<><b>Sees:</b> only stores they supply. <b>Blocked:</b> other distributors&apos; stores, brand-wide margins.</>),
      kpis: [
        ["19", "Stores supplied", "flat", "no change"],
        ["4", "Stockout alerts", "down", "−2 vs last wk"],
        ["92%", "Fill rate", "up", "+3 pt"],
        ["₹84 L", "Secondary sales / wk", "up", "+7%"],
      ],
      left: {
        title: "Replenishment queue",
        rows: [
          ["Premium Rice · Nehru Place", "2 days cover left", "crit", "Ship today"],
          ["Organic Honey · Dwarka", "4 days cover", "warn", "Plan"],
          ["Fresh Dairy · Karol Bagh", "5 days cover", "warn", "Plan"],
          ["Wheat Flour 5kg · Lajpat Nagar", "Healthy · 12 days", "good", "OK"],
          ["Dark Chocolate · Rohini", "Overstock · 34 days", "info", "Rebalance"],
        ],
      },
      right: {
        title: "Sell-through by store (wk)",
        rows: [
          ["Nehru Place", "", "good", "142 u"],
          ["Karol Bagh", "", "good", "118 u"],
          ["Lajpat Nagar", "", "good", "96 u"],
          ["Dwarka", "", "warn", "61 u"],
          ["Rohini", "", "warn", "48 u"],
        ],
      },
    },
  },
  partner: {
    tab: "Partner",
    data: {
      url: "retail.retailcrm.in/partner/mehta-retail",
      badge: "Partner",
      who: (<><b>Mehta Retail (LPP)</b> · 3 outlets · Gold Circle T2</>),
      scope: (<><b>Sees:</b> only their own outlets. <b>Blocked:</b> other partners&apos; stores, distributor pricing.</>),
      kpis: [
        ["3", "Outlets", "flat", "Supermarket Outlet ×2 · Lite ×1"],
        ["11", "Floor agents", "up", "+1 hire"],
        ["16.1%", "Blended conversion", "up", "+1.2 pt"],
        ["T2", "Gold Circle tier", "up", "T1 at +₹9 L/qtr"],
      ],
      left: {
        title: "Outlet comparison — this week",
        rows: [
          ["Karol Bagh (Supermarket Outlet)", "Footfall 1,180", "good", "18.8% conv"],
          ["Rajouri Garden (Supermarket Outlet)", "Footfall 940", "warn", "14.9% conv"],
          ["Dwarka (Lite)", "Footfall 760", "warn", "13.5% conv"],
        ],
      },
      right: {
        title: "Agent highlights",
        rows: [
          ["Sana M. · Karol Bagh", "54 demos → 22 sales", "good", "Top"],
          ["Pooja T. · Dwarka", "33 demos → 13 sales", "warn", "Coach"],
          ["New hire · Rajouri", "Onboarding week 2", "info", "Track"],
          ["Weekend staffing gap", "Rajouri Sat PM", "crit", "Fix roster"],
        ],
      },
    },
  },
  owner: {
    tab: "Store Owner",
    data: {
      url: "retail.retailcrm.in/store/karol-bagh",
      badge: "Store Owner",
      who: (<><b>Karol Bagh Supermarket Outlet</b> · today, live</>),
      scope: (<><b>Sees:</b> this store only — own agents, own customers, own stock. <b>Blocked:</b> every other store.</>),
      kpis: [
        ["163", "Footfall today", "up", "+12% vs avg"],
        ["9", "Sales today", "up", "₹5.4 L"],
        ["14", "Open leads", "warn", "6 hot leads"],
        ["2", "Low-stock SKUs", "down", "request sent"],
      ],
      left: {
        title: "Leads to work today",
        rows: [
          ["Rohit Sharma", "Premium Rice demo · Discount coupon applied", "warn", "Call 4 PM"],
          ["Anita V.", "Fresh Dairy · Loyalty redemption", "good", "In store"],
          ["Corporate: Dua & Co", "5× Cooking Oil 1L enquiry", "info", "Quote"],
          ["Kabir M.", "Dark Chocolate · price match ask", "warn", "Open"],
          ["Walk-in 14:20", "Captured by Sana · no demo yet", "crit", "Assign"],
        ],
      },
      right: {
        title: "Shift board",
        rows: [
          ["Sana M.", "Walk-ins 31 · demos 12", "good", "5 sales"],
          ["Irfan Q.", "Walk-ins 24 · demos 8", "good", "3 sales"],
          ["Deepa R.", "Walk-ins 19 · demos 5", "warn", "1 sale"],
          ["Stock: Premium Rice", "2 units left", "crit", "Requested"],
        ],
      },
    },
  },
};

function Panel({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="panel">
      <h4>{title}</h4>
      <div className="rows">
        {rows.map(([label, sub, tone, value]) => (
          <div className="row" key={label + value}>
            <span className="grow">
              {label}
              {sub && <> <span className="sub">{sub}</span></>}
            </span>
            <span className={`pill ${tone} num`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The mock dashboard screen body (goes inside a .device frame's .screen).
export function MockScreen({ role: r }: { role: Role }) {
  return (
    <div className="screen">
      <div className="app-top">
        <div className="who-am-i">{r.who}</div>
        <span className={r.badgeCls ? `role-badge ${r.badgeCls}` : "role-badge"}>{r.badge}</span>
      </div>
      <div className="scope-line">{r.scope}</div>
      <div className="kpis">
        {r.kpis.map(([value, label, delta, note]) => (
          <div className="kpi" key={label}>
            <div className="v num">{value}</div>
            <div className="k">{label}</div>
            <div className={`d ${delta}`}>{note}</div>
          </div>
        ))}
      </div>
      <div className="panel-grid">
        <Panel title={r.left.title} rows={r.left.rows} />
        <Panel title={r.right.title} rows={r.right.rows} />
      </div>
    </div>
  );
}
