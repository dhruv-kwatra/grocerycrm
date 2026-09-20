"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { createUser } from "./actions";

type Node = { id: number; name: string; nodeType: string; path: string };

// The node type each creatable role must sit at (mirrors the backend
// ROLE_NODE_TYPE). Drives the node picker off the selected role.
const ROLE_NODE_TYPE: Record<string, string> = {
  distributor: "distributor",
  partner: "partner",
  store_manager: "store",
  store_associate: "store",
};
const ROLE_LABEL: Record<string, string> = {
  distributor: "Distributor",
  partner: "Partner",
  store_manager: "Store Manager",
  store_associate: "Store Associate",
};

export function CreateUserForm({ roles, nodes }: { roles: string[]; nodes: Node[] }) {
  const [role, setRole] = useState(roles[0] ?? "");
  const [busy, setBusy] = useState(false);
  const nodeOptions = nodes.filter((n) => n.nodeType === ROLE_NODE_TYPE[role]);
  const field = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  async function submit(fd: FormData) {
    setBusy(true);
    try {
      await createUser(fd);
      // Reset the free-text fields; keep role/node for rapid multi-create.
      (document.getElementById("ru-name") as HTMLInputElement | null)?.setAttribute("value", "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-[11px] text-[var(--faint)]">Role</span>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={field}>
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] text-[var(--faint)]">Assign to {ROLE_NODE_TYPE[role] ?? "node"}</span>
        <select name="nodeId" key={role} className={field} required disabled={nodeOptions.length === 0}>
          {nodeOptions.length === 0
            ? <option value="">No {ROLE_NODE_TYPE[role]} available</option>
            : nodeOptions.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] text-[var(--faint)]">Name</span>
        <input id="ru-name" name="name" required className={field} placeholder="Full name" />
      </label>

      <label className="block">
        <span className="text-[11px] text-[var(--faint)]">Email</span>
        <input name="email" type="email" required className={field} placeholder="name@company.com" />
      </label>

      <label className="block sm:col-span-2">
        <span className="text-[11px] text-[var(--faint)]">Initial password</span>
        <input name="password" type="text" required minLength={8} className={field} placeholder="≥8 chars, letters + numbers" />
        <span className="text-[11px] text-[var(--faint)]">Share this with the user; they can change it later.</span>
      </label>

      <div className="sm:col-span-2">
        <button type="submit" disabled={busy || nodeOptions.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)] disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Create user
        </button>
      </div>
    </form>
  );
}
