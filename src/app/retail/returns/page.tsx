import { apiGet } from "@/lib/api/server";
import { guardRetail } from "@/lib/retail/guard";
import { RotateCcw, AlertTriangle, PackageX } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { createReturn } from "./actions";
import { LowStockAlertsClient, ReturnsLogClient } from "./ReturnsTablesClient";

import { InfoHint } from "../_components/InfoHint";
export const dynamic = "force-dynamic";

type Scope = { assigned: boolean; role?: string };
type Product = { id: number; name: string; skuCode: string; isFocus: boolean };
type Ret = { id: number; storeName: string | null; skuName: string | null; units: number; reason: string | null; condition: string; restocked: boolean; status: string; createdAt: string | null };
type Alert = { nodeId: number; storeName: string | null; skuId: number; skuName: string | null; skuCode: string | null; onHand: number; lowThreshold: number; out: boolean };

export default async function ReturnsPage() {
  await guardRetail(["store_manager", "store_associate", "superadmin"]);
  const [scope, { products }, { returns }, alerts] = await Promise.all([
    apiGet<Scope>("/api/retail/scope").catch(() => ({ assigned: false }) as Scope),
    apiGet<{ products: Product[] }>("/api/retail/supply/products").catch(() => ({ products: [] as Product[] })),
    apiGet<{ returns: Ret[] }>("/api/retail/returns").catch(() => ({ returns: [] as Ret[] })),
    apiGet<{ alerts: Alert[] }>("/api/retail/returns/low-stock").catch(() => ({ alerts: [] as Alert[] })),
  ]);
  const role = scope.assigned ? scope.role : undefined;
  const isStoreRole = role === "store_associate" || role === "store_manager";
  const input = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Returns &amp; Stock Alerts</h1>
        <p className="text-[12px] text-[var(--faint)]">Process returns (usable items go back on the shelf) and watch low stock.</p>
      </div>

      {/* Low-stock alerts */}
      <LowStockAlertsClient alerts={alerts.alerts} />

      {/* Process a return (store roles) */}
      {isStoreRole && (
        <Section title="Process a return" icon={<RotateCcw size={15} />} hint="Log a customer return. A good-condition item goes back into store stock; damaged does not.">
          <ActionForm action={createReturn} success="Return processed" className="flex flex-wrap items-end gap-2">
            <label className="block flex-1 min-w-[180px]"><span className="text-[11px] text-[var(--faint)]">Product</span>
              <select name="skuId" className={input} defaultValue={products[0]?.id}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            </label>
            <label className="block w-20"><span className="text-[11px] text-[var(--faint)]">Units</span><input name="units" type="number" min="1" defaultValue="1" className={`${input} tabular-nums`} /></label>
            <label className="block w-32"><span className="text-[11px] text-[var(--faint)]">Condition</span>
              <select name="condition" className={input} defaultValue="good"><option value="good">Good (restock)</option><option value="damaged">Damaged</option></select>
            </label>
            <label className="block flex-1 min-w-[160px]"><span className="text-[11px] text-[var(--faint)]">Reason</span><input name="reason" className={input} placeholder="optional" /></label>
            <SubmitButton className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)]">Process</SubmitButton>
          </ActionForm>
        </Section>
      )}

      {/* Returns log */}
      <ReturnsLogClient returns={returns} />
    </div>
  );
}

function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2"><span className="text-[var(--accent)]">{icon}</span><h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>{hint && <InfoHint text={hint} className="ml-0.5" />}</div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  );
}
function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) { return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>; }
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) { return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>; }
