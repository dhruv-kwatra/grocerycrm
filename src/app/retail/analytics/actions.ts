"use server";

import { apiGet } from "@/lib/api/server";

// Fetch the sales CSV (server-side, authenticated). The client turns it into a
// Blob download — avoids a browser→backend auth hop.
export async function getSalesCsv(period: string): Promise<{ filename: string; csv: string }> {
  return apiGet<{ filename: string; csv: string }>(`/api/retail/analytics/export?type=sales&period=${encodeURIComponent(period)}`);
}
