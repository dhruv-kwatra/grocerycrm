-- ============================================================================
-- GroceryCRM AI Data Warehouse — Star Schema DDL
-- ============================================================================
-- SQLite-compatible (production: PostgreSQL with partitioning).
-- Design: Kimball Star Schema with SCD Type 2 dimensions, append-only facts,
--         and materialized aggregation tables.
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA synchronous  = NORMAL;
PRAGMA foreign_keys = ON;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  DIMENSION TABLES                                                        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ── dim_date ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_date (
    date_key        INTEGER PRIMARY KEY,          -- YYYYMMDD integer
    full_date       TEXT    NOT NULL UNIQUE,       -- ISO 8601
    year            INTEGER NOT NULL,
    quarter         INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    month_name      TEXT    NOT NULL,
    week_of_year    INTEGER NOT NULL,
    day_of_month    INTEGER NOT NULL,
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon
    day_name        TEXT    NOT NULL,
    is_weekend      INTEGER NOT NULL DEFAULT 0,
    is_payday       INTEGER NOT NULL DEFAULT 0,   -- 1st-5th or 25th-31st
    fiscal_quarter  INTEGER NOT NULL,
    fiscal_year     INTEGER NOT NULL
);

-- ── dim_store ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_store (
    store_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name      TEXT    NOT NULL,
    store_type      TEXT    NOT NULL DEFAULT 'store', -- store | warehouse | region | tenant
    region          TEXT,
    city            TEXT,
    state           TEXT,
    pin_code        TEXT,
    parent_id       INTEGER REFERENCES dim_store(store_id),
    latitude        REAL,
    longitude       REAL,
    opened_date     TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── dim_category ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_category (
    category_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name   TEXT    NOT NULL UNIQUE,
    parent_category TEXT,
    department      TEXT    NOT NULL DEFAULT 'Grocery',
    is_perishable   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── dim_supplier ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_supplier (
    supplier_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name   TEXT    NOT NULL,
    company_name    TEXT,
    region          TEXT,
    gstin           TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    lead_time_days  REAL    NOT NULL DEFAULT 3.0,
    fill_rate       REAL    NOT NULL DEFAULT 0.95,
    reliability_pct REAL    NOT NULL DEFAULT 95.0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── dim_product (SCD Type 2) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_product (
    product_key     INTEGER PRIMARY KEY AUTOINCREMENT,  -- surrogate key
    product_id      INTEGER NOT NULL,                   -- natural business key
    sku_code        TEXT    NOT NULL,
    product_name    TEXT    NOT NULL,
    brand           TEXT,
    category_id     INTEGER REFERENCES dim_category(category_id),
    supplier_id     INTEGER REFERENCES dim_supplier(supplier_id),
    unit_price      REAL    NOT NULL,
    purchase_price  REAL    NOT NULL,
    margin_pct      REAL    NOT NULL,
    low_threshold   INTEGER NOT NULL DEFAULT 20,
    warehouse_loc   TEXT,
    batch           TEXT,
    mfg_date        TEXT,
    expiry_date     TEXT,
    -- SCD Type 2 fields
    valid_from      TEXT    NOT NULL DEFAULT (datetime('now')),
    valid_to        TEXT    DEFAULT '9999-12-31',
    is_current      INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dim_product_natural ON dim_product(product_id, is_current);
CREATE INDEX IF NOT EXISTS idx_dim_product_category ON dim_product(category_id);
CREATE INDEX IF NOT EXISTS idx_dim_product_supplier ON dim_product(supplier_id);

-- ── dim_customer ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_customer (
    customer_id     INTEGER PRIMARY KEY,
    customer_name   TEXT    NOT NULL,
    phone           TEXT,
    email           TEXT,
    store_name      TEXT,
    segment         TEXT    NOT NULL DEFAULT 'New',      -- Champion, Loyal, At Risk, Churned, New
    lifetime_value  REAL    NOT NULL DEFAULT 0.0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_spend     REAL    NOT NULL DEFAULT 0.0,
    avg_order_value REAL    NOT NULL DEFAULT 0.0,
    first_purchase  TEXT,
    last_purchase   TEXT,
    recency_days    INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dim_customer_segment ON dim_customer(segment);

-- ── dim_employee ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dim_employee (
    employee_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name   TEXT    NOT NULL,
    email           TEXT,
    role            TEXT    NOT NULL,   -- superadmin, brand, distributor, partner, store_manager, store_associate
    store_id        INTEGER REFERENCES dim_store(store_id),
    department      TEXT    NOT NULL DEFAULT 'Operations',
    hire_date       TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  FACT TABLES  (append-only, immutable)                                   ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ── fact_sales ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_sales (
    sale_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    customer_id     INTEGER REFERENCES dim_customer(customer_id),
    store_id        INTEGER NOT NULL DEFAULT 1,
    employee_id     INTEGER,
    quantity         INTEGER NOT NULL DEFAULT 1,
    unit_price      REAL    NOT NULL,
    line_total      REAL    NOT NULL,
    cost_price      REAL    NOT NULL DEFAULT 0,
    gross_margin    REAL    NOT NULL DEFAULT 0,
    discount_amount REAL    NOT NULL DEFAULT 0,
    payment_method  TEXT    NOT NULL DEFAULT 'UPI',
    season          TEXT    NOT NULL DEFAULT 'regular',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_sales_date     ON fact_sales(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_product  ON fact_sales(product_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_customer ON fact_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_store    ON fact_sales(store_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_order    ON fact_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_composite ON fact_sales(date_key, store_id, product_key);

-- ── fact_inventory_snapshot ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_inventory_snapshot (
    snapshot_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    on_hand_qty     INTEGER NOT NULL DEFAULT 0,
    committed_qty   INTEGER NOT NULL DEFAULT 0,
    available_qty   INTEGER NOT NULL DEFAULT 0,
    low_threshold   INTEGER NOT NULL DEFAULT 20,
    days_of_cover   REAL    NOT NULL DEFAULT 0,
    stockout_risk   REAL    NOT NULL DEFAULT 0,   -- 0.0–1.0 probability
    reorder_point   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_inv_date_product ON fact_inventory_snapshot(date_key, product_key);
CREATE INDEX IF NOT EXISTS idx_fact_inv_store        ON fact_inventory_snapshot(store_id);

-- ── fact_stock_movement ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_stock_movement (
    movement_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    movement_type   TEXT    NOT NULL,  -- SALE, RETURN, GRN, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT, WASTAGE, DAMAGE
    quantity         INTEGER NOT NULL,
    qty_before      INTEGER,
    qty_after       INTEGER,
    reference_id    TEXT,              -- order_id, PO number, transfer number, etc.
    reason          TEXT,
    employee_id     INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_stock_date    ON fact_stock_movement(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_stock_product ON fact_stock_movement(product_key);
CREATE INDEX IF NOT EXISTS idx_fact_stock_type    ON fact_stock_movement(movement_type);

-- ── fact_price_change (CDC) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_price_change (
    change_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    old_price       REAL    NOT NULL,
    new_price       REAL    NOT NULL,
    old_margin_pct  REAL,
    new_margin_pct  REAL,
    change_reason   TEXT    NOT NULL DEFAULT 'market_adjustment',
    changed_by      INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_purchase_order ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_purchase_order (
    po_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number       TEXT    NOT NULL,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    supplier_id     INTEGER NOT NULL REFERENCES dim_supplier(supplier_id),
    store_id        INTEGER NOT NULL DEFAULT 1,
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    ordered_qty     INTEGER NOT NULL,
    received_qty    INTEGER NOT NULL DEFAULT 0,
    unit_cost       REAL    NOT NULL,
    total_cost      REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending',  -- pending, partial, fulfilled, cancelled
    expected_date   TEXT,
    received_date   TEXT,
    lead_time_days  REAL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_po_date     ON fact_purchase_order(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_po_supplier ON fact_purchase_order(supplier_id);
CREATE INDEX IF NOT EXISTS idx_fact_po_status   ON fact_purchase_order(status);

-- ── fact_walkin ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_walkin (
    walkin_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    customer_id     INTEGER REFERENCES dim_customer(customer_id),
    employee_id     INTEGER,
    status          TEXT    NOT NULL DEFAULT 'browsing', -- browsing, engaged, won, lost
    outcome         TEXT,
    budget_band     TEXT,
    items_viewed    INTEGER NOT NULL DEFAULT 0,
    basket_value    REAL    NOT NULL DEFAULT 0,
    visit_duration  INTEGER,  -- minutes
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_walkin_date  ON fact_walkin(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_walkin_store ON fact_walkin(store_id);

-- ── fact_return ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_return (
    return_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    original_sale_id INTEGER,
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    customer_id     INTEGER,
    store_id        INTEGER NOT NULL DEFAULT 1,
    quantity         INTEGER NOT NULL,
    refund_amount   REAL    NOT NULL,
    reason          TEXT    NOT NULL DEFAULT 'defective',
    return_type     TEXT    NOT NULL DEFAULT 'refund',  -- refund, exchange, credit
    employee_id     INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_expiry_event ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_expiry_event (
    expiry_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    batch           TEXT    NOT NULL,
    expiry_date     TEXT    NOT NULL,
    days_to_expiry  INTEGER NOT NULL,
    quantity_at_risk INTEGER NOT NULL,
    action_taken    TEXT,  -- markdown, donate, destroy, transfer
    markdown_pct    REAL,
    recovered_value REAL   NOT NULL DEFAULT 0,
    created_at      TEXT   NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_wastage ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_wastage (
    wastage_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    quantity         INTEGER NOT NULL,
    value_lost      REAL    NOT NULL,
    wastage_type    TEXT    NOT NULL DEFAULT 'expired',  -- expired, damaged, shrinkage, spillage
    reason          TEXT,
    employee_id     INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_promotion ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_promotion (
    promo_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    promo_name      TEXT    NOT NULL,
    date_key_start  INTEGER NOT NULL REFERENCES dim_date(date_key),
    date_key_end    INTEGER NOT NULL,
    product_key     INTEGER REFERENCES dim_product(product_key),
    category_id     INTEGER REFERENCES dim_category(category_id),
    store_id        INTEGER NOT NULL DEFAULT 1,
    discount_type   TEXT    NOT NULL DEFAULT 'percentage', -- percentage, flat, bogo, bundle
    discount_value  REAL    NOT NULL,
    baseline_sales  REAL    NOT NULL DEFAULT 0,
    actual_sales    REAL    NOT NULL DEFAULT 0,
    lift_pct        REAL    NOT NULL DEFAULT 0,
    redemptions     INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_reorder_event ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_reorder_event (
    reorder_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    product_key     INTEGER NOT NULL REFERENCES dim_product(product_key),
    store_id        INTEGER NOT NULL DEFAULT 1,
    supplier_id     INTEGER REFERENCES dim_supplier(supplier_id),
    trigger_type    TEXT    NOT NULL DEFAULT 'auto',  -- auto, manual, ai_recommended
    current_stock   INTEGER NOT NULL,
    reorder_qty     INTEGER NOT NULL,
    estimated_cost  REAL    NOT NULL DEFAULT 0,
    po_id           INTEGER REFERENCES fact_purchase_order(po_id),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── fact_employee_activity ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_employee_activity (
    activity_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL REFERENCES dim_date(date_key),
    employee_id     INTEGER NOT NULL REFERENCES dim_employee(employee_id),
    store_id        INTEGER NOT NULL DEFAULT 1,
    activity_type   TEXT    NOT NULL,  -- LOGIN, LOGOUT, SHIFT_START, SHIFT_END, BREAK, SALE, WALKIN, SCAN
    session_id      TEXT,
    device_info     TEXT,
    ip_address      TEXT,
    duration_min    INTEGER,
    items_processed INTEGER NOT NULL DEFAULT 0,
    revenue_handled REAL    NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fact_emp_date     ON fact_employee_activity(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_emp_employee ON fact_employee_activity(employee_id);

-- ── fact_audit_log (Universal CDC) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_audit_log (
    audit_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    event_timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
    date_key        INTEGER NOT NULL,
    action_type     TEXT    NOT NULL,  -- CREATE, UPDATE, DELETE, SALE, RETURN, TRANSFER, GRN, ADJUSTMENT, LOGIN, SCAN, ...
    entity_type     TEXT    NOT NULL,  -- product, customer, order, inventory, po, walkin, employee, promotion, ...
    entity_id       TEXT,
    user_role       TEXT,
    user_email      TEXT,
    session_id      TEXT,
    store_id        INTEGER,
    device_info     TEXT,
    -- Change Data Capture fields
    before_snapshot TEXT,              -- JSON of entity state before mutation
    after_snapshot  TEXT,              -- JSON of entity state after mutation
    qty_before      INTEGER,
    qty_after       INTEGER,
    price_before    REAL,
    price_after     REAL,
    inv_before      INTEGER,
    inv_after       INTEGER,
    -- Context
    ip_address      TEXT,
    endpoint        TEXT,
    http_method     TEXT,
    metadata        TEXT               -- arbitrary JSON for future module extensibility
);
CREATE INDEX IF NOT EXISTS idx_audit_date        ON fact_audit_log(date_key);
CREATE INDEX IF NOT EXISTS idx_audit_entity      ON fact_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON fact_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp   ON fact_audit_log(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user        ON fact_audit_log(user_role);


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  AGGREGATION TABLES  (materialized, refreshed by ETL)                    ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ── agg_daily_sales ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agg_daily_sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL,
    store_id        INTEGER NOT NULL DEFAULT 1,
    category_id     INTEGER,
    total_revenue   REAL    NOT NULL DEFAULT 0,
    total_units     INTEGER NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_margin    REAL    NOT NULL DEFAULT 0,
    avg_order_value REAL    NOT NULL DEFAULT 0,
    unique_customers INTEGER NOT NULL DEFAULT 0,
    return_count    INTEGER NOT NULL DEFAULT 0,
    return_value    REAL    NOT NULL DEFAULT 0,
    discount_given  REAL    NOT NULL DEFAULT 0,
    footfall        INTEGER NOT NULL DEFAULT 0,
    conversion_pct  REAL    NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(date_key, store_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_agg_daily_date ON agg_daily_sales(date_key);

-- ── agg_weekly_performance ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agg_weekly_performance (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    year            INTEGER NOT NULL,
    week            INTEGER NOT NULL,
    store_id        INTEGER NOT NULL DEFAULT 1,
    total_revenue   REAL    NOT NULL DEFAULT 0,
    total_units     INTEGER NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_margin    REAL    NOT NULL DEFAULT 0,
    avg_daily_revenue REAL  NOT NULL DEFAULT 0,
    wow_revenue_delta REAL  NOT NULL DEFAULT 0,
    wow_units_delta   REAL  NOT NULL DEFAULT 0,
    top_category    TEXT,
    stockout_events INTEGER NOT NULL DEFAULT 0,
    reorder_events  INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(year, week, store_id)
);

-- ── agg_monthly_summary ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agg_monthly_summary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    store_id        INTEGER NOT NULL DEFAULT 1,
    total_revenue   REAL    NOT NULL DEFAULT 0,
    total_cost      REAL    NOT NULL DEFAULT 0,
    gross_profit    REAL    NOT NULL DEFAULT 0,
    gross_margin_pct REAL   NOT NULL DEFAULT 0,
    total_units     INTEGER NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    unique_customers INTEGER NOT NULL DEFAULT 0,
    new_customers   INTEGER NOT NULL DEFAULT 0,
    avg_basket_size REAL    NOT NULL DEFAULT 0,
    return_rate_pct REAL    NOT NULL DEFAULT 0,
    wastage_value   REAL    NOT NULL DEFAULT 0,
    stockout_days   INTEGER NOT NULL DEFAULT 0,
    top_sku_id      INTEGER,
    top_sku_revenue REAL    NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(year, month, store_id)
);

-- ── agg_yearly_summary ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agg_yearly_summary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    year            INTEGER NOT NULL,
    store_id        INTEGER NOT NULL DEFAULT 1,
    total_revenue   REAL    NOT NULL DEFAULT 0,
    total_cost      REAL    NOT NULL DEFAULT 0,
    gross_profit    REAL    NOT NULL DEFAULT 0,
    total_units     INTEGER NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    unique_customers INTEGER NOT NULL DEFAULT 0,
    yoy_revenue_growth REAL NOT NULL DEFAULT 0,
    avg_monthly_revenue REAL NOT NULL DEFAULT 0,
    best_month      INTEGER,
    best_month_revenue REAL NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(year, store_id)
);


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  ML FEATURE TABLES  (computed by feature pipeline)                       ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS ml_feature_daily (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date_key        INTEGER NOT NULL,
    store_id        INTEGER NOT NULL DEFAULT 1,
    -- Target
    target_revenue  REAL    NOT NULL DEFAULT 0,
    -- Lags
    lag_1d          REAL,
    lag_7d          REAL,
    lag_14d         REAL,
    lag_30d         REAL,
    -- Rolling stats
    rolling_mean_7  REAL,
    rolling_std_7   REAL,
    rolling_mean_14 REAL,
    rolling_mean_30 REAL,
    -- Velocity
    velocity_7d     REAL,
    acceleration    REAL,
    -- Calendar
    dow_sin         REAL,
    dow_cos         REAL,
    is_weekend      INTEGER,
    is_payday       INTEGER,
    month_sin       REAL,
    month_cos       REAL,
    -- Volume
    order_count     INTEGER,
    unique_skus     INTEGER,
    avg_basket      REAL,
    -- Inventory health
    stockout_skus   INTEGER NOT NULL DEFAULT 0,
    avg_days_cover  REAL    NOT NULL DEFAULT 0,
    UNIQUE(date_key, store_id)
);
CREATE INDEX IF NOT EXISTS idx_ml_feature_date ON ml_feature_daily(date_key);

CREATE TABLE IF NOT EXISTS ml_feature_sku (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_key     INTEGER NOT NULL,
    computed_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    -- Velocity
    avg_daily_velocity REAL NOT NULL DEFAULT 0,
    velocity_7d     REAL NOT NULL DEFAULT 0,
    velocity_30d    REAL NOT NULL DEFAULT 0,
    -- Stock health
    current_stock   INTEGER NOT NULL DEFAULT 0,
    days_of_cover   REAL NOT NULL DEFAULT 0,
    stockout_prob   REAL NOT NULL DEFAULT 0,
    reorder_point   INTEGER NOT NULL DEFAULT 0,
    -- Price
    price_elasticity REAL NOT NULL DEFAULT -1.0,
    margin_pct      REAL NOT NULL DEFAULT 0,
    -- Rank
    revenue_rank    INTEGER,
    velocity_rank   INTEGER,
    UNIQUE(product_key)
);
