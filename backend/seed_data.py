"""Seed realistic demo data (transactions, rules, cases)."""
from __future__ import annotations

import random
from datetime import datetime, timezone, timedelta

import numpy as np


MERCHANTS = [
    ("Amazon", "ecommerce"), ("Netflix", "streaming"), ("Uber", "transport"),
    ("Starbucks", "food"), ("Shell", "gas"), ("Target", "retail"),
    ("Walmart", "retail"), ("Apple Store", "electronics"), ("Spotify", "streaming"),
    ("Airbnb", "travel"), ("Best Buy", "electronics"), ("McDonald's", "food"),
    ("Whole Foods", "groceries"), ("Delta Air Lines", "travel"), ("CVS Pharmacy", "pharmacy"),
    ("Lyft", "transport"), ("Chipotle", "food"), ("Nike", "retail"),
    ("Costco", "retail"), ("PayPal", "transfer"), ("Western Union", "transfer"),
    ("Crypto.com", "crypto"), ("Binance", "crypto"), ("Unknown Merchant #447", "unknown"),
]

CARDHOLDERS = [
    "Maria Jones", "James Wilson", "Sarah Chen", "Michael Davis", "Olivia Brown",
    "David Miller", "Emma Rodriguez", "Daniel Lee", "Sophia Martinez", "Matthew Taylor",
    "Isabella Anderson", "Andrew Thomas", "Mia Jackson", "Christopher White", "Amelia Harris",
    "Joshua Lewis", "Charlotte Clark", "Ryan Walker", "Harper Hall", "Brandon Young",
]

LOCATIONS = [
    ("New York, US", 40.71, -74.00), ("London, UK", 51.51, -0.13),
    ("Tokyo, JP", 35.68, 139.69), ("Singapore, SG", 1.35, 103.82),
    ("Paris, FR", 48.86, 2.35), ("Berlin, DE", 52.52, 13.40),
    ("Sydney, AU", -33.87, 151.21), ("Toronto, CA", 43.65, -79.38),
    ("Dubai, AE", 25.20, 55.27), ("Mumbai, IN", 19.08, 72.88),
    ("Lagos, NG", 6.52, 3.38), ("São Paulo, BR", -23.55, -46.63),
]

AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&q=70",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=70",
]

CARDS = [
    ("Visa", "*4432"), ("Mastercard", "*8891"), ("Amex", "*1053"),
    ("Visa", "*2204"), ("Mastercard", "*7716"), ("Discover", "*5987"),
]


def _random_transaction(engine, rng, hours_ago_max=72) -> dict:
    is_fraud = rng.random() < 0.08  # 8% fraud rate in demo
    now = datetime.now(timezone.utc)
    ts = now - timedelta(
        hours=rng.uniform(0, hours_ago_max),
        minutes=rng.uniform(0, 60),
    )
    merchant, category = random.choice(MERCHANTS)
    cardholder = random.choice(CARDHOLDERS)
    card_brand, card_last4 = random.choice(CARDS)
    location, lat, lon = random.choice(LOCATIONS)
    avatar = random.choice(AVATARS)

    if is_fraud:
        amount = round(rng.uniform(800, 9800), 2)
    else:
        amount = round(rng.lognormal(3.0, 1.2), 2)
    amount = min(amount, 25000)

    # Generate realistic V1-V28 based on fraud or not (using engine's trained distribution)
    v_vec = rng.normal(0, 1, 28)
    if is_fraud:
        v_vec[13] += rng.normal(-6.5, 2.5)
        v_vec[3] += rng.normal(4.2, 1.8)
        v_vec[9] += rng.normal(-5.5, 2.2)
        v_vec[11] += rng.normal(-4.8, 2.3)
        v_vec[16] += rng.normal(-6.2, 2.1)

    features = {f"V{i+1}": float(v_vec[i]) for i in range(28)}
    features["Time"] = float(ts.timestamp() % 172800)
    features["Amount"] = float(amount)

    # Real model prediction!
    try:
        pred = engine.predict(features, model="random_forest", threshold=0.5)
        score = pred["probability"]
        predicted_fraud = pred["is_fraud"]
        risk = pred["risk_level"]
    except Exception:
        score = 0.8 if is_fraud else 0.05
        predicted_fraud = is_fraud
        risk = "high" if is_fraud else "low"

    tx_id = f"TX-{int(ts.timestamp())}-{rng.integers(1000, 9999)}"

    return {
        "tx_id": tx_id,
        "timestamp": ts,
        "amount": amount,
        "currency": "USD",
        "merchant": merchant,
        "category": category,
        "cardholder": cardholder,
        "card_brand": card_brand,
        "card_last4": card_last4,
        "location": location,
        "lat": lat, "lon": lon,
        "avatar": avatar,
        "fraud_score": round(float(score), 4),
        "predicted_fraud": bool(predicted_fraud),
        "risk_level": risk,
        "is_ground_truth_fraud": is_fraud,
        **features,
    }


async def seed_demo_transactions(db, engine, target: int = 800):
    existing = await db.transactions.count_documents({})
    if existing >= target:
        print(f"[seed] {existing} transactions already present, skipping")
        return
    rng = np.random.default_rng(seed=7)
    to_insert = [_random_transaction(engine, rng) for _ in range(target - existing)]
    if to_insert:
        await db.transactions.insert_many(to_insert)
        print(f"[seed] Inserted {len(to_insert)} transactions")


async def seed_rules(db):
    existing = await db.rules.count_documents({})
    if existing > 0:
        return
    rules = [
        {"name": "High Amount Alert", "description": "Flag transactions above $5,000",
         "rule_type": "amount", "condition": "amount > 5000", "threshold": 5000,
         "action": "flag", "severity": "high", "active": True, "hits": 47,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
        {"name": "Velocity Check", "description": "Flag 5+ transactions per minute from same card",
         "rule_type": "velocity", "condition": "tx_count > 5 in 60s", "threshold": 5,
         "action": "review", "severity": "medium", "active": True, "hits": 23,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
        {"name": "Geographic Impossibility", "description": "Block if tx > 500km apart within 1h",
         "rule_type": "geo", "condition": "distance_km > 500 in 3600s", "threshold": 500,
         "action": "block", "severity": "critical", "active": True, "hits": 8,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
        {"name": "Crypto Merchant Review", "description": "Review all crypto merchant transactions",
         "rule_type": "merchant", "condition": "category == 'crypto'", "threshold": 0,
         "action": "review", "severity": "medium", "active": True, "hits": 56,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
        {"name": "Off-Hours Large Purchase", "description": "Flag > $2,000 between 1AM-5AM",
         "rule_type": "time", "condition": "amount > 2000 AND hour in [1,2,3,4,5]", "threshold": 2000,
         "action": "flag", "severity": "high", "active": True, "hits": 19,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
        {"name": "Unknown Merchant Block", "description": "Block all transactions from unverified merchants",
         "rule_type": "merchant", "condition": "merchant in blocklist", "threshold": 0,
         "action": "block", "severity": "critical", "active": False, "hits": 3,
         "created_by": "system", "created_at": datetime.now(timezone.utc)},
    ]
    await db.rules.insert_many(rules)
    print(f"[seed] Inserted {len(rules)} default rules")


async def seed_cases(db, engine):
    existing = await db.cases.count_documents({})
    if existing > 0:
        return
    # Build cases from the highest-risk transactions
    txs = await db.transactions.find({"predicted_fraud": True}).sort("fraud_score", -1).limit(18).to_list(18)
    if not txs:
        return
    priorities_by_risk = {"critical": "critical", "high": "high", "medium": "medium", "low": "low"}
    statuses = ["new", "new", "new", "in_review", "in_review", "escalated", "resolved", "false_positive"]
    assignees = ["analyst@sentinel.ai", "j.wilson@sentinel.ai", "a.patel@sentinel.ai"]

    cases = []
    for i, tx in enumerate(txs):
        case_id = f"CASE-{datetime.now().strftime('%Y%m')}-{1000 + i}"
        cases.append({
            "case_id": case_id,
            "tx_id": tx["tx_id"],
            "title": f"Suspicious ${tx['amount']:.2f} charge at {tx['merchant']}",
            "description": f"High fraud score ({tx['fraud_score']:.2%}) detected on {tx['card_brand']} {tx['card_last4']} "
                           f"for {tx['cardholder']}. Transaction originated from {tx['location']}. "
                           f"Features V14, V17, and V10 show strong fraud signals.",
            "amount": tx["amount"],
            "priority": priorities_by_risk.get(tx["risk_level"], "medium"),
            "status": statuses[i % len(statuses)],
            "assignee": assignees[i % len(assignees)],
            "risk_score": tx["fraud_score"],
            "merchant": tx["merchant"],
            "cardholder": tx["cardholder"],
            "avatar": tx.get("avatar"),
            "notes": [{"author": "system", "text": "Case auto-generated from fraud detection pipeline",
                       "created_at": datetime.now(timezone.utc).isoformat()}],
            "created_by": "system",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=i * 3),
            "updated_at": datetime.now(timezone.utc) - timedelta(hours=i * 2),
        })
    await db.cases.insert_many(cases)
    print(f"[seed] Inserted {len(cases)} cases")
