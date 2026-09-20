import "next-auth";
import "next-auth/jwt";
import type { GroceryRole } from "@/lib/retail/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      tenantId: number;
      name: string;
      email: string;
      avatarUrl: string | null;
      isSuperAdmin: boolean;
      role?: GroceryRole;
      storeId?: number | null;
      warehouseId?: number | null;
      partnerId?: number | null;
      brandId?: number | null;
      territoryId?: number | null;
    };
  }

  interface User {
    id: number;
    tenantId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    isSuperAdmin: boolean;
    role?: GroceryRole;
    storeId?: number | null;
    warehouseId?: number | null;
    partnerId?: number | null;
    brandId?: number | null;
    territoryId?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: number;
    tenantId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    isSuperAdmin: boolean;
    role?: GroceryRole;
    storeId?: number | null;
    warehouseId?: number | null;
    partnerId?: number | null;
    brandId?: number | null;
    territoryId?: number | null;
  }
}
