"use client";

import { useState } from "react";
import { Warehouse, Search, PackageMinus, PackagePlus } from "lucide-react";
import { ActionForm, SubmitButton } from "../_components/ActionForm";
import { addBrandStock } from "./actions";

type Product = { id: number; skuCode: string; name: string; category: string | null; isFocus: boolean; mrp: string | null };

export function BrandStockTableClient({
  products,
  onHandBySku,
}: {
  products: Product[];
  onHandBySku: Record<number, number>;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "focus" | "out">("all");

  const filtered = products.filter((p) => {
    const onHand = onHandBySku[p.id] ?? 0;
    const matchQ = !q || (
      p.name?.toLowerCase().includes(q.toLowerCase()) ||
      p.skuCode?.toLowerCase().includes(q.toLowerCase()) ||
      p.category?.toLowerCase().includes(q.toLowerCase())
    );
    const matchFilter =
      filter === "all" ||
      (filter === "focus" && p.isFocus) ||
      (filter === "out" && onHand <= 0);
    return matchQ && matchFilter;
  });

  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]"><Warehouse size={15} /></span>
          <h2 className="text-[13.5px] font-semibold text-[var(--text)]">Stock on hand</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search stock..."
              className="w-full pl-7 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {(["all", "focus", "out"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(filter === f ? "all" : f)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {f === "out" ? "Out of stock" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-6 text-center">No products match that search.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Product</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">SKU</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Category</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">On hand</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Adjust stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((p) => {
                const onHand = onHandBySku[p.id] ?? 0;
                return (
                  <tr key={p.id} className="hover:bg-[var(--surface-2)]">
                    <td className="px-3 py-2.5 text-[var(--text)]">
                      {p.name}
                      {p.isFocus && <span className="ml-1.5 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-dark)]">Focus</span>}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-[12px] text-[var(--muted)]">{p.skuCode}</td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{p.category ?? "—"}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${onHand <= 0 ? "text-[var(--error)]" : "text-[var(--text)]"}`}>
                      {onHand.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ActionForm action={addBrandStock.bind(null, p.id)} success="Stock updated" className="inline-flex items-center rounded-full border border-[var(--border-strong)] overflow-hidden">
                        <SubmitButton name="op" value="remove" aria-label={`Remove units of ${p.name}`}
                          className="px-2.5 py-1.5 text-[var(--muted)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] disabled:opacity-50"><PackageMinus size={13} /></SubmitButton>
                        <input name="qty" type="number" min="1" defaultValue="10" aria-label={`Units of ${p.name} to add or remove`}
                          className="w-14 px-1 py-1.5 text-xs text-center tabular-nums bg-transparent border-x border-[var(--border-strong)] outline-none" />
                        <SubmitButton name="op" value="add" aria-label={`Add units of ${p.name}`}
                          className="px-2.5 py-1.5 text-[var(--muted)] hover:bg-[var(--success-bg)] hover:text-[var(--success)] disabled:opacity-50"><PackagePlus size={13} /></SubmitButton>
                      </ActionForm>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
