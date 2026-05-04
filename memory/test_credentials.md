# Sentinel AI — Test Credentials

## Admin / Senior Analyst (pre-seeded)

| Field | Value |
|---|---|
| Email | `analyst@sentinel.ai` |
| Password | `Sentinel2026!` |
| Role | `senior_analyst` |
| Name | `Sentinel Analyst` |

## Auth Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Exchange email+password for JWT |
| GET  | `/api/auth/me` | Return current user (requires `Authorization: Bearer <token>`) |
| POST | `/api/auth/logout` | Invalidate client session (requires bearer) |

## How login works
- Backend returns `{ user, access_token, refresh_token, token_type: "bearer" }`.
- Frontend stores `access_token` in `localStorage["sentinel_token"]` and attaches it as `Authorization: Bearer <token>` on every request via an axios interceptor.
- Brute-force: 5 wrong logins per IP+email → 15 min lockout.

## Quick curl test
```bash
API=https://4da656b1-71d5-4093-aaf0-6cc02c0a380e.preview.emergentagent.com
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
    -d '{"email":"analyst@sentinel.ai","password":"Sentinel2026!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

## Seeded data
- **Transactions**: 800 (scored by real Random Forest; ~62 flagged as fraud)
- **Rules**: 6 default fraud rules (amount / velocity / geo / time / merchant)
- **Cases**: 18 auto-generated from top-risk transactions (mixed new / in_review / escalated / resolved / false_positive)
- **ML models**: Random Forest, KNN, Logistic Regression, Decision Tree, SVM — all trained on 30K synthetic PCA-schema dataset with SMOTE
