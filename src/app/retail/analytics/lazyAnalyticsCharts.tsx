"use client";

// recharts is heavy (~100kb gz incl. d3); code-split these so the chunk stays
// out of the analytics page's first load. Same pattern as the CRM dashboard's
// lazyCharts.tsx. A skeleton holds the layout until the chunk streams in.
import dynamic from "next/dynamic";

const skeleton = (height: number) =>
  function ChartSkeleton() {
    return <div className="w-full skeleton rounded-lg" style={{ height }} />;
  };

export const TopProductsChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.TopProductsChart), { ssr: false, loading: skeleton(200) });
export const ComplianceTrendChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.ComplianceTrendChart), { ssr: false, loading: skeleton(220) });
export const SegmentDonut = dynamic(() => import("./AnalyticsCharts").then((m) => m.SegmentDonut), { ssr: false, loading: skeleton(210) });
export const RevenueByChannelChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.RevenueByChannelChart), { ssr: false, loading: skeleton(200) });
export const StageConvChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.StageConvChart), { ssr: false, loading: skeleton(220) });
export const StoreScatter = dynamic(() => import("./AnalyticsCharts").then((m) => m.StoreScatter), { ssr: false, loading: skeleton(230) });
export const TrendAreaChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.TrendAreaChart), { ssr: false, loading: skeleton(200) });
export const WeeklyBarChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.WeeklyBarChart), { ssr: false, loading: skeleton(200) });
export const FunnelBarChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.FunnelBarChart), { ssr: false, loading: skeleton(230) });
export const SellThroughChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.SellThroughChart), { ssr: false, loading: skeleton(230) });
export const ComplianceByStoreChart = dynamic(() => import("./AnalyticsCharts").then((m) => m.ComplianceByStoreChart), { ssr: false, loading: skeleton(220) });
