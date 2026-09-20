"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "./actions";
import { notify } from "@/lib/toast";

export const STATUSES = ["pending", "confirmed", "packed", "delivered", "cancelled"] as const;

// Tone per status → drives the chip color via retail theme tokens.
export const TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  confirmed: { bg: "var(--info-bg)", fg: "var(--info)" },
  packed: { bg: "var(--secondary-light)", fg: "var(--secondary)" },
  delivered: { bg: "var(--success-bg)", fg: "var(--success)" },
  cancelled: { bg: "var(--error-bg)", fg: "var(--error)" },
};

export function StatusSelect({ id, value }: { id: number; value: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const tone = TONE[value] ?? TONE.pending;

  return (
    <select
      defaultValue={value}
      disabled={pending}
      aria-label="Order status"
      onChange={(e) => {
        const status = e.target.value;
        start(async () => {
          const res = await updateOrderStatus(id, status);
          if (res.ok) {
            notify.success("Order status updated");
            router.refresh();
          } else {
            notify.error(res.error);
          }
        });
      }}
      className="text-[12px] font-semibold rounded-md px-2 py-1 capitalize border-0 outline-none cursor-pointer disabled:opacity-50"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} style={{ background: "var(--surface)", color: "var(--text)" }}>{s}</option>
      ))}
    </select>
  );
}
