import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  ENUMS & TYPES                                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "brand",
  "distributor",
  "partner",
  "store_manager",
  "store_associate",
]);

export const storeTypeEnum = pgEnum("store_type", [
  "tenant",
  "region",
  "store",
  "warehouse",
  "counter",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Wallet",
  "Net Banking",
]);

export const customerSegmentEnum = pgEnum("customer_segment", [
  "Champion",
  "Loyal",
  "Developing",
  "At Risk",
  "Churned",
  "New",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "SALE",
  "RETURN",
  "GRN",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "ADJUSTMENT",
  "WASTAGE",
  "DAMAGE",
  "SHELF_REPLENISHMENT",
]);

export const auditActionTypeEnum = pgEnum("audit_action_type", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "SALE",
  "RETURN",
  "TRANSFER",
  "GRN",
  "ADJUSTMENT",
  "PRICE_CHANGE",
  "PROMOTION_START",
  "PROMOTION_END",
  "EXPIRY_MARKDOWN",
  "LOGIN",
  "LOGOUT",
  "BARCODE_SCAN",
  "REORDER_TRIGGER",
  "API_CALL",
]);

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  DIMENSION TABLES (Kimball Star Schema)                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Pre-populated Date Dimension for analytics rollups, day-of-week cyclical
 * features, and multi-horizon forecasts.
 */
export const dimDate = pgTable("dim_date", {
  dateKey: integer("date_key").primaryKey(), // YYYYMMDD
  fullDate: varchar("full_date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  year: integer("year").notNull(),
  quarter: integer("quarter").notNull(),
  month: integer("month").notNull(),
  monthName: varchar("month_name", { length: 15 }).notNull(),
  weekOfYear: integer("week_of_year").notNull(),
  dayOfMonth: integer("day_of_month").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Mon, 6 = Sun
  dayName: varchar("day_name", { length: 10 }).notNull(),
  isWeekend: integer("is_weekend").notNull().default(0),
  isPayday: integer("is_payday").notNull().default(0),
  fiscalQuarter: integer("fiscal_quarter").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
});

/**
 * Store / Warehouse / Regional Hierarchy.
 */
export const dimStore = pgTable("dim_store", {
  storeId: serial("store_id").primaryKey(),
  storeName: varchar("store_name", { length: 150 }).notNull(),
  storeType: storeTypeEnum("store_type").notNull().default("store"),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pinCode: varchar("pin_code", { length: 20 }),
  parentId: integer("parent_id"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  openedDate: varchar("opened_date", { length: 10 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Category & Taxonomy Dimension.
 */
export const dimCategory = pgTable("dim_category", {
  categoryId: serial("category_id").primaryKey(),
  categoryName: varchar("category_name", { length: 100 }).notNull().unique(),
  parentCategory: varchar("parent_category", { length: 100 }),
  department: varchar("department", { length: 100 }).notNull().default("Grocery"),
  isPerishable: boolean("is_perishable").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Supplier Dimension with performance SLA & Lead Time history.
 */
export const dimSupplier = pgTable("dim_supplier", {
  supplierId: serial("supplier_id").primaryKey(),
  supplierName: varchar("supplier_name", { length: 150 }).notNull(),
  companyName: varchar("company_name", { length: 200 }),
  region: varchar("region", { length: 100 }),
  gstin: varchar("gstin", { length: 30 }),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  leadTimeDays: real("lead_time_days").notNull().default(3.0),
  fillRate: real("fill_rate").notNull().default(0.95),
  reliabilityPct: real("reliability_pct").notNull().default(95.0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Product Master Dimension (SCD Type 2 with historical pricing / margin tracking).
 */
export const dimProduct = pgTable(
  "dim_product",
  {
    productKey: serial("product_key").primaryKey(), // Surrogate key
    productId: integer("product_id").notNull(), // Natural business ID
    skuCode: varchar("sku_code", { length: 80 }).notNull(),
    productName: varchar("product_name", { length: 200 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    categoryId: integer("category_id").references(() => dimCategory.categoryId),
    supplierId: integer("supplier_id").references(() => dimSupplier.supplierId),
    unitPrice: real("unit_price").notNull(),
    purchasePrice: real("purchase_price").notNull(),
    marginPct: real("margin_pct").notNull(),
    lowThreshold: integer("low_threshold").notNull().default(20),
    warehouseLoc: varchar("warehouse_loc", { length: 100 }),
    batch: varchar("batch", { length: 50 }),
    mfgDate: varchar("mfg_date", { length: 30 }),
    expiryDate: varchar("expiry_date", { length: 30 }),
    // SCD Type 2
    validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_dim_product_natural").on(table.productId, table.isCurrent),
    index("idx_dim_product_category").on(table.categoryId),
    index("idx_dim_product_supplier").on(table.supplierId),
    index("idx_dim_product_sku").on(table.skuCode),
  ]
);

/**
 * Customer Dimension with RFM & Lifetime Value.
 */
export const dimCustomer = pgTable(
  "dim_customer",
  {
    customerId: integer("customer_id").primaryKey(),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 150 }),
    storeName: varchar("store_name", { length: 100 }),
    segment: customerSegmentEnum("segment").notNull().default("New"),
    lifetimeValue: real("lifetime_value").notNull().default(0.0),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpend: real("total_spend").notNull().default(0.0),
    avgOrderValue: real("avg_order_value").notNull().default(0.0),
    firstPurchase: varchar("first_purchase", { length: 30 }),
    lastPurchase: varchar("last_purchase", { length: 30 }),
    recencyDays: integer("recency_days").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_dim_customer_segment").on(table.segment),
    index("idx_dim_customer_spend").on(table.totalSpend),
  ]
);

/**
 * Employee & User Master Dimension.
 */
export const dimEmployee = pgTable("dim_employee", {
  employeeId: serial("employee_id").primaryKey(),
  employeeName: varchar("employee_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }),
  role: userRoleEnum("role").notNull().default("store_associate"),
  storeId: integer("store_id").references(() => dimStore.storeId),
  department: varchar("department", { length: 100 }).notNull().default("Operations"),
  hireDate: varchar("hire_date", { length: 30 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  FACT TABLES (Immutable Append-Only Ledger)                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Every sales transaction line item with full pricing & margin context.
 */
export const factSales = pgTable(
  "fact_sales",
  {
    saleId: serial("sale_id").primaryKey(),
    orderId: integer("order_id").notNull(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    customerId: integer("customer_id").references(() => dimCustomer.customerId),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    employeeId: integer("employee_id").references(() => dimEmployee.employeeId),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: real("unit_price").notNull(),
    lineTotal: real("line_total").notNull(),
    costPrice: real("cost_price").notNull().default(0),
    grossMargin: real("gross_margin").notNull().default(0),
    discountAmount: real("discount_amount").notNull().default(0),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("UPI"),
    season: varchar("season", { length: 50 }).notNull().default("regular"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_sales_date").on(table.dateKey),
    index("idx_fact_sales_product").on(table.productKey),
    index("idx_fact_sales_customer").on(table.customerId),
    index("idx_fact_sales_store").on(table.storeId),
    index("idx_fact_sales_order").on(table.orderId),
    index("idx_fact_sales_composite").on(table.dateKey, table.storeId, table.productKey),
  ]
);

/**
 * Daily Inventory Position & Cover Snapshots per SKU / Store.
 */
export const factInventorySnapshot = pgTable(
  "fact_inventory_snapshot",
  {
    snapshotId: serial("snapshot_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    onHandQty: integer("on_hand_qty").notNull().default(0),
    committedQty: integer("committed_qty").notNull().default(0),
    availableQty: integer("available_qty").notNull().default(0),
    lowThreshold: integer("low_threshold").notNull().default(20),
    daysOfCover: real("days_of_cover").notNull().default(0),
    stockoutRisk: real("stockout_risk").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_inv_date_prod").on(table.dateKey, table.productKey),
    index("idx_fact_inv_store").on(table.storeId),
  ]
);

/**
 * Stock In / Out / Transfer / GRN / Wastage Ledger.
 */
export const factStockMovement = pgTable(
  "fact_stock_movement",
  {
    movementId: serial("movement_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    movementType: stockMovementTypeEnum("movement_type").notNull(),
    quantity: integer("quantity").notNull(),
    qtyBefore: integer("qty_before"),
    qtyAfter: integer("qty_after"),
    referenceId: varchar("reference_id", { length: 100 }),
    reason: text("reason"),
    employeeId: integer("employee_id").references(() => dimEmployee.employeeId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_stock_date").on(table.dateKey),
    index("idx_fact_stock_product").on(table.productKey),
    index("idx_fact_stock_type").on(table.movementType),
  ]
);

/**
 * Walk-in Footfall & Conversion Funnel Events.
 */
export const factWalkin = pgTable(
  "fact_walkin",
  {
    walkinId: serial("walkin_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    customerId: integer("customer_id").references(() => dimCustomer.customerId),
    employeeId: integer("employee_id").references(() => dimEmployee.employeeId),
    status: varchar("status", { length: 50 }).notNull().default("browsing"), // won, lost, browsing
    outcome: text("outcome"),
    budgetBand: varchar("budget_band", { length: 50 }),
    itemsViewed: integer("items_viewed").notNull().default(0),
    basketValue: real("basket_value").notNull().default(0),
    visitDuration: integer("visit_duration"), // minutes
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_walkin_date").on(table.dateKey),
    index("idx_fact_walkin_store").on(table.storeId),
  ]
);

/**
 * Purchase Orders & Supplier Deliveries.
 */
export const factPurchaseOrder = pgTable(
  "fact_purchase_order",
  {
    poId: serial("po_id").primaryKey(),
    poNumber: varchar("po_number", { length: 80 }).notNull(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    supplierId: integer("supplier_id").notNull().references(() => dimSupplier.supplierId),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    orderedQty: integer("ordered_qty").notNull(),
    receivedQty: integer("received_qty").notNull().default(0),
    unitCost: real("unit_cost").notNull(),
    totalCost: real("total_cost").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    expectedDate: varchar("expected_date", { length: 30 }),
    receivedDate: varchar("received_date", { length: 30 }),
    leadTimeDays: real("lead_time_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_po_date").on(table.dateKey),
    index("idx_fact_po_supplier").on(table.supplierId),
  ]
);

/**
 * Customer Returns & Refund Reasons.
 */
export const factReturn = pgTable(
  "fact_return",
  {
    returnId: serial("return_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    originalSaleId: integer("original_sale_id"),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    customerId: integer("customer_id").references(() => dimCustomer.customerId),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    quantity: integer("quantity").notNull(),
    refundAmount: real("refund_amount").notNull(),
    reason: varchar("reason", { length: 150 }).notNull().default("defective"),
    returnType: varchar("return_type", { length: 50 }).notNull().default("refund"),
    employeeId: integer("employee_id").references(() => dimEmployee.employeeId),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_return_date").on(table.dateKey),
    index("idx_fact_return_prod").on(table.productKey),
  ]
);

/**
 * Batch Expiry Tracking & Markdown Salvage.
 */
export const factExpiryEvent = pgTable(
  "fact_expiry_event",
  {
    expiryId: serial("expiry_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    batch: varchar("batch", { length: 50 }).notNull(),
    expiryDate: varchar("expiry_date", { length: 30 }).notNull(),
    daysToExpiry: integer("days_to_expiry").notNull(),
    quantityAtRisk: integer("quantity_at_risk").notNull(),
    actionTaken: varchar("action_taken", { length: 50 }),
    markdownPct: real("markdown_pct"),
    recoveredValue: real("recovered_value").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_expiry_date").on(table.dateKey),
    index("idx_fact_expiry_prod").on(table.productKey),
  ]
);

/**
 * Promotion Campaigns & Lift Effectiveness.
 */
export const factPromotion = pgTable("fact_promotion", {
  promoId: serial("promo_id").primaryKey(),
  promoName: varchar("promo_name", { length: 150 }).notNull(),
  dateKeyStart: integer("date_key_start").notNull().references(() => dimDate.dateKey),
  dateKeyEnd: integer("date_key_end").notNull(),
  productKey: integer("product_key").references(() => dimProduct.productKey),
  categoryId: integer("category_id").references(() => dimCategory.categoryId),
  storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
  discountType: varchar("discount_type", { length: 50 }).notNull().default("percentage"),
  discountValue: real("discount_value").notNull(),
  baselineSales: real("baseline_sales").notNull().default(0),
  actualSales: real("actual_sales").notNull().default(0),
  liftPct: real("lift_pct").notNull().default(0),
  redemptions: integer("redemptions").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Employee Shift, Scan, and Activity Telemetry.
 */
export const factEmployeeActivity = pgTable(
  "fact_employee_activity",
  {
    activityId: serial("activity_id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    employeeId: integer("employee_id").notNull().references(() => dimEmployee.employeeId),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    sessionId: varchar("session_id", { length: 100 }),
    deviceInfo: varchar("device_info", { length: 150 }),
    ipAddress: varchar("ip_address", { length: 50 }),
    durationMin: integer("duration_min"),
    itemsProcessed: integer("items_processed").notNull().default(0),
    revenueHandled: real("revenue_handled").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_fact_emp_date").on(table.dateKey),
    index("idx_fact_emp_employee").on(table.employeeId),
  ]
);

/**
 * Universal Change Data Capture (CDC) & Audit Trail.
 * Captures all business mutations, before/after JSON states, and metadata.
 */
export const factAuditLog = pgTable(
  "fact_audit_log",
  {
    auditId: serial("audit_id").primaryKey(),
    eventTimestamp: timestamp("event_timestamp", { withTimezone: true }).defaultNow().notNull(),
    dateKey: integer("date_key").notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    userRole: varchar("user_role", { length: 50 }),
    userEmail: varchar("user_email", { length: 150 }),
    sessionId: varchar("session_id", { length: 100 }),
    storeId: integer("store_id"),
    deviceInfo: varchar("device_info", { length: 200 }),
    // Change Data Capture
    beforeSnapshot: jsonb("before_snapshot"),
    afterSnapshot: jsonb("after_snapshot"),
    qtyBefore: integer("qty_before"),
    qtyAfter: integer("qty_after"),
    priceBefore: real("price_before"),
    priceAfter: real("price_after"),
    invBefore: integer("inv_before"),
    invAfter: integer("inv_after"),
    ipAddress: varchar("ip_address", { length: 50 }),
    endpoint: varchar("endpoint", { length: 200 }),
    httpMethod: varchar("http_method", { length: 10 }),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_audit_date").on(table.dateKey),
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_action").on(table.actionType),
    index("idx_audit_ts").on(table.eventTimestamp),
  ]
);

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  MATERIALIZED AGGREGATION TABLES                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const aggDailySales = pgTable(
  "agg_daily_sales",
  {
    id: serial("id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    categoryId: integer("category_id").references(() => dimCategory.categoryId),
    totalRevenue: real("total_revenue").notNull().default(0),
    totalUnits: integer("total_units").notNull().default(0),
    totalOrders: integer("total_orders").notNull().default(0),
    totalMargin: real("total_margin").notNull().default(0),
    avgOrderValue: real("avg_order_value").notNull().default(0),
    uniqueCustomers: integer("unique_customers").notNull().default(0),
    returnCount: integer("return_count").notNull().default(0),
    returnValue: real("return_value").notNull().default(0),
    discountGiven: real("discount_given").notNull().default(0),
    footfall: integer("footfall").notNull().default(0),
    conversionPct: real("conversion_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_agg_daily_date").on(table.dateKey),
    uniqueIndex("uniq_agg_daily").on(table.dateKey, table.storeId, table.categoryId),
  ]
);

export const aggWeeklyPerformance = pgTable(
  "agg_weekly_performance",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    week: integer("week").notNull(),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    totalRevenue: real("total_revenue").notNull().default(0),
    totalUnits: integer("total_units").notNull().default(0),
    totalOrders: integer("total_orders").notNull().default(0),
    totalMargin: real("total_margin").notNull().default(0),
    avgDailyRevenue: real("avg_daily_revenue").notNull().default(0),
    wowRevenueDelta: real("wow_revenue_delta").notNull().default(0),
    wowUnitsDelta: real("wow_units_delta").notNull().default(0),
    topCategory: varchar("top_category", { length: 100 }),
    stockoutEvents: integer("stockout_events").notNull().default(0),
    reorderEvents: integer("reorder_events").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_agg_weekly").on(table.year, table.week, table.storeId),
  ]
);

export const aggMonthlySummary = pgTable(
  "agg_monthly_summary",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    totalRevenue: real("total_revenue").notNull().default(0),
    totalCost: real("total_cost").notNull().default(0),
    grossProfit: real("gross_profit").notNull().default(0),
    grossMarginPct: real("gross_margin_pct").notNull().default(0),
    totalUnits: integer("total_units").notNull().default(0),
    totalOrders: integer("total_orders").notNull().default(0),
    uniqueCustomers: integer("unique_customers").notNull().default(0),
    newCustomers: integer("new_customers").notNull().default(0),
    avgBasketSize: real("avg_basket_size").notNull().default(0),
    returnRatePct: real("return_rate_pct").notNull().default(0),
    wastageValue: real("wastage_value").notNull().default(0),
    stockoutDays: integer("stockout_days").notNull().default(0),
    topSkuId: integer("top_sku_id"),
    topSkuRevenue: real("top_sku_revenue").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_agg_monthly").on(table.year, table.month, table.storeId),
  ]
);

export const aggYearlySummary = pgTable(
  "agg_yearly_summary",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    totalRevenue: real("total_revenue").notNull().default(0),
    totalCost: real("total_cost").notNull().default(0),
    grossProfit: real("gross_profit").notNull().default(0),
    totalUnits: integer("total_units").notNull().default(0),
    totalOrders: integer("total_orders").notNull().default(0),
    uniqueCustomers: integer("unique_customers").notNull().default(0),
    yoyRevenueGrowth: real("yoy_revenue_growth").notNull().default(0),
    avgMonthlyRevenue: real("avg_monthly_revenue").notNull().default(0),
    bestMonth: integer("best_month"),
    bestMonthRevenue: real("best_month_revenue").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_agg_yearly").on(table.year, table.storeId),
  ]
);

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  ML FEATURE TABLES                                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export const mlFeatureDaily = pgTable(
  "ml_feature_daily",
  {
    id: serial("id").primaryKey(),
    dateKey: integer("date_key").notNull().references(() => dimDate.dateKey),
    storeId: integer("store_id").notNull().default(1).references(() => dimStore.storeId),
    targetRevenue: real("target_revenue").notNull().default(0),
    lag1d: real("lag_1d"),
    lag7d: real("lag_7d"),
    lag14d: real("lag_14d"),
    lag30d: real("lag_30d"),
    rollingMean7: real("rolling_mean_7"),
    rollingStd7: real("rolling_std_7"),
    rollingMean14: real("rolling_mean_14"),
    rollingMean30: real("rolling_mean_30"),
    velocity7d: real("velocity_7d"),
    acceleration: real("acceleration"),
    dowSin: real("dow_sin"),
    dowCos: real("dow_cos"),
    isWeekend: integer("is_weekend"),
    isPayday: integer("is_payday"),
    monthSin: real("month_sin"),
    monthCos: real("month_cos"),
    orderCount: integer("order_count"),
    uniqueSkus: integer("unique_skus"),
    avgBasket: real("avg_basket"),
    stockoutSkus: integer("stockout_skus").notNull().default(0),
    avgDaysCover: real("avg_days_cover").notNull().default(0),
  },
  (table) => [
    uniqueIndex("uniq_ml_feature_daily").on(table.dateKey, table.storeId),
    index("idx_ml_feature_date").on(table.dateKey),
  ]
);

export const mlFeatureSku = pgTable(
  "ml_feature_sku",
  {
    id: serial("id").primaryKey(),
    productKey: integer("product_key").notNull().references(() => dimProduct.productKey),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
    avgDailyVelocity: real("avg_daily_velocity").notNull().default(0),
    velocity7d: real("velocity_7d").notNull().default(0),
    velocity30d: real("velocity_30d").notNull().default(0),
    currentStock: integer("current_stock").notNull().default(0),
    daysOfCover: real("days_of_cover").notNull().default(0),
    stockoutProb: real("stockout_prob").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(0),
    priceElasticity: real("price_elasticity").notNull().default(-1.0),
    marginPct: real("margin_pct").notNull().default(0),
    revenueRank: integer("revenue_rank"),
    velocityRank: integer("velocity_rank"),
  },
  (table) => [
    uniqueIndex("uniq_ml_feature_sku").on(table.productKey),
  ]
);
