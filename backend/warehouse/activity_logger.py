"""
GroceryCRM AI Data Warehouse — Universal CDC Activity Logger
=============================================================
Captures every business mutation (create, update, delete, sale, return, etc.)
as an immutable audit event in fact_audit_log.

Usage:
    from warehouse.activity_logger import ActivityLogger
    logger = ActivityLogger(warehouse)
    logger.log("CREATE", "product", "42", role="brand", after={"name": "New Tea"})
"""

import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional


class ActivityLogger:
    """Writes structured CDC events to the fact_audit_log table."""

    def __init__(self, warehouse):
        """
        Parameters
        ----------
        warehouse : DataWarehouse
            A live DataWarehouse instance (provides .conn).
        """
        self.warehouse = warehouse

    @property
    def conn(self) -> sqlite3.Connection:
        if not self.warehouse.conn:
            self.warehouse._connect()
        return self.warehouse.conn

    def log(
        self,
        action_type: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        *,
        user_role: Optional[str] = None,
        user_email: Optional[str] = None,
        session_id: Optional[str] = None,
        store_id: Optional[int] = None,
        device_info: Optional[str] = None,
        before: Optional[Dict[str, Any]] = None,
        after: Optional[Dict[str, Any]] = None,
        qty_before: Optional[int] = None,
        qty_after: Optional[int] = None,
        price_before: Optional[float] = None,
        price_after: Optional[float] = None,
        inv_before: Optional[int] = None,
        inv_after: Optional[int] = None,
        ip_address: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Write a single CDC event to fact_audit_log.

        Returns the audit_id of the inserted record.
        """
        now = datetime.utcnow()
        date_key = int(now.strftime("%Y%m%d"))
        event_ts = now.isoformat() + "Z"

        before_json = json.dumps(before, default=str) if before else None
        after_json = json.dumps(after, default=str) if after else None
        meta_json = json.dumps(metadata, default=str) if metadata else None

        cur = self.conn.execute(
            """INSERT INTO fact_audit_log
               (event_timestamp, date_key, action_type, entity_type, entity_id,
                user_role, user_email, session_id, store_id, device_info,
                before_snapshot, after_snapshot,
                qty_before, qty_after, price_before, price_after, inv_before, inv_after,
                ip_address, endpoint, http_method, metadata)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (event_ts, date_key, action_type.upper(), entity_type.lower(), str(entity_id) if entity_id else None,
             user_role, user_email, session_id, store_id, device_info,
             before_json, after_json,
             qty_before, qty_after, price_before, price_after, inv_before, inv_after,
             ip_address, endpoint, http_method, meta_json)
        )
        self.conn.commit()
        return cur.lastrowid

    def log_sale(self, order_id, customer_id=None, total=0, items=0, **kwargs):
        """Convenience: log a sale event."""
        return self.log(
            "SALE", "order", str(order_id),
            after={"customerId": customer_id, "total": total, "items": items},
            **kwargs
        )

    def log_stock_change(self, product_id, movement_type, qty_before, qty_after, **kwargs):
        """Convenience: log a stock movement."""
        return self.log(
            movement_type, "inventory", str(product_id),
            qty_before=qty_before, qty_after=qty_after,
            **kwargs
        )

    def log_price_change(self, product_id, old_price, new_price, **kwargs):
        """Convenience: log a price mutation."""
        return self.log(
            "PRICE_CHANGE", "product", str(product_id),
            price_before=old_price, price_after=new_price,
            **kwargs
        )

    def log_login(self, user_email, role, **kwargs):
        """Convenience: log a user login."""
        return self.log(
            "LOGIN", "session", None,
            user_email=user_email, user_role=role,
            **kwargs
        )

    def log_api_call(self, endpoint, method, role=None, email=None, **kwargs):
        """Convenience: log an API call for telemetry."""
        return self.log(
            "API_CALL", "endpoint", endpoint,
            user_role=role, user_email=email,
            endpoint=endpoint, http_method=method,
            **kwargs
        )

    # ── Query helpers ────────────────────────────────────────────────────

    def get_recent_events(self, limit: int = 50) -> list:
        """Return the most recent audit events."""
        cur = self.conn.execute(
            """SELECT audit_id, event_timestamp, action_type, entity_type, entity_id,
                      user_role, user_email, endpoint, http_method
               FROM fact_audit_log
               ORDER BY audit_id DESC LIMIT ?""", (limit,)
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]

    def get_event_counts_by_type(self) -> list:
        """Return action_type → count breakdown."""
        cur = self.conn.execute(
            """SELECT action_type, COUNT(*) as cnt
               FROM fact_audit_log GROUP BY action_type ORDER BY cnt DESC"""
        )
        return [{"action_type": r[0], "count": r[1]} for r in cur.fetchall()]

    def get_event_counts_by_entity(self) -> list:
        """Return entity_type → count breakdown."""
        cur = self.conn.execute(
            """SELECT entity_type, COUNT(*) as cnt
               FROM fact_audit_log GROUP BY entity_type ORDER BY cnt DESC"""
        )
        return [{"entity_type": r[0], "count": r[1]} for r in cur.fetchall()]

    def get_daily_event_volume(self, days: int = 30) -> list:
        """Return daily event volume for the last N days."""
        cur = self.conn.execute(
            """SELECT date_key, COUNT(*) as events
               FROM fact_audit_log
               GROUP BY date_key
               ORDER BY date_key DESC
               LIMIT ?""", (days,)
        )
        return [{"date_key": r[0], "events": r[1]} for r in cur.fetchall()]
