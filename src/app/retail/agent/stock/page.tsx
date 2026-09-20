import { apiGet } from "@/lib/api/server";
import { StockLookup } from "../../_components/RetailLookup";
import type { StockHit } from "../../_components/lookup-actions";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

// How much of the shelf to put on screen before the agent types anything.
const PREVIEW = 20;

export default async function AgentStockPage() {
  await guardRetail(["store_associate","superadmin"]);
  // The shelf, already on screen — an agent mid-conversation shouldn't have to
  // ask the app a question before it shows what's in the back room.
  const initial = await apiGet<{ stock: StockHit[] }>("/api/retail/lookup/stock?q=")
    .then((r) => r.stock.slice(0, PREVIEW))
    .catch(() => [] as StockHit[]);

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-md md:max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Stock</h1>
        <p className="text-[12px] text-[var(--faint)]">
          {initial.length > 0
            ? `${initial.length} lines on screen · filter to narrow`
            : "Check on-hand before you promise a unit."}
        </p>
      </div>
      <div className="rlp-card p-4">
        <StockLookup initial={initial} />
      </div>
    </div>
  );
}
