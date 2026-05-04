"""
Sentinel AI — Fraud Detection Platform Backend
FastAPI + MongoDB + real scikit-learn models with SMOTE
"""
from dotenv import load_dotenv
load_dotenv()

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from models import (
    LoginRequest, PredictRequest, CaseCreate, CaseUpdate,
    RuleCreate, RuleUpdate, TransactionFilter
)
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user_dep
)
from ml_engine import FraudEngine
from seed_data import seed_demo_transactions, seed_rules, seed_cases

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sentinel")

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
engine = FraudEngine(model_dir=str(Path(__file__).parent / "models_cache"))


# ---------------------------------------------------------------------------
# Lifespan — seed admin, train models, seed demo data
# ---------------------------------------------------------------------------
async def seed_admin():
    """Create or update admin user."""
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Sentinel Analyst",
            "role": "senior_analyst",
            "avatar_url": "https://images.unsplash.com/photo-1680104072720-ae824ef15c0e?w=200&h=200&fit=crop",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"✓ Seeded admin user: {ADMIN_EMAIL}")
    else:
        if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info(f"✓ Updated admin password for: {ADMIN_EMAIL}")


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.transactions.create_index("timestamp")
    await db.transactions.create_index("tx_id", unique=True)
    await db.transactions.create_index("fraud_score")
    await db.cases.create_index("created_at")
    await db.cases.create_index("status")
    await db.rules.create_index("active")
    await db.audit_log.create_index("created_at")


async def train_models_async():
    """Train ML models in background thread on startup."""
    try:
        if engine.is_trained():
            logger.info("✓ Loading cached ML models from disk")
            engine.load()
        else:
            logger.info("⟳ Training ML models (this runs once, ~30s)...")
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, engine.train_all)
            logger.info("✓ Models trained and saved")
        metrics = engine.get_all_metrics()
        await db.ml_metrics.delete_many({})
        await db.ml_metrics.insert_one({
            "metrics": metrics,
            "trained_at": datetime.now(timezone.utc),
            "dataset_size": engine.dataset_size,
            "smote_applied": True,
        })
    except Exception as e:
        logger.exception(f"Model training failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    await seed_admin()

    # Train models and seed demo data in parallel on startup
    await train_models_async()
    await seed_demo_transactions(db, engine, target=800)
    await seed_rules(db)
    await seed_cases(db, engine)

    logger.info("🚀 Sentinel AI backend ready")
    yield
    client.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Sentinel AI — Fraud Detection API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    return db


async def get_current_user(request: Request):
    return await get_current_user_dep(request, db)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "sentinel-ai",
        "models_loaded": engine.is_loaded(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/auth/login")
async def login(payload: LoginRequest, request: Request):
    email = payload.email.strip().lower()

    # Brute force protection
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)

    user["_id"] = uid
    user.pop("password_hash", None)
    if "created_at" in user and isinstance(user["created_at"], datetime):
        user["created_at"] = user["created_at"].isoformat()

    await db.audit_log.insert_one({
        "actor": email,
        "action": "login",
        "target": None,
        "created_at": datetime.now(timezone.utc),
        "ip": ip,
    })

    return {"user": user, "access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@app.get("/api/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}


@app.post("/api/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    await db.audit_log.insert_one({
        "actor": user["email"],
        "action": "logout",
        "target": None,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Logged out"}


# ---------------------------------------------------------------------------
# Dashboard / KPIs
# ---------------------------------------------------------------------------
@app.get("/api/dashboard/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    total_tx = await db.transactions.count_documents({})
    fraud_tx = await db.transactions.count_documents({"predicted_fraud": True})
    total_amount_pipeline = await db.transactions.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    total_amount = total_amount_pipeline[0]["total"] if total_amount_pipeline else 0

    fraud_amount_pipeline = await db.transactions.aggregate([
        {"$match": {"predicted_fraud": True}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    fraud_amount = fraud_amount_pipeline[0]["total"] if fraud_amount_pipeline else 0

    cases_new = await db.cases.count_documents({"status": "new"})
    cases_review = await db.cases.count_documents({"status": "in_review"})
    cases_resolved = await db.cases.count_documents({"status": "resolved"})

    # Fraud by hour for last 24h
    hourly = await db.transactions.aggregate([
        {"$group": {
            "_id": {"$hour": "$timestamp"},
            "total": {"$sum": 1},
            "fraud": {"$sum": {"$cond": ["$predicted_fraud", 1, 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]).to_list(24)
    hourly_series = [{"hour": h["_id"], "total": h["total"], "fraud": h["fraud"]} for h in hourly]

    metrics_doc = await db.ml_metrics.find_one({}, sort=[("trained_at", -1)])
    best_model = None
    if metrics_doc:
        metrics = metrics_doc.get("metrics", {})
        if metrics:
            best_model = max(metrics.items(), key=lambda kv: kv[1].get("roc_auc", 0))
            best_model = {"name": best_model[0], **best_model[1]}

    return {
        "total_transactions": total_tx,
        "fraud_detected": fraud_tx,
        "fraud_rate": (fraud_tx / total_tx * 100) if total_tx else 0,
        "total_amount": round(total_amount, 2),
        "fraud_amount": round(fraud_amount, 2),
        "amount_saved": round(fraud_amount, 2),
        "cases": {"new": cases_new, "in_review": cases_review, "resolved": cases_resolved},
        "hourly_series": hourly_series,
        "best_model": best_model,
    }


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------
@app.get("/api/transactions")
async def list_transactions(
    user: dict = Depends(get_current_user),
    status_filter: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    min_amount: float | None = Query(None),
    max_amount: float | None = Query(None),
    limit: int = Query(50, le=200),
    skip: int = Query(0, ge=0),
):
    query = {}
    if status_filter == "fraud":
        query["predicted_fraud"] = True
    elif status_filter == "legitimate":
        query["predicted_fraud"] = False
    if min_amount is not None:
        query.setdefault("amount", {})["$gte"] = min_amount
    if max_amount is not None:
        query.setdefault("amount", {})["$lte"] = max_amount
    if q:
        query["$or"] = [
            {"tx_id": {"$regex": q, "$options": "i"}},
            {"merchant": {"$regex": q, "$options": "i"}},
            {"cardholder": {"$regex": q, "$options": "i"}},
        ]

    cursor = db.transactions.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    # serialize datetime
    for it in items:
        if isinstance(it.get("timestamp"), datetime):
            it["timestamp"] = it["timestamp"].isoformat()
    total = await db.transactions.count_documents(query)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@app.get("/api/transactions/{tx_id}")
async def get_transaction(tx_id: str, user: dict = Depends(get_current_user)):
    tx = await db.transactions.find_one({"tx_id": tx_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaction not found")
    if isinstance(tx.get("timestamp"), datetime):
        tx["timestamp"] = tx["timestamp"].isoformat()
    return tx


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------
@app.post("/api/predict")
async def predict(payload: PredictRequest, user: dict = Depends(get_current_user)):
    if not engine.is_loaded():
        raise HTTPException(503, "Models not yet loaded. Try again in a few seconds.")

    features = {f"V{i}": getattr(payload, f"v{i}", 0.0) for i in range(1, 29)}
    features["Time"] = payload.time
    features["Amount"] = payload.amount

    result = engine.predict(features, model=payload.model, threshold=payload.threshold)

    await db.audit_log.insert_one({
        "actor": user["email"],
        "action": "predict",
        "target": payload.model,
        "result": result,
        "created_at": datetime.now(timezone.utc),
    })

    return result


# ---------------------------------------------------------------------------
# ML Metrics / Training
# ---------------------------------------------------------------------------
@app.get("/api/ml/metrics")
async def ml_metrics(user: dict = Depends(get_current_user)):
    doc = await db.ml_metrics.find_one({}, sort=[("trained_at", -1)])
    if not doc:
        return {"metrics": {}, "trained_at": None, "dataset_size": 0, "smote_applied": False}
    return {
        "metrics": doc.get("metrics", {}),
        "trained_at": doc["trained_at"].isoformat() if doc.get("trained_at") else None,
        "dataset_size": doc.get("dataset_size", 0),
        "smote_applied": doc.get("smote_applied", True),
        "feature_importance": engine.feature_importance(),
        "class_distribution": engine.class_distribution(),
        "correlations": engine.correlations(),
        "amount_distribution": engine.amount_distribution(),
        "roc_curves": engine.roc_curves(),
        "pr_curves": engine.pr_curves(),
        "threshold_data": engine.threshold_sweep(),
    }


@app.post("/api/ml/retrain")
async def ml_retrain(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("admin", "senior_analyst"):
        raise HTTPException(403, "Only senior analysts can retrain models")
    await train_models_async()
    await db.audit_log.insert_one({
        "actor": user["email"],
        "action": "retrain_models",
        "created_at": datetime.now(timezone.utc),
    })
    return {"status": "retrained", "metrics": engine.get_all_metrics()}


# ---------------------------------------------------------------------------
# Cases
# ---------------------------------------------------------------------------
@app.get("/api/cases")
async def list_cases(
    user: dict = Depends(get_current_user),
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = Query(None),
    limit: int = Query(50, le=200),
    skip: int = Query(0, ge=0),
):
    query = {}
    if status_filter:
        query["status"] = status_filter
    if priority:
        query["priority"] = priority
    cursor = db.cases.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    for c in items:
        c["id"] = str(c.pop("_id"))
        if isinstance(c.get("created_at"), datetime):
            c["created_at"] = c["created_at"].isoformat()
        if isinstance(c.get("updated_at"), datetime):
            c["updated_at"] = c["updated_at"].isoformat()
    total = await db.cases.count_documents(query)
    return {"items": items, "total": total}


@app.get("/api/cases/{case_id}")
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    c = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not c:
        raise HTTPException(404, "Case not found")
    c["id"] = str(c.pop("_id"))
    if isinstance(c.get("created_at"), datetime):
        c["created_at"] = c["created_at"].isoformat()
    if isinstance(c.get("updated_at"), datetime):
        c["updated_at"] = c["updated_at"].isoformat()
    return c


@app.post("/api/cases")
async def create_case(payload: CaseCreate, user: dict = Depends(get_current_user)):
    doc = {
        "case_id": payload.case_id or f"CASE-{int(datetime.now().timestamp())}",
        "tx_id": payload.tx_id,
        "title": payload.title,
        "description": payload.description,
        "amount": payload.amount,
        "priority": payload.priority,
        "status": "new",
        "assignee": payload.assignee or user["email"],
        "risk_score": payload.risk_score,
        "notes": [],
        "created_by": user["email"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.cases.insert_one(doc)
    await db.audit_log.insert_one({
        "actor": user["email"], "action": "create_case", "target": doc["case_id"],
        "created_at": datetime.now(timezone.utc),
    })
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    return doc


@app.patch("/api/cases/{case_id}")
async def update_case(case_id: str, payload: CaseUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in payload.model_dump(exclude_none=True).items() if k != "note"}
    update_fields["updated_at"] = datetime.now(timezone.utc)
    update_op: dict = {"$set": update_fields}
    if payload.note:
        update_op["$push"] = {
            "notes": {
                "author": user["email"],
                "text": payload.note,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        }
    result = await db.cases.update_one({"_id": ObjectId(case_id)}, update_op)
    if result.matched_count == 0:
        raise HTTPException(404, "Case not found")
    await db.audit_log.insert_one({
        "actor": user["email"], "action": "update_case", "target": case_id,
        "details": update_fields, "created_at": datetime.now(timezone.utc),
    })
    c = await db.cases.find_one({"_id": ObjectId(case_id)})
    c["id"] = str(c.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(c.get(k), datetime):
            c[k] = c[k].isoformat()
    return c


# ---------------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------------
@app.get("/api/rules")
async def list_rules(user: dict = Depends(get_current_user)):
    items = await db.rules.find({}).sort("created_at", -1).to_list(100)
    for r in items:
        r["id"] = str(r.pop("_id"))
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return {"items": items}


@app.post("/api/rules")
async def create_rule(payload: RuleCreate, user: dict = Depends(get_current_user)):
    doc = {
        "name": payload.name,
        "description": payload.description,
        "rule_type": payload.rule_type,
        "condition": payload.condition,
        "threshold": payload.threshold,
        "action": payload.action,
        "severity": payload.severity,
        "active": payload.active,
        "hits": 0,
        "created_by": user["email"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.rules.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    await db.audit_log.insert_one({
        "actor": user["email"], "action": "create_rule", "target": payload.name,
        "created_at": datetime.now(timezone.utc),
    })
    return doc


@app.patch("/api/rules/{rule_id}")
async def update_rule(rule_id: str, payload: RuleUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    result = await db.rules.update_one({"_id": ObjectId(rule_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(404, "Rule not found")
    r = await db.rules.find_one({"_id": ObjectId(rule_id)})
    r["id"] = str(r.pop("_id"))
    if isinstance(r.get("created_at"), datetime):
        r["created_at"] = r["created_at"].isoformat()
    return r


@app.delete("/api/rules/{rule_id}")
async def delete_rule(rule_id: str, user: dict = Depends(get_current_user)):
    result = await db.rules.delete_one({"_id": ObjectId(rule_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Rule not found")
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------
@app.get("/api/audit")
async def list_audit(
    user: dict = Depends(get_current_user),
    limit: int = Query(50, le=200),
    skip: int = Query(0, ge=0),
):
    cursor = db.audit_log.find({}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    for item in items:
        item["id"] = str(item.pop("_id"))
        if isinstance(item.get("created_at"), datetime):
            item["created_at"] = item["created_at"].isoformat()
        # Sanitize any remaining ObjectIds in details
        if "details" in item and isinstance(item["details"], dict):
            for k, v in list(item["details"].items()):
                if isinstance(v, datetime):
                    item["details"][k] = v.isoformat()
                elif isinstance(v, ObjectId):
                    item["details"][k] = str(v)
    total = await db.audit_log.count_documents({})
    return {"items": items, "total": total}


# ---------------------------------------------------------------------------
# Live feed — real transactions from DB
# ---------------------------------------------------------------------------
@app.get("/api/live/feed")
async def live_feed(user: dict = Depends(get_current_user), limit: int = Query(20, le=100)):
    cursor = db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    for it in items:
        if isinstance(it.get("timestamp"), datetime):
            it["timestamp"] = it["timestamp"].isoformat()
    return {"items": items}
