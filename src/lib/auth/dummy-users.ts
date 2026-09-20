import type { GroceryRole } from "@/lib/retail/constants";

export type DummyUser = {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  role: GroceryRole;
  roleLabel: string;
  password?: string;
  storeId?: number | null;
  warehouseId?: number | null;
  partnerId?: number | null;
  brandId?: number | null;
  territoryId?: number | null;
};

export const DEFAULT_DUMMY_USERS: DummyUser[] = [
  {
    id: 101,
    tenantId: 1,
    name: "Aarav Sharma (Platform Staff)",
    email: "admin@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: true,
    role: "superadmin",
    roleLabel: "Platform Staff",
    password: "admin123",
  },
  {
    id: 102,
    tenantId: 1,
    name: "Priya Sharma (Brand Lead)",
    email: "brand@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: false,
    role: "brand",
    roleLabel: "Brand",
    password: "brand123",
  },
  {
    id: 105,
    tenantId: 1,
    name: "Vikram Malhotra (Distributor)",
    email: "distributor@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: false,
    role: "distributor",
    roleLabel: "Distributor",
    warehouseId: 1,
    password: "distributor123",
  },
  {
    id: 106,
    tenantId: 1,
    name: "Ananya Roy (Partner)",
    email: "partner@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: false,
    role: "partner",
    roleLabel: "Partner",
    partnerId: 1,
    password: "partner123",
  },
  {
    id: 103,
    tenantId: 1,
    name: "Rajesh Kumar (Store Manager)",
    email: "store.delhi@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: false,
    role: "store_manager",
    roleLabel: "Store Manager",
    storeId: 1,
    password: "manager123",
  },
  {
    id: 104,
    tenantId: 1,
    name: "Pooja Verma (Store Associate)",
    email: "associate@grocerycrm.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isSuperAdmin: false,
    role: "store_associate",
    roleLabel: "Store Associate",
    storeId: 1,
    password: "associate123",
  },
];

// Global in-memory store for custom created dummy users during server runtime
const globalCustomUsers: DummyUser[] = [];

export function registerCustomDummyUser(user: Omit<DummyUser, "id"> & { id?: number }): DummyUser {
  const newId = user.id || Math.floor(Math.random() * 899999) + 100000;
  const newUser: DummyUser = {
    ...user,
    id: newId,
    avatarUrl: user.avatarUrl || null,
    password: user.password || "password123",
  };
  globalCustomUsers.push(newUser);
  return newUser;
}

export function findDummyUserByEmail(email: string): DummyUser | undefined {
  const norm = email.trim().toLowerCase();
  return (
    globalCustomUsers.find((u) => u.email.toLowerCase() === norm) ||
    DEFAULT_DUMMY_USERS.find((u) => u.email.toLowerCase() === norm)
  );
}

export function getAllDummyUsers(): DummyUser[] {
  return [...DEFAULT_DUMMY_USERS, ...globalCustomUsers];
}
