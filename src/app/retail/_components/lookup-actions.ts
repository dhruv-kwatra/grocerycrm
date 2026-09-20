"use server";

import { apiGet } from "@/lib/api/server";

export type CustomerHit = { id: number; name: string | null; phone: string | null; segment: string | null; totalSpend: number; visits: number; lastPurchaseAt: string | null };
export type CustomerDetail = {
  customer: { id: number; name: string | null; phone: string | null; email: string | null; segment: string | null; storeName: string | null; categoryPref: string | null; createdAt: string | null };
  history: { id: number; skuName: string | null; units: number; revenue: string | null; billNo: string | null; soldAt: string | null }[];
};
export type StockHit = { nodeId: number; storeName: string | null; skuId: number; skuName: string | null; skuCode: string | null; onHand: number; lowThreshold: number };

export async function findCustomers(q: string): Promise<CustomerHit[]> {
  try {
    const r = await apiGet<{ customers: CustomerHit[] }>(`/api/retail/lookup/customers?q=${encodeURIComponent(q)}`);
    return r.customers;
  } catch { return []; }
}

export async function getCustomer(id: number): Promise<CustomerDetail | null> {
  try {
    return await apiGet<CustomerDetail>(`/api/retail/lookup/customers/${id}`);
  } catch { return null; }
}

export async function findStock(q: string): Promise<StockHit[]> {
  try {
    const r = await apiGet<{ stock: StockHit[] }>(`/api/retail/lookup/stock?q=${encodeURIComponent(q)}`);
    return r.stock;
  } catch { return []; }
}
