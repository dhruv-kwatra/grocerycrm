// GroceryCRM — shared frontend constants. Roles mirror the backend
// (grocery.access.ts). Scope is what GET /api/retail/scope returns.
export type GroceryRole = "brand" | "distributor" | "partner" | "store_manager" | "store_associate" | "superadmin";

/** @deprecated Use GroceryRole instead. Kept for incremental migration. */
export type RetailRole = GroceryRole;

export type GroceryScope =
  | { assigned: false }
  | {
      assigned: true;
      /** The user's grocery system role. */
      role: GroceryRole;
      /** Grocery store affinity. Set for store_manager and store_associate. */
      storeId: number | null;
      /** Warehouse affinity. Set for distributor; optionally for brand. */
      warehouseId: number | null;
      /** Partner / franchise affinity. Set for partner, store_manager, store_associate. */
      partnerId: number | null;
      /** Brand entity scope. Set for brand. */
      brandId: number | null;
      /** Territory node for geography-scoped views. */
      territoryId: number | null;
      /** Tree node identifier if assigned within hierarchy. */
      nodeId?: number | null;
      /** Materialized path in the organization tree. */
      path?: string | null;
      /** Tree depth. */
      depth?: number | null;
      /** If true, all mutations are rejected server-side (HTTP 403). */
      readOnly: boolean;
      /** If true, the guard skips role validation. Reserved for superadmin. */
      bypass: boolean;
    };

/** @deprecated Use GroceryScope instead. Kept for incremental migration. */
export type RetailScope = GroceryScope;

// Where each role lands when they open /retail.
export const ROLE_HOME: Record<GroceryRole, string> = {
  store_associate: "/retail/agent",
  store_manager: "/retail/manager/agents",
  brand: "/retail/estate",
  distributor: "/retail/distributor",
  partner: "/retail/partner",
  superadmin: "/retail/estate", // platform staff → the read-all estate view
};
