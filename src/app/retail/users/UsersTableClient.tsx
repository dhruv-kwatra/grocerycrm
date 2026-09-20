"use client";

import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { UserRowActions } from "./UserRowActions";

type RetailUser = {
  userId: number; name: string; email: string; accountActive: boolean;
  role: string; bindingActive: boolean;
  nodeId: number; nodeName: string; nodeType: string; nodePath: string;
};

const ROLE_LABEL: Record<string, string> = {
  brand: "Brand", distributor: "Distributor", partner: "Partner",
  store_manager: "Store Manager", store_associate: "Store Associate", superadmin: "Platform Staff",
};

export function UsersTableClient({ users }: { users: RetailUser[] }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const filtered = users.filter((u) => {
    const matchQ = !q || (
      u.name?.toLowerCase().includes(q.toLowerCase()) ||
      u.email?.toLowerCase().includes(q.toLowerCase()) ||
      u.nodeName?.toLowerCase().includes(q.toLowerCase()) ||
      u.role?.toLowerCase().includes(q.toLowerCase())
    );
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQ && matchRole;
  });

  const roles = Array.from(new Set(users.map((u) => u.role)));

  return (
    <div className="space-y-3">
      {/* Search bar + filter on the same line */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search user, email..."
              className="w-full pl-8 pr-2 py-1 text-xs border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          {roles.map((r, rIdx) => (
            <button
              key={`${r}-${rIdx}`}
              type="button"
              onClick={() => setRoleFilter(roleFilter === r ? "" : r)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                roleFilter === r
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              {ROLE_LABEL[r] ?? r}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[var(--faint)] tabular-nums">{filtered.length} of {users.length} users</span>
      </div>

      <div className="p-5 overflow-x-auto pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-6 text-center">No users match that search.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Name</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Email</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Role</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Assigned to</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-left">Status</th>
                <th className="px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((u, idx) => {
                const active = u.accountActive && u.bindingActive;
                const rowKey = `${u.userId ?? "usr"}-${u.nodeId ?? "node"}-${u.role ?? "role"}-${idx}`;
                return (
                  <tr key={rowKey}>
                    <td className="px-3 py-2.5 text-[var(--text)] font-medium">{u.name}</td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)]">
                        {u.role === "brand" && <ShieldCheck size={11} />}{ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{u.nodeName}</td>
                    <td className="px-3 py-2.5">
                      {active
                        ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success)]">Active</span>
                        : <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--muted)]">Inactive</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {u.role === "brand" ? (
                        <span className="text-[11px] text-[var(--faint)]">managed in Core</span>
                      ) : (
                        <div className="flex justify-end">
                          <UserRowActions userId={u.userId} userName={u.name} active={active} />
                        </div>
                      )}
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
