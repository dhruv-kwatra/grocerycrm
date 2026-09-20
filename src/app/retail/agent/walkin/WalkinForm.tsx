"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Loader2, Search, User, X } from "lucide-react";
import { ActionForm, SubmitButton } from "../../_components/ActionForm";
import { saveWalkin } from "../actions";
import { findCustomers, getCustomer, type CustomerDetail } from "../../_components/lookup-actions";
import { fmtDate } from "@/lib/retail/datetime";

export type Sku = { id: number; skuCode?: string | null; name: string; category: string | null; isFocus: boolean; mrp: string | null; onHand?: number };

type Outcome = "sale" | "lost";
type Party = "Solo" | "Couple" | "Family" | "Corporate";

const PARTIES: Party[] = ["Solo", "Couple", "Family", "Corporate"];
const REASONS = ["Price", "EMI approval", "Compare online", "Family OK", "Out of stock"];
const inr = (n: number | string) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const input = "px-3 py-2.5 text-sm border border-[var(--border-strong)] rounded-xl bg-[var(--surface)] w-full";

function Chip({ on, children, ...rest }: { on: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={`text-[13px] font-semibold px-3.5 py-2 rounded-full border transition-colors ${
        on
          ? "bg-[var(--text)] border-[var(--text)] text-[var(--surface)]"
          : "bg-[var(--surface)] border-[var(--border-strong)] text-[var(--muted)]"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--faint)] px-1">{children}</p>;
}

export function WalkinForm({ skus }: { skus: Sku[] }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [known, setKnown] = useState<CustomerDetail | null>(null);
  const [party, setParty] = useState<Party | "">("");
  const [category, setCategory] = useState<string>("");
  const [skuQuery, setSkuQuery] = useState("");
  const [skuId, setSkuId] = useState<number | null>(null);
  const [demo, setDemo] = useState(false);
  // No default. With only Sale and Lost left there is no neutral option, and
  // pre-selecting either one lets a stray tap on Save book a phantom sale or
  // write off a live customer. The agent picks, or the form does not submit.
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Categories come from the catalog, not a hardcoded list — a new category of
  // SKU shows up as a chip on its own.
  const categories = [...new Set(skus.map((s) => s.category).filter((c): c is string => !!c))];
  // Search wins over the category chips — an agent who types a model name is
  // looking across the whole range, not inside the chip they last tapped.
  const term = skuQuery.trim().toLowerCase();
  const shown = term
    ? skus.filter((s) => `${s.name} ${s.skuCode ?? ""}`.toLowerCase().includes(term))
    : category
      ? skus.filter((s) => s.category === category)
      : skus;

  // Phone is the primary key: ten digits in and the agent knows the history
  // before the customer finishes their sentence.
  const onPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (timer.current) clearTimeout(timer.current);
    if (digits.length < 10) { setKnown(null); return; }
    timer.current = setTimeout(() => {
      start(async () => {
        const hits = await findCustomers(digits);
        const found = hits.length ? await getCustomer(hits[0].id) : null;
        setKnown(found);
        if (found?.customer.name) setName(found.customer.name);
      });
    }, 350);
  };

  const toggleReason = (r: string) =>
    setReasons((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const last = known?.history[0];

  return (
    <ActionForm action={saveWalkin} success="Walk-in saved" className="flex flex-col gap-2.5">
      {/* ---- Customer ---- */}
      <Label>Customer</Label>
      <div className="flex items-center gap-2.5 bg-[var(--surface)] border-[1.5px] border-[var(--text)] rounded-xl px-3.5 py-3">
        <span className="text-[15px] font-bold text-[var(--faint)] pr-2.5 border-r border-[var(--border)]">+91</span>
        <input
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="98104 20000"
          aria-label="Customer phone number"
          className="flex-1 bg-transparent outline-none text-[17px] font-bold tracking-[0.04em] tabular-nums text-[var(--text)] placeholder:font-normal placeholder:text-[var(--faint)]"
        />
        {pending && <Loader2 size={16} className="animate-spin text-[var(--faint)]" />}
      </div>
      <input type="hidden" name="customerPhone" value={phone} />

      {known ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-[var(--success)]/25 bg-[var(--success-bg)] px-3 py-2.5">
          <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--success)] text-white flex items-center justify-center">
            <Check size={12} strokeWidth={3} />
          </span>
          <p className="text-[13px] text-[var(--text)]">
            <span className="font-bold text-[var(--success)]">Returning customer</span>
            {known.customer.name ? ` — ${known.customer.name}` : ""}
            <span className="block text-[11.5px] text-[var(--muted)] mt-0.5">
              {last
                ? `Last visit ${fmtDate(last.soldAt)} · ${last.skuName ?? "purchase"}${last.revenue ? ` · ${inr(last.revenue)}` : ""}`
                : "No past purchases on record"}
            </span>
          </p>
          <input type="hidden" name="customerName" value={name} />
        </div>
      ) : (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            name="customerName"
            placeholder="Customer name"
            autoComplete="name"
            aria-label="Customer name"
            className={input}
          />
          {phone.length === 10 && !pending && (
            <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--faint)] px-1">
              <User size={12} /> New customer — their record starts here.
            </p>
          )}
        </>
      )}

      {/* ---- Party ---- */}
      <Label>Party</Label>
      <div className="flex flex-wrap gap-2">
        {PARTIES.map((p) => (
          <Chip key={p} on={party === p} onClick={() => setParty(party === p ? "" : p)}>{p}</Chip>
        ))}
      </div>
      <input type="hidden" name="party" value={party} />

      {/* ---- Looking for: the interest picker doubles as a stock check, so the
              agent never promises a unit that isn't in the back room. ---- */}
      <Label>Looking for</Label>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)] pointer-events-none" />
        <input
          type="search"
          inputMode="search"
          value={skuQuery}
          onChange={(e) => setSkuQuery(e.target.value)}
          placeholder="Search a model or code…"
          aria-label="Search products"
          className={`${input} pl-9 ${skuQuery ? "pr-9" : ""}`}
        />
        {skuQuery && (
          <button
            type="button"
            onClick={() => setSkuQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)] p-1"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {categories.length > 0 && !skuQuery && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <span key={c} className="shrink-0">
              <Chip on={category === c} onClick={() => { setCategory(category === c ? "" : c); setSkuId(null); }}>{c}</Chip>
            </span>
          ))}
        </div>
      )}

      <div className="rlp-card px-3.5 max-h-64 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="text-[13px] text-[var(--faint)] py-5 text-center">{term ? `Nothing matches “${skuQuery.trim()}”.` : "No products in this category."}</p>
        ) : (
          shown.map((s) => {
            const on = skuId === s.id;
            const stock = s.onHand ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSkuId(on ? null : s.id)}
                aria-pressed={on}
                className="w-full flex items-center gap-3 py-2.5 text-left border-t border-[var(--border)] first:border-t-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-[var(--text)] truncate">
                    {s.name}{s.isFocus ? " ★" : ""}
                  </span>
                  <span className="block text-[11.5px] text-[var(--muted)] tabular-nums">
                    {s.mrp ? inr(s.mrp) : "—"}
                    <span
                      className={`ml-2 text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${
                        stock === 0
                          ? "bg-[var(--surface-raised)] text-[var(--faint)]"
                          : stock <= 3
                            ? "bg-[var(--warning-bg)] text-[var(--warning)]"
                            : "bg-[var(--success-bg)] text-[var(--success)]"
                      }`}
                    >
                      {stock === 0 ? "Out of stock" : `${stock} in stock`}
                    </span>
                  </span>
                </span>
                <span
                  className={`shrink-0 w-5 h-5 rounded-full border-[1.5px] ${
                    on ? "border-[var(--accent)] bg-[var(--accent)] shadow-[inset_0_0_0_3.5px_var(--surface)]" : "border-[var(--border-strong)]"
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
      {skuId && <input type="hidden" name="skuId" value={skuId} />}

      {/* ---- Demo ---- */}
      <Label>Demo given</Label>
      <Seg>
        <SegBtn on={!demo} onClick={() => setDemo(false)}>No</SegBtn>
        <SegBtn on={demo} onClick={() => setDemo(true)}>Yes — demo given</SegBtn>
      </Seg>
      <input type="hidden" name="demoGiven" value={demo ? "yes" : "no"} />

      {/* ---- Outcome: two-way, never a dropdown. Sale or Lost covers every
              walk-in. Nothing is selected until the agent chooses. ---- */}
      <Label>Outcome</Label>
      <Seg>
        <SegBtn on={outcome === "sale"} tone="success" onClick={() => setOutcome("sale")}>Sale</SegBtn>
        <SegBtn on={outcome === "lost"} tone="muted" onClick={() => setOutcome("lost")}>Lost</SegBtn>
      </Seg>
      {outcome && <input type="hidden" name="outcome" value={outcome} />}

      {/* ---- Whatever the outcome needs, and nothing else. Hidden entirely
              until an outcome is picked, so the agent is never answering
              "why not today" for a walk-in they haven't classified. ---- */}
      {outcome && (
      <div className="border-l-[2.5px] border-[var(--accent)] ml-2.5 pl-3.5 py-2 flex flex-col gap-2.5">
        {outcome === "sale" ? (
          <>
            <div className="flex gap-2">
              <label className="block w-24">
                <span className="text-[11px] text-[var(--faint)]">Quantity</span>
                <input name="units" type="number" min="1" defaultValue="1" className={`${input} tabular-nums`} />
              </label>
              <label className="block flex-1">
                <span className="text-[11px] text-[var(--faint)]">Bill amount (₹)</span>
                <input name="revenue" type="number" min="0" step="0.01" placeholder="auto" className={`${input} tabular-nums`} />
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] text-[var(--faint)]">Payment</span>
              <select name="paymentMethod" defaultValue="cash" className={input} aria-label="Payment method">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="emi">EMI</option>
              </select>
            </label>
            <p className="text-[11px] text-[var(--faint)]">Leave the bill amount blank to auto-price from MRP × quantity.</p>
          </>
        ) : (
          <>
            {/* Structured chips, not free text — "Price" and "EMI approval"
                aggregate upward, so the brand sees WHY a store loses deals. */}
            <Label>Why not today</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <Chip key={r} on={reasons.includes(r)} onClick={() => toggleReason(r)}>{r}</Chip>
              ))}
            </div>
            {reasons.map((r) => <input key={r} type="hidden" name="reason" value={r} />)}

            {/* Budget and EMI interest describe the customer, not a follow-up,
                so they survive the follow-up removal — they're still how the
                brand reads why a price point lost. */}
            <div className="flex gap-2">
              <input name="budgetBand" placeholder="Budget (₹)" inputMode="numeric" className={input} />
              <label className="flex items-center gap-2 text-[13px] text-[var(--muted)] whitespace-nowrap px-1">
                <input type="checkbox" name="emiInterest" className="w-4 h-4" /> EMI
              </label>
            </div>

            <textarea
              name="note"
              rows={2}
              placeholder="Anything worth remembering — asked for ₹5k off, EMI check pending…"
              className={`${input} resize-none`}
            />
          </>
        )}
      </div>
      )}

      <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-gradient-to-t from-[var(--bg)] from-30% to-transparent">
        <SubmitButton
          disabled={!outcome}
          className="w-full px-4 py-3.5 text-[15px] font-bold text-white rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-dark)] shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
        >
          {outcome === "sale" ? "Save · log the sale" : outcome === "lost" ? "Save · mark lost" : "Pick an outcome"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function Seg({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1 p-1 rlp-card">{children}</div>;
}

function SegBtn({ on, tone, children, onClick }: { on: boolean; tone?: "success" | "muted"; children: React.ReactNode; onClick: () => void }) {
  // The selected fill carries its own ink. The untoned variant fills with
  // --text, which is near-white on the dark theme — pairing that with
  // text-white printed white on white and hid the selected label entirely.
  // --surface is the inverse of --text in both themes, so it reads either way.
  const bg = tone === "success" ? "bg-[var(--success)] text-white"
    : tone === "muted" ? "bg-[var(--muted)] text-white"
    : "bg-[var(--text)] text-[var(--surface)]";
  const off = tone === "success" ? "text-[var(--success)]" : "text-[var(--muted)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex-1 text-[13.5px] font-bold py-2.5 px-1 rounded-lg transition-colors ${on ? bg : off}`}
    >
      {children}
    </button>
  );
}
