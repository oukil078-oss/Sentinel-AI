"""
Sentinel AI Backend Test Suite
Covers: auth, dashboard, transactions, predict, ml metrics, cases, rules, audit, live feed.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://4da656b1-71d5-4093-aaf0-6cc02c0a380e.preview.emergentagent.com",
).rstrip("/")

ADMIN_EMAIL = "analyst@sentinel.ai"
ADMIN_PASSWORD = "Sentinel2026!"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token(session):
    # Wait for any login_attempt lock from prior runs to expire? No - successful login resets.
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    if r.status_code == 429:
        pytest.skip(f"Rate limited (prior failed runs): {r.text}")
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ---------------- Health ----------------
class TestHealth:
    def test_health_ok(self, session):
        r = session.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert d["models_loaded"] is True


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "user" in d and "access_token" in d and "refresh_token" in d
        assert d["token_type"] == "bearer"
        assert d["user"]["email"] == ADMIN_EMAIL
        assert "password_hash" not in d["user"]

    def test_login_wrong_password(self, session):
        # Use a unique-ish email so brute force counter on real admin is preserved
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent_user_xyz@sentinel.ai", "password": "wrong"},
            timeout=15,
        )
        assert r.status_code in (401, 429)

    def test_me_requires_token(self, session):
        r = session.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_invalid_token(self, session):
        r = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer not.a.real.jwt"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == ADMIN_EMAIL

    def test_logout(self, session, auth_headers):
        r = session.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_logout_no_auth(self, session):
        r = session.post(f"{BASE_URL}/api/auth/logout", timeout=15)
        assert r.status_code == 401


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_stats(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_transactions", "fraud_detected", "fraud_rate",
                  "total_amount", "cases", "hourly_series", "best_model"):
            assert k in d, f"missing {k}"
        assert d["total_transactions"] >= 800, f"only {d['total_transactions']} txs"
        assert isinstance(d["cases"], dict)
        for s in ("new", "in_review", "resolved"):
            assert s in d["cases"]
        assert isinstance(d["hourly_series"], list)
        if d["best_model"]:
            assert "name" in d["best_model"]
            assert "roc_auc" in d["best_model"]


# ---------------- Transactions ----------------
class TestTransactions:
    def test_list(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/transactions", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and "total" in d
        assert d["total"] >= 800
        assert len(d["items"]) > 0
        item = d["items"][0]
        for k in ("tx_id", "amount", "merchant", "cardholder", "fraud_score", "predicted_fraud"):
            assert k in item, f"missing {k} in transaction item"

    def test_filter_fraud(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/transactions?status=fraud&limit=50",
                        headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        for it in items:
            assert it["predicted_fraud"] is True

    def test_search(self, session, auth_headers):
        # First get any merchant to search for
        r = session.get(f"{BASE_URL}/api/transactions?limit=1", headers=auth_headers, timeout=20)
        merchant = r.json()["items"][0]["merchant"]
        # Search by partial merchant name (case-insensitive)
        q = merchant[:4].lower()
        r2 = session.get(f"{BASE_URL}/api/transactions?q={q}",
                         headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        items = r2.json()["items"]
        assert len(items) > 0
        for it in items:
            hay = (it.get("merchant", "") + it.get("cardholder", "") + it.get("tx_id", "")).lower()
            assert q in hay

    def test_amount_range(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/transactions?min_amount=100&max_amount=500&limit=100",
                        headers=auth_headers, timeout=20)
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert 100 <= it["amount"] <= 500

    def test_get_single(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/transactions?limit=1", headers=auth_headers, timeout=20)
        tx_id = r.json()["items"][0]["tx_id"]
        r2 = session.get(f"{BASE_URL}/api/transactions/{tx_id}", headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["tx_id"] == tx_id

    def test_get_single_404(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/transactions/DOES_NOT_EXIST",
                        headers=auth_headers, timeout=20)
        assert r.status_code == 404

    def test_no_auth(self, session):
        r = session.get(f"{BASE_URL}/api/transactions", timeout=15)
        assert r.status_code == 401


# ---------------- Predict ----------------
class TestPredict:
    BASE_PAYLOAD = {"time": 1000.0, "amount": 250.0, "threshold": 0.5}

    @pytest.mark.parametrize("model",
                             ["random_forest", "knn", "logistic_regression", "decision_tree", "svm"])
    def test_predict_each_model(self, session, auth_headers, model):
        payload = {**self.BASE_PAYLOAD, "model": model}
        r = session.post(f"{BASE_URL}/api/predict", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200, f"{model} -> {r.status_code} {r.text}"
        d = r.json()
        for k in ("probability", "is_fraud", "risk_level", "confidence", "explanations"):
            assert k in d, f"{model} missing {k}"
        assert 0 <= d["probability"] <= 1
        assert d["risk_level"] in ("low", "medium", "high", "critical", "very_high")
        # Explanations must be top-5 non-empty for ALL models (bug fix re-test)
        assert isinstance(d["explanations"], list)
        assert len(d["explanations"]) == 5, (
            f"{model} returned {len(d['explanations'])} explanations, expected 5: {d['explanations']}"
        )
        for exp in d["explanations"]:
            assert "feature" in exp, f"{model} explanation missing feature: {exp}"
            # Should have importance or value field with a numeric ranking
            assert any(k in exp for k in ("importance", "value", "weight", "score")), (
                f"{model} explanation missing rank field: {exp}"
            )


# ---------------- Invalid ObjectId handling (bug fix re-test) ----------------
class TestInvalidObjectId:
    INVALID_ID = "not-a-valid-objectid"

    def test_get_case_invalid_id(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/cases/{self.INVALID_ID}",
                        headers=auth_headers, timeout=15)
        assert r.status_code == 400, f"expected 400 for invalid id, got {r.status_code}: {r.text}"

    def test_patch_case_invalid_id(self, session, auth_headers):
        r = session.patch(f"{BASE_URL}/api/cases/{self.INVALID_ID}",
                          headers=auth_headers, json={"status": "in_review"}, timeout=15)
        assert r.status_code == 400, f"expected 400 for invalid id, got {r.status_code}: {r.text}"

    def test_patch_rule_invalid_id(self, session, auth_headers):
        r = session.patch(f"{BASE_URL}/api/rules/{self.INVALID_ID}",
                          headers=auth_headers, json={"active": False}, timeout=15)
        assert r.status_code == 400, f"expected 400 for invalid id, got {r.status_code}: {r.text}"

    def test_delete_rule_invalid_id(self, session, auth_headers):
        r = session.delete(f"{BASE_URL}/api/rules/{self.INVALID_ID}",
                           headers=auth_headers, timeout=15)
        assert r.status_code == 400, f"expected 400 for invalid id, got {r.status_code}: {r.text}"


# ---------------- Brute-force lockout extension fix ----------------
class TestBruteForceLockout:
    """5 wrong logins -> lockout. Subsequent attempts must NOT extend the lockout window."""

    def test_lockout_does_not_extend(self, session):
        """Hit /login until at least one proxy-IP+email identifier reaches lockout,
        then verify locked_until is set ONCE (not extended on continued attempts).

        Note: K8s ingress rotates between multiple proxy IPs so identifier (ip:email)
        is split across multiple records. We loop enough times that at least one
        identifier crosses the threshold of 5.
        """
        import pymongo
        bf_email = f"bf_test_{uuid.uuid4().hex[:8]}@sentinel.ai"
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "sentinel_fraud")
        client = pymongo.MongoClient(mongo_url)
        db = client[db_name]
        db.login_attempts.delete_many({"identifier": {"$regex": bf_email}})

        # Make enough attempts that at least one proxy-IP record reaches count >= 5.
        # Empirically with 2-3 LB IPs, ~20 attempts guarantees one identifier locks.
        locked_rec = None
        for _ in range(25):
            session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": bf_email, "password": "wrong"},
                timeout=15,
            )
            locked_rec = db.login_attempts.find_one({
                "identifier": {"$regex": bf_email},
                "locked_until": {"$ne": None},
            })
            if locked_rec:
                break

        assert locked_rec is not None, (
            "No identifier reached lockout state after 25 attempts. "
            "Brute-force lockout may be broken."
        )
        first_locked_until = locked_rec["locked_until"]
        locked_identifier = locked_rec["identifier"]

        # Make 5 more failed attempts; the locked identifier's locked_until must NOT change.
        for _ in range(5):
            session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": bf_email, "password": "wrong"},
                timeout=15,
            )
            time.sleep(0.05)

        rec2 = db.login_attempts.find_one({"identifier": locked_identifier})
        second_locked_until = rec2.get("locked_until")
        assert second_locked_until == first_locked_until, (
            f"locked_until EXTENDED on continued attempts! "
            f"first={first_locked_until} second={second_locked_until} "
            f"identifier={locked_identifier}"
        )

        # Cleanup
        db.login_attempts.delete_many({"identifier": {"$regex": bf_email}})
        client.close()


# ---------------- ML Metrics ----------------
class TestMLMetrics:
    def test_metrics(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/ml/metrics", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("metrics", "feature_importance", "class_distribution",
                  "correlations", "amount_distribution", "roc_curves",
                  "pr_curves", "threshold_data", "smote_applied"):
            assert k in d, f"missing {k}"
        assert d["smote_applied"] is True
        metrics = d["metrics"]
        assert "random_forest" in metrics
        rf = metrics["random_forest"]
        for k in ("accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc", "confusion_matrix"):
            assert k in rf, f"rf missing {k}"
        assert rf["accuracy"] > 0.95, f"rf accuracy too low: {rf['accuracy']}"
        assert rf["roc_auc"] > 0.95, f"rf roc_auc too low: {rf['roc_auc']}"


# ---------------- Cases ----------------
class TestCases:
    def test_list(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/cases", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d
        assert d["total"] >= 1
        item = d["items"][0]
        for k in ("id", "title", "status", "priority", "assignee", "risk_score"):
            assert k in item, f"case missing {k}"

    def test_filter_status(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/cases?status=new", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        for c in r.json()["items"]:
            assert c["status"] == "new"

    def test_create_update_persist(self, session, auth_headers):
        # CREATE
        title = f"TEST_CASE_{uuid.uuid4().hex[:8]}"
        payload = {
            "tx_id": "TX_TEST_001",
            "title": title,
            "amount": 999.99,
            "priority": "high",
            "risk_score": 0.92,
        }
        r = session.post(f"{BASE_URL}/api/cases", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        case = r.json()
        case_id = case["id"]
        assert case["title"] == title
        assert case["status"] == "new"
        assert case["amount"] == 999.99

        # GET to verify persisted
        r2 = session.get(f"{BASE_URL}/api/cases/{case_id}", headers=auth_headers, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["title"] == title

        # PATCH status + note
        r3 = session.patch(
            f"{BASE_URL}/api/cases/{case_id}",
            headers=auth_headers,
            json={"status": "in_review", "note": "Investigating fraud pattern"},
            timeout=15,
        )
        assert r3.status_code == 200
        updated = r3.json()
        assert updated["status"] == "in_review"
        assert any(n.get("text") == "Investigating fraud pattern" for n in updated.get("notes", []))


# ---------------- Rules ----------------
class TestRules:
    def test_list(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/rules", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        for k in ("id", "name", "rule_type", "condition", "action", "severity", "active"):
            assert k in items[0], f"rule missing {k}"

    def test_create_toggle_delete(self, session, auth_headers):
        # CREATE
        name = f"TEST_RULE_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": name,
            "description": "Auto test rule",
            "rule_type": "amount",
            "condition": "amount > 7777",
            "threshold": 7777,
            "action": "flag",
            "severity": "high",
            "active": True,
        }
        r = session.post(f"{BASE_URL}/api/rules", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        rule = r.json()
        rid = rule["id"]
        assert rule["name"] == name
        assert rule["active"] is True

        # PATCH toggle off
        r2 = session.patch(
            f"{BASE_URL}/api/rules/{rid}",
            headers=auth_headers,
            json={"active": False},
            timeout=15,
        )
        assert r2.status_code == 200
        assert r2.json()["active"] is False

        # DELETE
        r3 = session.delete(f"{BASE_URL}/api/rules/{rid}", headers=auth_headers, timeout=15)
        assert r3.status_code == 200
        assert r3.json()["deleted"] is True

        # Verify removed (PATCH again -> 404)
        r4 = session.patch(
            f"{BASE_URL}/api/rules/{rid}",
            headers=auth_headers,
            json={"active": True},
            timeout=15,
        )
        assert r4.status_code == 404


# ---------------- Audit ----------------
class TestAudit:
    def test_audit_list(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/audit", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d
        # We've already triggered login & predict & create_case audit events
        actions = {it.get("action") for it in d["items"]}
        assert "login" in actions
        for it in d["items"][:5]:
            assert "actor" in it
            assert "action" in it
            assert "created_at" in it


# ---------------- Live Feed ----------------
class TestLiveFeed:
    def test_feed(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/live/feed", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0
        assert len(items) <= 20
        # should be sorted desc by timestamp
        ts = [it["timestamp"] for it in items if it.get("timestamp")]
        assert ts == sorted(ts, reverse=True)
