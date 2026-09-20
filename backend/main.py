import os
import sys
import random
from datetime import datetime, timedelta

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

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

# Initialize CUSTOMERS if empty
if not CUSTOMERS:
    CUSTOMERS = [
        {"id": 1, "name": "Rajesh Sharma", "phone": "9810420001", "email": "rajesh.sharma@example.com", "orders": 12, "spend": 45000, "aov": 3750, "lastPurchase": "2026-08-01", "recencyDays": 1, "segment": "Champions", "storeName": "Flagship Store Delhi", "units": 48, "saleCount": 12, "demoCount": 2, "lastPurchaseAt": "2026-08-01T14:30:00", "categoryPref": "Rice & Grains"},
        {"id": 2, "name": "Priya Patel", "phone": "9810420002", "email": "priya.patel@example.com", "orders": 8, "spend": 28000, "aov": 3500, "lastPurchase": "2026-08-02", "recencyDays": 0, "segment": "Loyal Shopper", "storeName": "Flagship Store Delhi", "units": 26, "saleCount": 8, "demoCount": 1, "lastPurchaseAt": "2026-08-02T10:15:00", "categoryPref": "Dairy & Milk"},
        {"id": 3, "name": "Amit Kumar", "phone": "9810420003", "email": "amit.kumar@example.com", "orders": 5, "spend": 14500, "aov": 2900, "lastPurchase": "2026-07-28", "recencyDays": 5, "segment": "Regular Shopper", "storeName": "Flagship Store Delhi", "units": 15, "saleCount": 5, "demoCount": 3, "lastPurchaseAt": "2026-07-28T16:45:00", "categoryPref": "Snacks & Drinks"},
        {"id": 4, "name": "Sunita Verma", "phone": "9810420004", "email": "sunita.verma@example.com", "orders": 2, "spend": 3200, "aov": 1600, "lastPurchase": "2026-07-20", "recencyDays": 13, "segment": "New Shopper", "storeName": "Flagship Store Delhi", "units": 6, "saleCount": 2, "demoCount": 1, "lastPurchaseAt": "2026-07-20T11:20:00", "categoryPref": "Vegetables"},
        {"id": 5, "name": "Vikram Malhotra", "phone": "9810420005", "email": "vikram.m@example.com", "orders": 1, "spend": 1200, "aov": 1200, "lastPurchase": "2026-07-02", "recencyDays": 31, "segment": "At Risk", "storeName": "Flagship Store Delhi", "units": 3, "saleCount": 1, "demoCount": 0, "lastPurchaseAt": "2026-07-02T18:00:00", "categoryPref": "Soft Drinks"},
        {"id": 6, "name": "Ananya Roy", "phone": "9810420006", "email": "ananya.roy@example.com", "orders": 7, "spend": 21000, "aov": 3000, "lastPurchase": "2026-07-29", "recencyDays": 4, "segment": "Loyal Shopper", "storeName": "Flagship Store Delhi", "units": 22, "saleCount": 7, "demoCount": 2, "lastPurchaseAt": "2026-07-29T12:10:00", "categoryPref": "Wheat Flour"},
        {"id": 7, "name": "Deepak Gupta", "phone": "9810420007", "email": "deepak.g@example.com", "orders": 4, "spend": 9800, "aov": 2450, "lastPurchase": "2026-07-25", "recencyDays": 8, "segment": "Regular Shopper", "storeName": "Flagship Store Delhi", "units": 14, "saleCount": 4, "demoCount": 1, "lastPurchaseAt": "2026-07-25T15:20:00", "categoryPref": "Cooking Oil"},
        {"id": 8, "name": "Neha Joshi", "phone": "9810420008", "email": "neha.j@example.com", "orders": 3, "spend": 6500, "aov": 2166, "lastPurchase": "2026-07-22", "recencyDays": 11, "segment": "Regular Shopper", "storeName": "Flagship Store Delhi", "units": 9, "saleCount": 3, "demoCount": 0, "lastPurchaseAt": "2026-07-22T09:40:00", "categoryPref": "Biscuits"}
    ]

WALKINS = [
    {
        "id": 1,
        "customerName": CUSTOMERS[0]["name"],
        "customerPhone": CUSTOMERS[0]["phone"],
        "status": "won",
        "lastOutcome": "Purchased Weekly Groceries",
        "party": "Family",
        "budgetBand": "High",
        "emiInterest": False,
        "interestSkuId": PRODUCTS[0]["id"] if PRODUCTS else 1,
        "skuName": PRODUCTS[0]["name"] if PRODUCTS else "Taj Mahal Tea",
        "revenue": 1450,
        "units": 2,
        "closeProbability": 100,
        "createdAt": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "storeId": 1,
        "agentId": 1
    },
    {
        "id": 2,
        "customerName": CUSTOMERS[1]["name"],
        "customerPhone": CUSTOMERS[1]["phone"],
        "status": "lost",
        "lastOutcome": "Item Out of Stock",
        "party": "Solo",
        "budgetBand": "Medium",
        "emiInterest": False,
        "interestSkuId": PRODUCTS[1]["id"] if len(PRODUCTS) > 1 else 2,
        "skuName": PRODUCTS[1]["name"] if len(PRODUCTS) > 1 else "Tata Tea Premium",
        "revenue": 0,
        "units": 0,
        "closeProbability": 0,
        "createdAt": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "storeId": 1,
        "agentId": 1
    }
]

RETAIL_ORDERS = [
    {
        "id": 101,
        "soldAt": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "units": 2,
        "revenue": "1450",
        "paymentMethod": "UPI",
        "orderStatus": "confirmed",
        "customerName": CUSTOMERS[0]["name"],
        "customerPhone": CUSTOMERS[0]["phone"],
        "productName": PRODUCTS[0]["name"] if PRODUCTS else "Taj Mahal Tea",
        "agentName": "Cashier Rahul",
        "skuId": PRODUCTS[0]["id"] if PRODUCTS else 1
    }
]

AGENT_DAILY = {
    "footfall": 250,
    "demos": 120,
    "bills": 85,
    "units": 315,
    "revenue": 145000,
    "won": 85,
    "lost": 20
}

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
    won_count = sum(1 for w in WALKINS if w.get("status") == "won")
    lost_count = sum(1 for w in WALKINS if w.get("status") == "lost")
    total_footfall = AGENT_DAILY["footfall"] + len(WALKINS) - 2
    total_footfall = max(total_footfall, won_count + lost_count, 1)
    total_bills = AGENT_DAILY["bills"] + sum(1 for w in WALKINS if w.get("status") == "won") - 1
    total_units = AGENT_DAILY["units"] + sum(w.get("units", 0) for w in WALKINS if w.get("status") == "won") - 2
    total_rev = AGENT_DAILY["revenue"] + sum(w.get("revenue", 0) for w in WALKINS if w.get("status") == "won") - 1450
    conv = round((won_count / max(1, total_footfall)) * 100, 1) if total_footfall > 0 else 0.0

    return {
        "date": datetime.utcnow().isoformat(),
        "role": "floor_agent",
        "kpis": {
            "demos": AGENT_DAILY["demos"],
            "bills": max(0, total_bills),
            "units": max(0, total_units),
            "revenue": max(0, total_rev),
            "footfall": max(1, total_footfall),
            "won": won_count,
            "lost": lost_count,
            "conversion": conv
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
    if status == "closed":
        filtered = [w for w in WALKINS if w.get("status") in ("won", "lost")]
    elif status == "open":
        filtered = [w for w in WALKINS if w.get("status") == "open"]
    else:
        filtered = WALKINS
    return {
        "walkins": sorted(filtered, key=lambda x: str(x.get("createdAt", "")), reverse=True)
    }

@app.post("/api/retail/agent/walkins")
async def create_agent_walkin(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    cust_name = (body.get("customerName") or "").strip()
    cust_phone = (body.get("customerPhone") or "").strip()
    party = body.get("party") or "Solo"
    sku_id = body.get("interestSkuId")
    budget_band = body.get("budgetBand")
    emi_interest = bool(body.get("emiInterest"))
    
    sku_name = None
    if sku_id:
        for p in PRODUCTS:
            if str(p.get("id")) == str(sku_id):
                sku_name = p.get("name")
                break

    new_id = max([w["id"] for w in WALKINS] + [0]) + 1
    new_walkin = {
        "id": new_id,
        "customerName": cust_name or (f"Shopper {cust_phone[-4:]}" if cust_phone else "Walk-in Customer"),
        "customerPhone": cust_phone or None,
        "status": "open",
        "lastOutcome": "In Store Discussion",
        "party": party,
        "budgetBand": budget_band,
        "emiInterest": emi_interest,
        "interestSkuId": sku_id,
        "skuName": sku_name,
        "revenue": 0,
        "units": 0,
        "closeProbability": 50,
        "createdAt": datetime.utcnow().isoformat(),
        "storeId": 1,
        "agentId": 1
    }
    WALKINS.insert(0, new_walkin)
    AGENT_DAILY["footfall"] += 1

    # Insert or update customer in CUSTOMERS
    if cust_phone or cust_name:
        existing_cust = next((c for c in CUSTOMERS if (cust_phone and c.get("phone") == cust_phone) or (cust_name and c.get("name") == cust_name)), None)
        if existing_cust:
            if cust_name:
                existing_cust["name"] = cust_name
            if cust_phone:
                existing_cust["phone"] = cust_phone
            existing_cust["recencyDays"] = 0
            existing_cust["lastPurchaseAt"] = datetime.utcnow().isoformat()
        else:
            new_cust_id = max([c["id"] for c in CUSTOMERS] + [0]) + 1
            new_cust = {
                "id": new_cust_id,
                "name": cust_name or f"Shopper {cust_phone[-4:] if cust_phone else new_cust_id}",
                "phone": cust_phone or f"98100{new_cust_id:05d}",
                "email": f"{cust_phone or new_cust_id}@customer.grocerycrm.com",
                "orders": 0,
                "spend": 0,
                "aov": 0,
                "lastPurchase": datetime.utcnow().strftime("%Y-%m-%d"),
                "recencyDays": 0,
                "segment": "New Shopper",
                "storeName": "Flagship Store Delhi",
                "units": 0,
                "saleCount": 0,
                "demoCount": 0,
                "lastPurchaseAt": datetime.utcnow().isoformat(),
                "categoryPref": sku_name or "General Groceries"
            }
            CUSTOMERS.insert(0, new_cust)

    # Sync with warehouse
    if warehouse and warehouse.conn:
        try:
            today_key = int(datetime.utcnow().strftime("%Y%m%d"))
            warehouse.conn.execute(
                """INSERT INTO fact_walkin (date_key, store_id, customer_id, status, outcome, budget_band, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (today_key, 1, new_id, "open", f"Walk-in ({party})", budget_band or "Medium", datetime.utcnow().isoformat())
            )
            warehouse.conn.commit()
        except Exception as e:
            print(f"Warehouse walkin sync error: {e}")

    return {"success": True, "id": new_id, "walkin": new_walkin}

@app.post("/api/retail/agent/demos")
async def create_agent_demo(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    AGENT_DAILY["demos"] += 1
    walkin_id = body.get("walkinId")
    if walkin_id:
        walkin = next((w for w in WALKINS if str(w["id"]) == str(walkin_id)), None)
        if walkin and walkin.get("customerPhone"):
            cust = next((c for c in CUSTOMERS if c.get("phone") == walkin["customerPhone"]), None)
            if cust:
                cust["demoCount"] = cust.get("demoCount", 0) + 1
    return {"success": True, "demos": AGENT_DAILY["demos"]}

@app.post("/api/retail/agent/sales")
async def create_agent_sale(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    sku_id = body.get("skuId")
    units = int(body.get("units") or 1)
    revenue_raw = body.get("revenue")
    payment_method = (body.get("paymentMethod") or "UPI").upper()
    walkin_id = body.get("walkinId")
    cust_name = (body.get("customerName") or "").strip()
    cust_phone = (body.get("customerPhone") or "").strip()

    product = None
    if sku_id:
        for p in PRODUCTS:
            if str(p.get("id")) == str(sku_id):
                product = p
                break
    
    if not product and PRODUCTS:
        product = PRODUCTS[0]
        sku_id = product["id"]

    price = float(product.get("price", 250)) if product else 250.0
    revenue = float(revenue_raw) if revenue_raw else round(price * units, 2)
    
    if product:
        product["onHand"] = max(0, product.get("onHand", 100) - units)
        product["stock"] = product["onHand"]

    if walkin_id:
        walkin = next((w for w in WALKINS if str(w["id"]) == str(walkin_id)), None)
        if walkin:
            walkin["status"] = "won"
            walkin["revenue"] = revenue
            walkin["units"] = units
            walkin["lastOutcome"] = f"Purchased {product.get('name', 'Groceries') if product else 'Groceries'}"
            walkin["closeProbability"] = 100
            if not cust_phone:
                cust_phone = walkin.get("customerPhone") or ""
            if not cust_name:
                cust_name = walkin.get("customerName") or ""

    if cust_phone or cust_name:
        cust = next((c for c in CUSTOMERS if (cust_phone and c.get("phone") == cust_phone) or (cust_name and c.get("name") == cust_name)), None)
        if cust:
            cust["orders"] = cust.get("orders", 0) + 1
            cust["spend"] = cust.get("spend", 0) + int(revenue)
            cust["aov"] = round(cust["spend"] / cust["orders"])
            cust["units"] = cust.get("units", 0) + units
            cust["saleCount"] = cust.get("saleCount", 0) + 1
            cust["lastPurchase"] = datetime.utcnow().strftime("%Y-%m-%d")
            cust["recencyDays"] = 0
            cust["lastPurchaseAt"] = datetime.utcnow().isoformat()
            if cust["spend"] > 25000:
                cust["segment"] = "Champions"
            elif cust["orders"] > 3:
                cust["segment"] = "Loyal Shopper"
            else:
                cust["segment"] = "Regular Shopper"
        else:
            new_cust_id = max([c["id"] for c in CUSTOMERS] + [0]) + 1
            new_cust = {
                "id": new_cust_id,
                "name": cust_name or f"Shopper {cust_phone[-4:] if cust_phone else new_cust_id}",
                "phone": cust_phone or f"98100{new_cust_id:05d}",
                "email": f"{cust_phone or new_cust_id}@customer.grocerycrm.com",
                "orders": 1,
                "spend": int(revenue),
                "aov": int(revenue),
                "lastPurchase": datetime.utcnow().strftime("%Y-%m-%d"),
                "recencyDays": 0,
                "segment": "New Shopper",
                "storeName": "Flagship Store Delhi",
                "units": units,
                "saleCount": 1,
                "demoCount": 0,
                "lastPurchaseAt": datetime.utcnow().isoformat(),
                "categoryPref": product.get("category", "General") if product else "General"
            }
            CUSTOMERS.insert(0, new_cust)

    new_order_id = max([o["id"] for o in RETAIL_ORDERS] + [100]) + 1
    new_order = {
        "id": new_order_id,
        "soldAt": datetime.utcnow().isoformat(),
        "units": units,
        "revenue": str(int(revenue)),
        "paymentMethod": payment_method,
        "orderStatus": "confirmed",
        "customerName": cust_name or "Walk-in Customer",
        "customerPhone": cust_phone or "—",
        "productName": product.get("name", "Groceries") if product else "Groceries",
        "agentName": "Cashier Rahul",
        "skuId": sku_id
    }
    RETAIL_ORDERS.insert(0, new_order)

    AGENT_DAILY["bills"] += 1
    AGENT_DAILY["units"] += units
    AGENT_DAILY["revenue"] += int(revenue)
    AGENT_DAILY["won"] += 1

    return {"success": True, "orderId": new_order_id, "revenue": revenue, "units": units}

@app.post("/api/retail/agent/walkins/{id}/outcome")
async def update_agent_walkin_outcome(id: int, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    outcome = body.get("outcome") or "lost"
    note = body.get("note") or ("Sale won" if outcome == "won" else "Marked lost")
    
    walkin = next((w for w in WALKINS if w["id"] == id), None)
    if walkin:
        old_status = walkin.get("status")
        walkin["status"] = outcome
        walkin["lastOutcome"] = note
        if outcome == "won" and old_status != "won":
            AGENT_DAILY["won"] += 1
            walkin["closeProbability"] = 100
        elif outcome == "lost" and old_status != "lost":
            AGENT_DAILY["lost"] += 1
            walkin["closeProbability"] = 0

    return {"success": True, "id": id, "status": outcome}

@app.post("/api/retail/agent/footfall")
async def update_agent_footfall(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    count = int(body.get("count") or 1)
    AGENT_DAILY["footfall"] += count
    return {"success": True, "footfall": AGENT_DAILY["footfall"]}

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

@app.get("/api/retail/lookup/customers")
def lookup_customers_search(q: str = None):
    if not q:
        return {"customers": [
            {
                "id": c["id"],
                "name": c.get("name"),
                "phone": c.get("phone"),
                "segment": c.get("segment"),
                "totalSpend": c.get("spend", 0),
                "visits": c.get("orders", 0) + c.get("demoCount", 0),
                "lastPurchaseAt": c.get("lastPurchaseAt")
            } for c in CUSTOMERS[:20]
        ]}
    q_lower = q.lower().strip()
    hits = []
    for c in CUSTOMERS:
        name = (c.get("name") or "").lower()
        phone = (c.get("phone") or "").lower()
        if q_lower in name or q_lower in phone:
            hits.append({
                "id": c["id"],
                "name": c.get("name"),
                "phone": c.get("phone"),
                "segment": c.get("segment"),
                "totalSpend": c.get("spend", 0),
                "visits": c.get("orders", 0) + c.get("demoCount", 0),
                "lastPurchaseAt": c.get("lastPurchaseAt")
            })
    return {"customers": hits}

@app.get("/api/retail/lookup/customers/{id}")
def lookup_customer_detail(id: int):
    cust = next((c for c in CUSTOMERS if c["id"] == id), None)
    if not cust:
        cust = CUSTOMERS[0] if CUSTOMERS else {"id": id, "name": f"Customer #{id}", "phone": None, "email": None}
    
    history = [
        {
            "id": o["id"],
            "skuName": o.get("productName"),
            "units": o.get("units", 1),
            "revenue": o.get("revenue"),
            "billNo": f"BILL-{o['id']:05d}",
            "soldAt": o.get("soldAt")
        } for o in RETAIL_ORDERS if o.get("customerPhone") == cust.get("phone")
    ]
    return {
        "customer": {
            "id": cust["id"],
            "name": cust.get("name"),
            "phone": cust.get("phone"),
            "email": cust.get("email"),
            "segment": cust.get("segment"),
            "storeName": cust.get("storeName", "Flagship Store Delhi"),
            "categoryPref": cust.get("categoryPref", "General"),
            "createdAt": cust.get("lastPurchaseAt")
        },
        "history": history
    }

@app.get("/api/retail/customers/{id}")
def get_customer_360(id: int):
    cust = next((c for c in CUSTOMERS if c["id"] == id), None)
    if not cust:
        cust = CUSTOMERS[0] if CUSTOMERS else {"id": id, "name": f"Customer #{id}", "phone": None, "email": None, "orders": 0, "spend": 0, "aov": 0, "recencyDays": 0, "segment": "New"}
    
    orders_cnt = cust.get("orders", 0)
    spend_val = cust.get("spend", 0)
    aov_val = cust.get("aov", 0)
    recency = cust.get("recencyDays", 0)
    
    history = [
        {
            "id": o["id"],
            "skuId": o.get("skuId", 1),
            "skuName": o.get("productName"),
            "units": o.get("units", 1),
            "revenue": o.get("revenue"),
            "billNo": f"BILL-{o['id']:05d}",
            "soldAt": o.get("soldAt")
        } for o in RETAIL_ORDERS if o.get("customerPhone") == cust.get("phone")
    ]
    
    points = max(50, spend_val // 10)
    ledger = [
        {"id": 1, "kind": "earned", "points": points, "note": "Reward on grocery purchases", "createdAt": cust.get("lastPurchaseAt")},
    ]

    return {
        "customer": {
            "id": cust["id"],
            "name": cust.get("name"),
            "phone": cust.get("phone"),
            "email": cust.get("email"),
            "storeName": cust.get("storeName", "Flagship Store Delhi"),
            "categoryPref": cust.get("categoryPref", "Rice & Grains")
        },
        "metrics": {
            "orders": orders_cnt,
            "spend": spend_val,
            "aov": aov_val,
            "recencyDays": recency,
            "lastPurchase": cust.get("lastPurchase"),
            "segment": cust.get("segment", "Regular").lower().replace(" ", "_")
        },
        "loyalty": {
            "balance": points,
            "ledger": ledger
        },
        "history": history
    }

@app.post("/api/retail/customers/{id}/redeem")
async def redeem_customer_points(id: int, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    points = int(body.get("points") or 50)
    return {"balance": max(0, 500 - points)}

@app.get("/api/retail/manager/orders")
def get_manager_orders(q: str = None, status: str = None, paymentMethod: str = None, agentId: str = None):
    results = list(RETAIL_ORDERS)
    if status:
        results = [o for o in results if (o.get("orderStatus") or "").lower() == status.lower()]
    if paymentMethod:
        results = [o for o in results if (o.get("paymentMethod") or "").lower() == paymentMethod.lower()]
    if q:
        q_low = q.lower().strip()
        results = [o for o in results if q_low in (o.get("customerName") or "").lower() or q_low in (o.get("customerPhone") or "").lower() or q_low in (o.get("productName") or "").lower()]
    return {"orders": results}

@app.post("/api/retail/manager/orders/{id}/status")
async def update_single_order_status(id: int, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    st = body.get("status", "confirmed")
    for o in RETAIL_ORDERS:
        if o["id"] == id:
            o["orderStatus"] = st
    return {"success": True}

@app.post("/api/retail/manager/orders/status")
async def bulk_update_order_status(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    ids = body.get("ids", [])
    st = body.get("status", "confirmed")
    count = 0
    for o in RETAIL_ORDERS:
        if o["id"] in ids:
            o["orderStatus"] = st
            count += 1
    return {"success": True, "count": count}

@app.get("/api/retail/manager/board")
def manager_board(date: str = None):
    won_count = sum(1 for w in WALKINS if w.get("status") == "won")
    lost_count = sum(1 for w in WALKINS if w.get("status") == "lost")
    total_footfall = AGENT_DAILY["footfall"] + len(WALKINS) - 2
    total_footfall = max(total_footfall, won_count + lost_count, 1)
    total_bills = AGENT_DAILY["bills"] + sum(1 for w in WALKINS if w.get("status") == "won") - 1
    total_units = AGENT_DAILY["units"] + sum(w.get("units", 0) for w in WALKINS if w.get("status") == "won") - 2
    total_rev = AGENT_DAILY["revenue"] + sum(w.get("revenue", 0) for w in WALKINS if w.get("status") == "won") - 1450
    conv = round((won_count / max(1, total_footfall)) * 100, 1) if total_footfall > 0 else 0.0

    return {
        "date": date or datetime.utcnow().strftime("%Y-%m-%d"),
        "role": "store_manager",
        "kpis": {
            "demos": AGENT_DAILY["demos"],
            "bills": max(0, total_bills),
            "units": max(0, total_units),
            "revenue": max(0, total_rev),
            "footfall": max(1, total_footfall),
            "won": won_count,
            "lost": lost_count,
            "conversion": conv
        },
        "agents": [
            {"agentId": 1, "name": "Cashier Rahul", "walkins": len(WALKINS), "demos": AGENT_DAILY["demos"], "bills": max(0, total_bills), "units": max(0, total_units), "revenue": max(0, total_rev)},
            {"agentId": 2, "name": "Cashier Priya", "walkins": 12, "demos": 5, "bills": 10, "units": 45, "revenue": 18500}
        ],
        "targets": {"revenue": 200000, "bills": 120},
        "hourly": [
            {"slot": "10-12", "today": 40, "yesterday": 35},
            {"slot": "12-14", "today": 60, "yesterday": 55},
            {"slot": "14-16", "today": 50, "yesterday": 60},
            {"slot": "16-18", "today": 75, "yesterday": 68},
            {"slot": "18-20", "today": 90, "yesterday": 82}
        ],
        "week": [
            {"date": "2026-07-27", "footfall": 215, "demos": 60, "bills": 54, "revenue": 90000},
            {"date": "2026-07-28", "footfall": 218, "demos": 70, "bills": 66, "revenue": 120000},
            {"date": "2026-07-29", "footfall": 222, "demos": 90, "bills": 77, "revenue": 180000},
            {"date": "2026-07-30", "footfall": 230, "demos": 120, "bills": 80, "revenue": 250000},
            {"date": "2026-07-31", "footfall": 325, "demos": 120, "bills": 98, "revenue": 450000},
            {"date": "2026-08-01", "footfall": 420, "demos": 80, "bills": 105, "revenue": 150000},
            {"date": "2026-08-02", "footfall": total_footfall, "demos": AGENT_DAILY["demos"], "bills": total_bills, "revenue": total_rev}
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
        "totals": {
            "footfall": AGENT_DAILY["footfall"],
            "bills": AGENT_DAILY["bills"],
            "units": AGENT_DAILY["units"],
            "revenue": AGENT_DAILY["revenue"]
        },
        "closed": False,
        "lockedAt": None
    }

@app.get("/api/retail/manager/activity")
def manager_activity():
    activity = []
    for w in WALKINS[:15]:
        activity.append({
            "id": w["id"],
            "customerName": w.get("customerName", "Shopper"),
            "customerPhone": w.get("customerPhone", "—"),
            "status": w.get("status", "open"),
            "skuName": w.get("skuName") or "General Groceries",
            "lastOutcome": w.get("lastOutcome") or "In Store Walk-in",
            "revenue": w.get("revenue", 0)
        })
    return {
        "activity": activity
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
            {"id": 1, "name": "Weekend Grocery Mega Sale", "channel": "whatsapp", "targetSegment": "all", "status": "sent", "recipientCount": len(CUSTOMERS), "sentAt": datetime.utcnow().isoformat()}
        ]
    }

@app.get("/api/retail/distributors")
def distributors():
    return {
        "total": 4,
        "distributors": SUPPLIERS
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


# =========================================================================
# AI DATA WAREHOUSE, PREDICTION & FORECASTING ENGINE
# =========================================================================

from fastapi import HTTPException
from ai_engine import GroceryAIEngine
from mlops.inference_engine import InferenceEngine
from warehouse.warehouse_engine import DataWarehouse
from warehouse.activity_logger import ActivityLogger
from warehouse.feature_pipeline import FeaturePipeline

# Initialise AI Data Warehouse on startup
warehouse = DataWarehouse()
warehouse.initialise()
activity_logger = ActivityLogger(warehouse)
feature_pipeline = FeaturePipeline(warehouse)

ai_engine = GroceryAIEngine({
    "products": PRODUCTS,
    "customers": CUSTOMERS,
    "orders": ORDERS
})
mlops_engine = InferenceEngine(warehouse=warehouse)

def get_user_role_and_scope(request: Request):
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

    user_info = ROLE_BY_EMAIL.get(email, {"role": "superadmin", "bypass": True, "readOnly": False})
    role = user_info.get("role", "superadmin")
    return role, user_info


def verify_ai_access(request: Request):
    """
    RBAC Guard: Ensures ONLY eligible roles have access to forecasting dashboards & MLOps administration.
    Allowed Roles: superadmin, brand, distributor, partner, store_manager.
    EXCLUDED: store_associate (returns 403 Forbidden).
    """
    role, user_info = get_user_role_and_scope(request)
    if role == "store_associate":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Store Associate role is not authorized to access AI Forecasting dashboards."
        )
    return role, user_info


@app.get("/api/ai/overview")
def get_ai_overview(request: Request, horizon: int = 30):
    role, scope = verify_ai_access(request)
    return ai_engine.get_overview(role=role, scope=scope, horizon=horizon)


@app.get("/api/ai/sales")
def get_ai_sales(request: Request, horizon: str = "month"):
    role, scope = verify_ai_access(request)
    return ai_engine.get_sales_forecast(horizon_type=horizon, role=role, scope=scope)


@app.get("/api/ai/demand")
def get_ai_demand(request: Request, category: str = None):
    role, scope = verify_ai_access(request)
    return ai_engine.get_demand_prediction(category_filter=category, role=role, scope=scope)


@app.get("/api/ai/inventory")
def get_ai_inventory(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_inventory_forecast(role=role, scope=scope)


@app.get("/api/ai/reorder")
def get_ai_reorder(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_reorder_recommendations(role=role, scope=scope)


@app.post("/api/ai/reorder/create-po")
async def create_auto_po(request: Request):
    role, scope = verify_ai_access(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    return {
        "success": True,
        "poNumber": f"PO-AI-{random.randint(10000, 99999)}",
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "status": "APPROVED_BY_AI",
        "itemsCount": len(body.get("items", [1])),
        "totalAmount": body.get("totalAmount", 125000),
        "supplier": body.get("supplier", "North Foods LLC"),
        "message": "AI Smart Purchase Order created and dispatched to supplier ERP."
    }


@app.get("/api/ai/expiry")
def get_ai_expiry(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_expiry_prediction(role=role, scope=scope)


@app.get("/api/ai/customers")
def get_ai_customers(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_customer_intelligence(role=role, scope=scope)


@app.get("/api/ai/promotions")
def get_ai_promotions(request: Request, promoType: str = "20%", category: str = "All"):
    role, scope = verify_ai_access(request)
    return ai_engine.simulate_promotion(promo_type=promoType, target_category=category, role=role, scope=scope)


@app.post("/api/ai/promotions/simulate")
async def post_simulate_promo(request: Request):
    role, scope = verify_ai_access(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    promo_type = body.get("promoType", "20%")
    target_category = body.get("category", "All")
    return ai_engine.simulate_promotion(promo_type=promo_type, target_category=target_category, role=role, scope=scope)


@app.get("/api/ai/insights")
def get_ai_insights(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_ai_insights(role=role, scope=scope)


@app.get("/api/ai/models")
def get_ai_models(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_model_performance()


@app.get("/api/ai/settings")
def get_ai_settings(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.get_settings()


@app.post("/api/ai/settings")
async def update_ai_settings(request: Request):
    role, scope = verify_ai_access(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    return ai_engine.update_settings(body)


@app.post("/api/ai/retrain")
def trigger_ai_retraining(request: Request):
    role, scope = verify_ai_access(request)
    return ai_engine.trigger_retrain()


# =========================================================================
# MLOPS SELF-LEARNING & TELEMETRY ENDPOINTS
# =========================================================================

@app.get("/api/ai/mlops/telemetry")
def get_mlops_telemetry(request: Request):
    role, scope = verify_ai_access(request)
    return mlops_engine.get_telemetry()


@app.get("/api/ai/mlops/models")
def get_mlops_models(request: Request):
    role, scope = verify_ai_access(request)
    return mlops_engine.orchestrator.get_model_registry()


@app.get("/api/ai/mlops/drift")
def get_mlops_drift(request: Request):
    role, scope = verify_ai_access(request)
    return mlops_engine.orchestrator.compute_drift_metrics()


@app.post("/api/ai/mlops/retrain")
def trigger_mlops_retrain(request: Request):
    role, scope = verify_ai_access(request)
    return mlops_engine.trigger_self_learning_retrain()


@app.post("/api/ai/mlops/simulate")
async def simulate_mlops_scenario(request: Request):
    role, scope = verify_ai_access(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    scenario_type = body.get("scenarioType", "price_elasticity")
    params = body.get("params", {})
    return mlops_engine.simulate_scenario(scenario_type, params)


@app.get("/api/ai/mlops/anomalies")
def get_mlops_anomalies(request: Request):
    role, scope = verify_ai_access(request)
    return mlops_engine.get_anomalies()


@app.post("/api/ai/ask")
async def post_ai_ask(request: Request):
    role, scope = get_user_role_and_scope(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    question = body.get("question", "") or body.get("query", "") or body.get("prompt", "")
    return mlops_engine.answer_query(question=question, role=role, scope=scope)


@app.get("/api/ai/ask")
def get_ai_ask(request: Request, q: str = ""):
    role, scope = get_user_role_and_scope(request)
    return mlops_engine.answer_query(question=q, role=role, scope=scope)


# =========================================================================
# UNIVERSAL CDC ACTIVITY LOGGING MIDDLEWARE
# =========================================================================

@app.middleware("http")
async def cdc_activity_middleware(request: Request, call_next):
    """
    Universal CDC middleware that transparently captures all business mutations
    (POST/PUT/PATCH/DELETE) and logs them into fact_audit_log in real-time.
    """
    response = await call_next(request)

    method = request.method
    path = request.url.path

    # Only intercept state-mutating requests (exclude read queries & internal ask queries)
    if method in ("POST", "PUT", "PATCH", "DELETE") and not path.startswith(("/api/ai/ask", "/api/ai/warehouse/log-event")):
        try:
            role, user_info = get_user_role_and_scope(request)
            email = user_info.get("email") if isinstance(user_info, dict) else None
            parts = path.strip("/").split("/")
            entity = parts[1] if len(parts) > 1 else "general"

            activity_logger.log(
                action_type=method,
                entity_type=entity,
                entity_id=path,
                user_role=role,
                user_email=email,
                endpoint=path,
                http_method=method,
                metadata={"status_code": response.status_code}
            )
        except Exception:
            pass

    return response


# =========================================================================
# AI DATA WAREHOUSE & ANALYTICS ENDPOINTS
# =========================================================================

@app.get("/api/ai/warehouse/status")
def get_warehouse_status(request: Request):
    """Returns real-time status of the Kimball Star Schema AI Data Warehouse."""
    role, scope = verify_ai_access(request)
    return warehouse.get_status()


@app.get("/api/ai/warehouse/daily-snapshot")
def get_warehouse_daily_snapshot(request: Request, limit: int = 30):
    """Returns pre-aggregated daily sales and rolling features from the warehouse."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_revenue_features(lookback_days=limit)


@app.get("/api/ai/warehouse/feature-matrix")
def get_warehouse_feature_matrix(request: Request, lookback: int = 90):
    """Returns SQL-native ML feature vectors for model training and inference."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_revenue_features(lookback_days=lookback)


@app.get("/api/ai/warehouse/audit-log")
def get_warehouse_audit_log(request: Request, limit: int = 50):
    """Returns recent Change Data Capture (CDC) events from fact_audit_log."""
    role, scope = verify_ai_access(request)
    return {
        "events": activity_logger.get_recent_events(limit=limit),
        "byActionType": activity_logger.get_event_counts_by_type(),
        "byEntityType": activity_logger.get_event_counts_by_entity(),
        "dailyVolume": activity_logger.get_daily_event_volume(days=14),
    }


@app.get("/api/ai/warehouse/quality-report")
def get_warehouse_quality_report(request: Request):
    """Returns data quality validation, missing values, and referential integrity scores."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_data_quality_report()


@app.get("/api/ai/warehouse/categories")
def get_warehouse_categories(request: Request):
    """Returns category-level velocity, revenue, and gross margin from the warehouse."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_category_demand_features()


@app.get("/api/ai/warehouse/suppliers")
def get_warehouse_suppliers(request: Request):
    """Returns supplier reliability, fill rates, and lead time metrics from the warehouse."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_supplier_performance()


@app.get("/api/ai/warehouse/inventory-health")
def get_warehouse_inventory_health(request: Request):
    """Returns SKU-level days of cover, stockout hazard probability, and reorder points."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_inventory_health()


@app.get("/api/ai/warehouse/anomalies")
def get_warehouse_anomalies(request: Request):
    """Returns statistical z-score anomaly candidates across warehouse time series."""
    role, scope = verify_ai_access(request)
    return feature_pipeline.get_anomaly_candidates()


@app.post("/api/ai/warehouse/etl/run")
def trigger_warehouse_etl(request: Request):
    """Triggers an incremental ETL run to synchronize operational data into warehouse facts."""
    role, scope = verify_ai_access(request)
    status = warehouse.run_etl()
    return {
        "success": True,
        "message": "ETL sync completed successfully.",
        "warehouseStatus": status,
    }


@app.post("/api/ai/warehouse/log-event")
async def post_warehouse_log_event(request: Request):
    """Direct CDC event ingestion endpoint for client-side business activity tracking."""
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    role, user_info = get_user_role_and_scope(request)
    email = user_info.get("email") if isinstance(user_info, dict) else None

    log_id = activity_logger.log(
        action_type=body.get("actionType", "CUSTOM_EVENT"),
        entity_type=body.get("entityType", "client_event"),
        entity_id=str(body.get("entityId", "")),
        user_role=role,
        user_email=email,
        session_id=body.get("sessionId"),
        store_id=body.get("storeId", 1),
        device_info=body.get("deviceInfo"),
        before=body.get("before"),
        after=body.get("after"),
        qty_before=body.get("qtyBefore"),
        qty_after=body.get("qtyAfter"),
        price_before=body.get("priceBefore"),
        price_after=body.get("priceAfter"),
        inv_before=body.get("invBefore"),
        inv_after=body.get("invAfter"),
        metadata=body.get("metadata"),
    )

    return {"success": True, "auditId": log_id, "timestamp": datetime.utcnow().isoformat() + "Z"}





