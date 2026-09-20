import { apiGet } from "@/lib/api/server";
import { Users, UserPlus, ShieldCheck, Building2, Network } from "lucide-react";
import { CreateUserForm } from "./CreateUserForm";
import { CreateNodeForm } from "./CreateNodeForm";
import { UserRowActions } from "./UserRowActions";
import { UsersTableClient } from "./UsersTableClient";
import { ModalButton } from "../_components/ModalButton";
import { guardRetail } from "@/lib/retail/guard";

export const dynamic = "force-dynamic";

type RetailUser = {
  userId: number; name: string; email: string; accountActive: boolean;
  role: string; bindingActive: boolean;
  nodeId: number; nodeName: string; nodeType: string; nodePath: string;
};
type Node = { id: number; name: string; nodeType: string; path: string };
type TreeNode = { id: number; parentId: number | null; nodeType: string; name: string; path: string; depth: number };
type ParentNode = { id: number; name: string; nodeType: string; path: string; childTypes: string[] };

const ROLE_LABEL: Record<string, string> = {
  brand: "Brand", distributor: "Distributor", partner: "Partner",
  store_manager: "Store Manager", store_associate: "Store Associate", superadmin: "Platform Staff",
};

export default async function RetailUsers() {
  await guardRetail(["brand","distributor","partner","store_manager","superadmin"]);
  const [{ users }, { roles, nodes }, tree, creatableNodes] = await Promise.all([
    apiGet<{ users: RetailUser[] }>("/api/retail/users"),
    apiGet<{ roles: string[]; nodes: Node[] }>("/api/retail/users/creatable"),
    apiGet<{ nodes: TreeNode[] }>("/api/retail/tree"),
    apiGet<{ canOnboard: boolean; parents: ParentNode[] }>("/api/retail/nodes/creatable"),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl 2xl:max-w-[96rem] mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">Users</h1>
          <p className="text-[12px] text-[var(--faint)]">
            Provision the people in your territory. The brand admin is created in Core; everyone below is created here.
          </p>
        </div>

        {/* Actions — each opens its form/view in a modal. */}
        <div className="flex flex-wrap items-center gap-2">
          {creatableNodes.canOnboard && (
            <>
              <ModalButton label="Add company / store" title="Add a company or store" icon={<Building2 size={15} />} variant="ghost">
                <CreateNodeForm parents={creatableNodes.parents} />
              </ModalButton>
              <ModalButton label="Channel structure" title="Your channel structure" icon={<Network size={15} />} variant="ghost">
                {tree.nodes.length === 0 ? (
                  <p className="text-sm text-[var(--faint)]">No companies or stores yet — add one to build your channel.</p>
                ) : (
                  <ul className="space-y-1">
                    {tree.nodes.map((n) => (
                      <li key={n.id} className="text-sm flex items-center gap-2" style={{ paddingLeft: `${n.depth * 16}px` }}>
                        <span className="text-[var(--text)]">{n.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)] capitalize">{n.nodeType}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ModalButton>
            </>
          )}
          {roles.length > 0 && (
            <ModalButton label="Add user" title="Create a user" icon={<UserPlus size={15} />}>
              {nodes.length === 0 ? (
                <p className="text-[12px] text-[var(--warning)] bg-[var(--warning-bg)] rounded-lg px-3 py-2">
                  No companies or stores exist yet. Add one via <span className="font-medium">Add company / store</span> first, then assign a user to it.
                </p>
              ) : (
                <CreateUserForm roles={roles} nodes={nodes} />
              )}
            </ModalButton>
          )}
        </div>
      </div>

      <Section title={`People in your territory (${users.length})`} icon={<Users size={15} />}>
        {users.length === 0 ? (
          <p className="text-sm text-[var(--faint)] py-3 text-center">No users provisioned yet.</p>
        ) : (
          <UsersTableClient users={users} />
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rlp-card rlp-card--flat overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 text-[10.5px] font-semibold text-[var(--faint)] uppercase tracking-wide ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 ${right ? "text-right" : ""} ${className || "text-[var(--muted)]"}`}>{children}</td>;
}
