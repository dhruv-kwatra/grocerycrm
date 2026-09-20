import { apiGet } from "@/lib/api/server";
import { WalkinForm, type Sku } from "./WalkinForm";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

export default async function WalkinPage() {
  await guardRetail(["store_associate","superadmin"]);
  const { skus } = await apiGet<{ skus: Sku[] }>("/api/retail/agent/skus");

  return (
    <div className="p-4 md:p-6 space-y-3 max-w-md mx-auto w-full">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">New walk-in</h1>
        <p className="text-[12px] text-[var(--faint)]">Phone first — the rest is taps.</p>
      </div>
      <WalkinForm skus={skus} />
    </div>
  );
}
