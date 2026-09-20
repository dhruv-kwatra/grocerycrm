import random
from datetime import datetime, timedelta
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# GROCERY DATA GENERATION
# ---------------------------------------------------------

CATEGORIES = [
    "Rice", "Wheat Flour", "Sugar", "Salt", "Milk", "Eggs", "Bread", 
    "Cooking Oil", "Butter", "Cheese", "Fruits", "Vegetables", "Soft Drinks", 
    "Juices", "Snacks", "Biscuits", "Tea", "Coffee", "Frozen Foods", "Cleaning Supplies"
]

BRANDS = {
    "Rice": ["Daawat", "Kohinoor", "India Gate", "Fortune"],
    "Wheat Flour": ["Aashirvaad", "Pillsbury", "Fortune", "Patanjali"],
    "Sugar": ["Madhur", "Parry's", "Dhampur"],
    "Salt": ["Tata", "Catch", "Aashirvaad"],
    "Milk": ["Amul", "Mother Dairy", "Nandini", "Heritage"],
    "Eggs": ["Nandu's", "Suguna", "Local"],
    "Bread": ["Britannia", "Modern", "Harvest Gold"],
    "Cooking Oil": ["Saffola", "Fortune", "Sundrop", "Dhara"],
    "Butter": ["Amul", "Nutralite", "President"],
    "Cheese": ["Amul", "Go", "Britannia", "Mother Dairy"],
    "Fruits": ["Fresh", "Zespri", "Del Monte"],
    "Vegetables": ["Fresh", "Safal"],
    "Soft Drinks": ["Coca-Cola", "Pepsi", "Sprite", "Thums Up"],
    "Juices": ["Real", "Tropicana", "Paper Boat", "B Natural"],
    "Snacks": ["Haldiram's", "Balaji", "Kurkure", "Lays"],
    "Biscuits": ["Parle-G", "Britannia", "Sunfeast", "Oreo"],
    "Tea": ["Tata Tea", "Taj Mahal", "Red Label", "Brooke Bond"],
    "Coffee": ["Nescafe", "Bru", "Davidoff"],
    "Frozen Foods": ["McCain", "Sumeru", "Godrej Yummiez"],
    "Cleaning Supplies": ["Harpic", "Lizol", "Vim", "Surf Excel"]
}

SUPPLIERS = [
    {"nodeId": 10, "name": "North Region", "companyName": "North Foods LLC", "gstin": "07AAAAA0000A1Z5", "contactName": "Rahul Sharma", "contactMobile": "9876543210", "partners": 15, "stores": 50, "revenue": 50000000},
    {"nodeId": 11, "name": "South Region", "companyName": "South Grocery Pvt Ltd", "gstin": "29BBBBB0000B2Z6", "contactName": "Anitha", "contactMobile": "9876543211", "partners": 12, "stores": 45, "revenue": 45000000},
    {"nodeId": 12, "name": "East Region", "companyName": "East FMCG Dist", "gstin": "19CCCCC0000C3Z7", "contactName": "Ravi", "contactMobile": "9876543212", "partners": 10, "stores": 35, "revenue": 35000000},
    {"nodeId": 13, "name": "West Region", "companyName": "West Coast Suppliers", "gstin": "27DDDDD0000D4Z8", "contactName": "Amit", "contactMobile": "9876543213", "partners": 20, "stores": 60, "revenue": 60000000},
]

import json
import os

data_path = os.path.join(os.path.dirname(__file__), "data.json")
try:
    with open(data_path, "r", encoding="utf-8") as f:
        _data = json.load(f)
    PRODUCTS = _data.get("products", [])
    CUSTOMERS = _data.get("customers", [])
    ORDERS = _data.get("orders", [])
except Exception as e:
    print(f"Error loading data.json: {e}")
    PRODUCTS = []
    CUSTOMERS = []
    ORDERS = []

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------

@app.get("/api/retail/dump")
def dump_data():
    return {
        "products": PRODUCTS,
        "customers": CUSTOMERS,
        "orders": ORDERS
    }


import base64

@app.get("/api/retail/scope")
def get_scope(request: Request):
    auth_header = request.headers.get("authorization", "")
    email = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
                payload = json.loads(payload_json)
                email = payload.get("email")
        except Exception:
            pass

    ROLE_BY_EMAIL = {
        "admin@grocerycrm.com": {"role": "superadmin", "bypass": True, "readOnly": False},
        "brand@grocerycrm.com": {"role": "brand", "bypass": False, "readOnly": False, "brandId": 1},
        "distributor@grocerycrm.com": {"role": "distributor", "bypass": False, "readOnly": False, "warehouseId": 1},
        "partner@grocerycrm.com": {"role": "partner", "bypass": False, "readOnly": False, "partnerId": 1},
        "store.delhi@grocerycrm.com": {"role": "store_manager", "bypass": False, "readOnly": False, "storeId": 1},
        "associate@grocerycrm.com": {"role": "store_associate", "bypass": False, "readOnly": False, "storeId": 1},
    }

    user_info = ROLE_BY_EMAIL.get(email)
    if user_info:
        return {
            "assigned": True,
            "nodeId": 1,
            "path": "node-1",
            "depth": 0,
            **user_info
        }

    return {
        "assigned": True,
        "nodeId": 1,
        "path": "node-1",
        "depth": 0,
        "role": "brand",
        "readOnly": False,
        "bypass": False
    }

@app.get("/api/retail/agent/summary")
def agent_summary():
    return {
        "date": datetime.utcnow().isoformat(),
        "role": "floor_agent",
        "kpis": {
            "demos": 120, 
            "bills": 85,
            "units": 315,
            "revenue": 145000,
            "footfall": 250,
            "won": 85,
            "lost": 20,
            "conversion": 34.0
        },
        "targets": {
            "revenue": 200000,
            "bills": 120,
            "units": 400,
            "demos": 500
        }
    }

@app.get("/api/retail/agent/walkins")
def agent_walkins(status: str = "closed"):
    return {
        "walkins": [
            {
                "id": 1,
                "customerName": CUSTOMERS[0]["name"],
                "customerPhone": CUSTOMERS[0]["phone"],
                "status": "won",
                "lastOutcome": "Purchased Weekly Groceries",
                "party": "Consumer",
                "budgetBand": "High",
                "emiInterest": False,
                "closeProbability": 100,
                "createdAt": datetime.utcnow().isoformat()
            },
            {
                "id": 2,
                "customerName": CUSTOMERS[1]["name"],
                "customerPhone": CUSTOMERS[1]["phone"],
                "status": "lost",
                "lastOutcome": "Item Out of Stock",
                "party": "Business (Caterer)",
                "budgetBand": "Medium",
                "emiInterest": False,
                "closeProbability": 0,
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
    }

@app.get("/api/retail/agent/insights")
def agent_insights():
    return {
        "date": datetime.utcnow().isoformat(),
        "series": [
            {"date": "2026-07-25", "footfall": 420, "bills": 105, "units": 408, "revenue": 150000, "demos": 80, "label": "Sat"},
            {"date": "2026-07-26", "footfall": 525, "bills": 128, "units": 510, "revenue": 200000, "demos": 100, "label": "Sun"},
            {"date": "2026-07-27", "footfall": 215, "bills": 54, "units": 155, "revenue": 90000, "demos": 60, "label": "Mon"},
            {"date": "2026-07-28", "footfall": 218, "bills": 66, "units": 187, "revenue": 120000, "demos": 70, "label": "Tue"},
            {"date": "2026-07-29", "footfall": 222, "bills": 77, "units": 209, "revenue": 180000, "demos": 90, "label": "Wed"},
            {"date": "2026-07-30", "footfall": 230, "bills": 80, "units": 215, "revenue": 250000, "demos": 120, "label": "Thu"},
            {"date": "2026-07-31", "footfall": 325, "bills": 98, "units": 315, "revenue": 450000, "demos": 120, "label": "Fri"}
        ],
        "trend": {
            "direction": "up",
            "pct": 22,
            "period": "week"
        },
        "categories": [
            {"name": "Rice & Grains", "revenue": 300000, "units": 500},
            {"name": "Dairy & Milk", "revenue": 150000, "units": 1000},
            {"name": "Snacks & Drinks", "revenue": 200000, "units": 800}
        ],
        "payments": [
            {"method": "UPI", "share": 65, "bills": 130},
            {"method": "Credit Card", "share": 25, "bills": 50},
            {"method": "Cash", "share": 10, "bills": 20}
        ],
        "achievements": {
            "unlocked": ["Weekend Warrior", "Fast Checkout"],
            "next": "Inventory Master",
            "progress": 85
        }
    }

@app.get("/api/retail/notifications")
def notifications():
    return {
        "notifications": [
            {
                "id": 1,
                "type": "alert",
                "title": "Low Stock Alert: Milk",
                "body": "Reorder 120 Milk packets within 2 days to avoid stockout.",
                "createdAt": datetime.utcnow().isoformat(),
                "read": False
            },
            {
                "id": 2,
                "type": "forecast",
                "title": "Demand Forecast",
                "body": "Rice demand expected to increase by 22% this weekend.",
                "createdAt": datetime.utcnow().isoformat(),
                "read": False
            },
            {
                "id": 3,
                "type": "warning",
                "title": "Overstock Warning",
                "body": "Cooking Oil inventory is overstocked. Consider running a discount campaign.",
                "createdAt": datetime.utcnow().isoformat(),
                "read": False
            }
        ]
    }

@app.get("/api/retail/notifications/unread-count")
def unread_count():
    return {"count": 3}

@app.get("/api/retail/analytics/overview")
def analytics_overview():
    return {
        "period": "month",
        "role": "superadmin",
        "scopeNode": {"id": 1, "name": "RetailIQ Grocery Network", "nodeType": "tenant", "parentId": None, "depth": 0},
        "funnel": [
            {"stage": "Walk-ins", "value": 150000, "pct": 100},
            {"stage": "Shoppers", "value": 120000, "pct": 80},
            {"stage": "Baskets", "value": 108000, "pct": 72},
            {"stage": "Purchases", "value": 105000, "pct": 70}
        ],
        "trend": {
            "weeks": [
                {"label": "W1", "focus": 5000, "other": 15000},
                {"label": "W2", "focus": 5500, "other": 16000},
                {"label": "W3", "focus": 6000, "other": 15500},
                {"label": "W4", "focus": 6500, "other": 17000}
            ]
        },
        "series": [
            {"date": f"2026-07-{d:02d}", "label": f"Jul {d}", "footfall": 5000 + random.randint(-500, 1500), "bills": 3500 + random.randint(-300, 1000), "units": 15000 + random.randint(-1000, 3000), "revenue": 1000000 + random.randint(-100000, 500000), "demos": 0}
            for d in range(1, 32)
        ],
        "customerGrowth": {
            "weeks": [
                {"label": "W1", "n": 3000},
                {"label": "W2", "n": 3500},
                {"label": "W3", "n": 4000},
                {"label": "W4", "n": 4200}
            ]
        },
        "compliance": {
            "target": 95,
            "avg": 92,
            "belowCount": 2,
            "stores": [
                {"nodeId": 101, "name": "Store A", "checks": 10, "score": 88, "belowTarget": True},
                {"nodeId": 102, "name": "Store B", "checks": 10, "score": 97, "belowTarget": False}
            ],
            "trend": {
                "weeks": [
                    {"label": "W1", "score": 89},
                    {"label": "W2", "score": 90},
                    {"label": "W3", "score": 91},
                    {"label": "W4", "score": 92}
                ]
            }
        },
        "deltas": {
            "revenue": 12.2,
            "bills": 8.1,
            "units": 14.5,
            "footfall": 5.2,
            "conversion": 2.3
        },
        "breakdown": {
            "label": "By Region",
            "rows": [
                {"nodeId": 10, "name": "North Region", "nodeType": "region", "revenue": 50000000, "bills": 200000, "units": 1250000, "avgTxn": 250},
                {"nodeId": 11, "name": "South Region", "nodeType": "region", "revenue": 45000000, "bills": 180000, "units": 1120000, "avgTxn": 250}
            ]
        },
        "supply": {
            "orders": [
                {"status": "pending", "n": 150},
                {"status": "fulfilled", "n": 1200}
            ],
            "placed": 1350,
            "pending": 150,
            "fulfilled": 1200,
            "unitsOrdered": 15000,
            "unitsFulfilled": 13500,
            "dispatches": 450,
            "unitsDispatched": 13500
        },
        "ops": {
            "lowStock": [
                {"nodeId": 101, "storeName": "Store A", "skuId": p["id"], "skuName": p["name"], "onHand": p["onHand"], "lowThreshold": p["lowThreshold"]}
                for p in PRODUCTS[:5]
            ],
            "replenishmentOpen": 15
        },
        "kpis": {
            "revenue": 95000000,
            "bills": 380000,
            "units": 2370000,
            "footfall": 500000,
            "demos": 0,
            "conversion": 76,
            "avgTxn": 250,
            "grossMarginEst": 19000000,
            "marginRate": 0.2
        },
        "topSkus": [
            {"skuId": PRODUCTS[0]["id"], "name": PRODUCTS[0]["name"], "units": 5000, "revenue": round(PRODUCTS[0]["price"] * 5000, 2)},
            {"skuId": PRODUCTS[1]["id"], "name": PRODUCTS[1]["name"], "units": 4500, "revenue": round(PRODUCTS[1]["price"] * 4500, 2)}
        ],
        "staff": [
            {"agentId": 1, "name": "Cashier Amit", "store": "Store A", "demos": 0, "bills": 500, "units": 3200, "revenue": 800000, "avgTxn": 1600}
        ],
        "customers": {
            "total": 150000,
            "purchasers": 120000,
            "newShoppers": 5000,
            "avgLtv": 4500,
            "churnPct": 2.5,
            "segmentMix": [
                {"segment": "Champions", "n": 25000},
                {"segment": "Loyal", "n": 58000},
                {"segment": "At Risk", "n": 12000}
            ]
        }
    }

@app.get("/api/retail/analytics/territory")
def analytics_territory():
    return {
        "nodes": [
            {"id": 10, "name": "North Region", "nodeType": "region", "parentId": 1, "depth": 1, "children": 5},
            {"id": 11, "name": "South Region", "nodeType": "region", "parentId": 1, "depth": 1, "children": 4}
        ],
        "kpis": {
            "revenue": 95000000,
            "bills": 380000,
            "units": 2370000,
            "footfall": 500000
        }
    }

@app.get("/api/retail/analytics/sales-series")
def analytics_sales_series():
    return {
        "date": datetime.utcnow().isoformat(),
        "role": "brand",
        "kpis": {"revenue": 300000000, "orders": 1200000, "units": 7500000, "aov": 250},
        "deltas": {"revenue": 12.5, "orders": 15.2, "units": 18.4, "aov": -2.1},
        "series": [
            {"date": f"2026-07-{d:02d}", "label": f"Jul {d}", "footfall": 5000 + random.randint(-500, 1500), "bills": 3500 + random.randint(-300, 1000), "units": 15000 + random.randint(-1000, 3000), "revenue": 1000000 + random.randint(-100000, 500000), "demos": 0}
            for d in range(1, 32)
        ],
        "trend": {
            "direction": "up",
            "pct": 12,
            "period": "month"
        },
        "categories": [
            {"name": cat, "revenue": random.randint(1000000, 5000000), "units": random.randint(50000, 200000)} for cat in CATEGORIES[:5]
        ],
        "payments": [],
        "achievements": {
            "unlocked": [],
            "next": "Target",
            "progress": 75
        }
    }

@app.get("/api/retail/supply/products")
def supply_products():
    return {
        "products": PRODUCTS
    }

@app.get("/api/retail/supply/inventory")
def supply_inventory():
    return {
        "nodeId": 1,
        "rows": PRODUCTS
    }

@app.get("/api/retail/supply/orders")
def supply_orders():
    return {
        "orders": [
            {
                "id": 1000 + i,
                "nodeId": 101,
                "storeName": "Store A",
                "status": random.choice(["pending", "fulfilled", "shipped"]),
                "items": [{"skuId": p["id"], "qty": random.randint(10, 100)} for p in random.sample(PRODUCTS, 3)],
                "totalQty": random.randint(50, 300),
                "createdAt": (datetime.utcnow() - timedelta(days=random.randint(0, 5))).isoformat()
            } for i in range(10)
        ]
    }

@app.get("/api/retail/supply/requests")
def supply_requests():
    return {
        "requests": [
            {
                "id": 2000 + i,
                "nodeId": random.choice([101, 102]),
                "storeName": random.choice(["Store A", "Store B"]),
                "skuId": p["id"],
                "qty": random.randint(20, 200),
                "status": "open",
                "createdAt": (datetime.utcnow() - timedelta(days=random.randint(0, 3))).isoformat()
            } for i, p in enumerate(random.sample(PRODUCTS, 5))
        ]
    }

@app.get("/api/retail/tree")
def tree():
    return {
        "nodes": [
            {"id": 1, "name": "RetailIQ Grocery Network", "nodeType": "tenant", "parentId": None, "depth": 0, "path": "1"},
            {"id": 10, "name": "North Region", "nodeType": "region", "parentId": 1, "depth": 1, "path": "1.10"},
            {"id": 101, "name": "Store A", "nodeType": "store", "parentId": 10, "depth": 2, "path": "1.10.101"}
        ]
    }

@app.get("/api/retail/profile")
def profile():
    return {
        "user": {
            "id": 1,
            "name": "Super Admin",
            "email": "admin@retailiq.com",
            "role": "superadmin"
        },
        "node": {"id": 1, "name": "RetailIQ Grocery Network", "nodeType": "tenant"},
        "supervisor": {"id": 0, "name": "System"},
        "headcount": 450
    }

@app.get("/api/retail/users")
def users():
    return {
        "users": [
            {"id": 1, "name": "Admin", "email": "admin@retailiq.com", "role": "superadmin", "nodeId": 1, "active": True},
            {"id": 2, "name": "Store Mgr A", "email": "mgr_a@retailiq.com", "role": "store_manager", "nodeId": 101, "active": True},
            {"id": 3, "name": "Cashier Rahul", "email": "rahul@retailiq.com", "role": "floor_agent", "nodeId": 101, "active": True}
        ]
    }

@app.get("/api/retail/users/creatable")
def users_creatable():
    return {
        "roles": ["brand", "distributor", "partner", "store_manager", "floor_agent"],
        "nodes": [
            {"id": 1, "name": "RetailIQ Grocery Network", "nodeType": "tenant"},
            {"id": 101, "name": "Store A", "nodeType": "store"}
        ]
    }

@app.get("/api/retail/nodes/creatable")
def nodes_creatable():
    return {
        "canOnboard": True,
        "parents": [
            {"id": 1, "name": "RetailIQ Grocery Network", "nodeType": "tenant"}
        ]
    }

@app.get("/api/retail/returns")
def returns():
    return {
        "returns": [
            {
                "id": 3001,
                "skuId": PRODUCTS[5]["id"],
                "qty": 5,
                "reason": "Expired",
                "status": "pending",
                "createdAt": datetime.utcnow().isoformat()
            }
        ]
    }

@app.get("/api/retail/returns/low-stock")
def returns_low_stock():
    return {
        "alerts": []
    }

@app.get("/api/retail/agent/skus")
def agent_skus():
    return {
        "skus": PRODUCTS
    }

@app.get("/api/retail/agent/sellers")
def agent_sellers():
    return {
        "sellers": [
            {"id": 1, "name": "Cashier Rahul"},
            {"id": 2, "name": "Cashier Priya"}
        ]
    }

@app.get("/api/retail/customers")
@app.get("/api/retail/agent/customers")
def get_customers():
    return {
        "customers": CUSTOMERS
    }

@app.get("/api/retail/manager/board")
def manager_board(date: str = None):
    return {
        "date": date or datetime.utcnow().strftime("%Y-%m-%d"),
        "role": "store_manager",
        "kpis": {
            "demos": 0, "bills": 1500, "units": 8500, "revenue": 850000,
            "footfall": 2500, "won": 1500, "lost": 50, "conversion": 60.0
        },
        "agents": [
            {"agentId": 1, "name": "Cashier Rahul", "walkins": 800, "demos": 0, "bills": 600, "units": 3500, "revenue": 400000},
            {"agentId": 2, "name": "Cashier Priya", "walkins": 700, "demos": 0, "bills": 500, "units": 3000, "revenue": 350000}
        ],
        "targets": {"revenue": 1000000, "bills": 2000},
        "hourly": [
            {"slot": "10-12", "today": 400, "yesterday": 350},
            {"slot": "12-14", "today": 600, "yesterday": 550},
            {"slot": "14-16", "today": 500, "yesterday": 600}
        ],
        "week": [
            {"date": "2026-07-25", "footfall": 3000, "demos": 0, "bills": 1800, "revenue": 950000},
            {"date": "2026-07-26", "footfall": 3500, "demos": 0, "bills": 2000, "revenue": 1100000}
        ]
    }

@app.get("/api/retail/manager/approvals")
def manager_approvals():
    return {
        "approvals": [
            {"id": 1, "kind": "Write-off", "amount": 500, "reason": "Damaged fruits", "requestedBy": 1, "status": "pending"}
        ]
    }

@app.get("/api/retail/manager/stock")
def manager_stock():
    return {
        "rows": PRODUCTS[:10]
    }

@app.get("/api/retail/manager/findings")
def manager_findings():
    return {
        "findings": [
            {"id": 1, "kind": "Planogram", "title": "Missing Dairy Display Unit", "status": "open", "createdAt": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/retail/manager/eod")
def manager_eod():
    return {
        "date": datetime.utcnow().isoformat(),
        "totals": {"footfall": 2500, "bills": 1500, "units": 8500, "revenue": 850000},
        "closed": False,
        "lockedAt": None
    }

@app.get("/api/retail/manager/activity")
def manager_activity():
    return {
        "activity": [
            {"id": 1, "customerName": "John Doe", "customerPhone": "1234567890", "status": "won", "skuName": "Weekly Groceries", "lastOutcome": "Purchased", "revenue": 1500},
            {"id": 2, "customerName": "Jane Doe", "customerPhone": "0987654321", "status": "lost", "skuName": "Organic Apples", "lastOutcome": "Out of Stock", "revenue": 0}
        ]
    }

@app.get("/api/retail/manager/targets")
def manager_targets():
    return {
        "targets": [
            {"agentId": 1, "metric": "revenue", "target": 1000000},
            {"agentId": 2, "metric": "revenue", "target": 1000000}
        ]
    }

@app.get("/api/retail/campaigns")
def campaigns():
    return {
        "campaigns": [
            {"id": 1, "name": "Weekend Grocery Mega Sale", "channel": "whatsapp", "targetSegment": "all", "status": "sent", "recipientCount": 50000, "sentAt": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/retail/distributors")
def distributors():
    return {
        "total": 4,
        "distributors": SUPPLIERS
    }

@app.get("/api/retail/lookup/customers")
@app.get("/api/retail/lookup/customers/{id}")
def lookup_customers(id: int = None, q: str = None):
    return {
        "customers": CUSTOMERS[:10]
    }

@app.get("/api/retail/lookup/stock")
def lookup_stock(q: str = None):
    return {
        "stock": PRODUCTS
    }

@app.get("/api/retail/agent/planogram")
def planogram():
    return {"planograms": []}

@app.get("/api/retail/agent/sales")
def agent_sales():
    return {"sales": []}

@app.get("/api/retail/estate/rcm")
def estate_rcm(week: str = None):
    return {
        "week": {"from": "2026-07-26", "to": "2026-08-01", "label": "Wk 31"},
        "kpis": {
            "avgCompliance": 92.5, "avgComplianceDelta": 1.5, "target": 95.0,
            "conversion": 68.4, "conversionDelta": 2.2,
            "focusUnits": 15000, "focusTarget": 20000, "flagged": 2, "revenue": 150000000, "footfall": 500000
        },
        "filters": {"zones": ["North", "South"], "distributors": ["North Foods LLC", "South Grocery Pvt Ltd"], "partners": ["Partner A", "Partner B"]},
        "stores": 2,
        "rows": [
            {
                "nodeId": 1, "name": "Flagship Store Delhi", "zone": "North", "distributorName": "North Foods LLC", "partnerName": "Partner A",
                "compliance": 85.0, "complianceDelta": -2.0, "footfall": 250000, "bills": 180000, "revenue": 80000000, "conversion": 72.0,
                "focusUnits": 8000, "focusTarget": 10000, "openFindings": 2, "stockOuts": 15,
                "exception": {"tone": "crit", "text": "Low compliance"}
            },
            {
                "nodeId": 2, "name": "Premium Store BLR", "zone": "South", "distributorName": "South Grocery Pvt Ltd", "partnerName": "Partner B",
                "compliance": 98.0, "complianceDelta": 2.0, "footfall": 250000, "bills": 185000, "revenue": 70000000, "conversion": 74.0,
                "focusUnits": 7000, "focusTarget": 10000, "openFindings": 0, "stockOuts": 2,
                "exception": None
            }
        ]
    }

@app.get("/api/retail/estate/store/{id}")
def estate_store(id: int, week: str = None):
    return {
        "store": {"nodeId": id, "name": "Flagship Store Delhi", "zone": "North", "distributorName": "North Foods LLC", "partnerName": "Partner A"},
        "compliance": {
            "target": 95.0, "current": 85.0, "delta": -2.0,
            "weeks": [
                {"label": "Wk 26", "score": 95.0},
                {"label": "Wk 27", "score": 98.0},
                {"label": "Wk 28", "score": 92.0},
                {"label": "Wk 29", "score": 90.0},
                {"label": "Wk 30", "score": 87.0},
                {"label": "Wk 31", "score": 85.0}
            ]
        },
        "findings": [
             {"id": 1, "kind": "planogram", "title": "Empty Dairy Aisle", "detail": "Left aisle unit empty", "photoUrl": None, "status": "open", "createdAt": datetime.utcnow().isoformat()}
        ]
    }

@app.post("/api/retail/{full_path:path}")
def post_catchall(full_path: str):
    return {"success": True}

@app.patch("/api/retail/{full_path:path}")
def patch_catchall(full_path: str):
    return {"success": True}

@app.delete("/api/retail/{full_path:path}")
def delete_catchall(full_path: str):
    return {"success": True}
