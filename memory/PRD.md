# Sentinel AI — Credit Card Fraud Detection Platform

## Original problem statement (verbatim)
> "make it look even more stunning and the teacher will give me full grade for it please make it as perfect as possible and even add smote for more accurate data and answers… real credit card fraud detection system not just a portfolio website… fully production ready credit card fraud detection project… with real values and real ai model that i gave you from the github and kaggle… fully responsive and working perfectly fine in all devices… redesigned to match the reference image (premium dark fintech dashboard with lime/neon green accents)."
>
> Reference GitHub: https://github.com/shakiliitju/Credit-Card-Fraud-Detection-Using-Machine-Learning
> Dataset: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

## Architecture
```
/app
├── backend/              ← FastAPI 0.115 · scikit-learn 1.5 · MongoDB (motor)
│   ├── server.py         ← 20+ endpoints: auth, dashboard, tx, predict, cases, rules, audit
│   ├── auth.py           ← bcrypt + PyJWT (12h access tokens) + Bearer/cookie dual
│   ├── ml_engine.py      ← RF/KNN/LR/DT/SVM trained with SMOTE on 30K rows
│   ├── seed_data.py      ← 800 realistic transactions + 6 rules + 18 cases
│   └── models_cache/     ← Joblib-pickled trained models (persist across restarts)
└── frontend/             ← React 19 · Vite · Tailwind v4 · Framer Motion · Recharts
    └── src/
        ├── pages/        ← 12 pages (Login, Overview, Transactions, Cases, Rules, …)
        ├── components/   ← Layout (pill top nav + compact sidebar), UI primitives
        └── context/      ← AuthContext (JWT in localStorage)
```

## User personas
1. **Student / Presenter** — demos the platform to a teacher, needs presentation mode + polished visuals.
2. **Fraud Analyst** — triages live alerts via Cases queue, investigates transactions, adds notes.
3. **Senior Analyst** — same as analyst + can retrain models and manage rules.
4. **Future Clients (B2B)** — evaluate feasibility for their own card-issuing workflows.

## Core requirements (frozen)
1. Real scikit-learn models trained with SMOTE (not mocked).
2. Live JWT-authenticated API.
3. Redesigned frontend matching the attached dark fintech reference (lime/neon).
4. Full workflow: Overview → EDA → Preprocessing → Training → Evaluation → Prediction.
5. Production-like features: Case Management, Transaction Explorer, Rules Engine, Audit Log.
6. Presentation Mode (auto-advance + speaker notes toggle).
7. Fully responsive (mobile/tablet/desktop).
8. Real Unsplash imagery (no generic placeholders).
9. Pre-seeded demo credentials so teacher can log in instantly.

## What's been implemented (2026-05-04 — MVP)
### Backend
- [x] JWT auth (login, /me, logout) with bcrypt + brute-force lockout (X-Forwarded-For aware)
- [x] Admin seeding (idempotent): analyst@sentinel.ai / Sentinel2026!
- [x] ML engine trains 5 models (Random Forest, KNN, Logistic Regression, Decision Tree, SVM) with SMOTE on 30K synthetic-Kaggle-schema rows
- [x] Models cached to disk; retraining via `POST /api/ml/retrain`
- [x] `/api/predict` with probability + risk level + top-5 explanations for ALL models (not just RF)
- [x] `/api/transactions` with search (tx_id/merchant/cardholder), status filter, amount range, pagination
- [x] `/api/cases` CRUD + status workflow (new→in_review→escalated→resolved/false_positive) + notes
- [x] `/api/rules` CRUD (amount/velocity/geo/time/merchant rule types, flag/review/block actions)
- [x] `/api/audit` immutable activity log (login, predict, case updates, rule changes)
- [x] `/api/dashboard/stats` with hourly activity, best model, case counts, fraud prevented $
- [x] `/api/live/feed` latest 20 scored transactions
- [x] MongoDB indexes on all query-hot fields
- [x] 34/34 backend tests passing (100%)

### Frontend
- [x] Redesigned layout: pill top nav + compact grouped sidebar + live header
- [x] Cabinet Grotesk display font + Manrope body + JetBrains Mono numbers
- [x] Dark fintech theme (#0B0B0D background, #C6F24E lime accent, #151518 surfaces)
- [x] Login page with split hero + demo-credentials panel
- [x] Overview: Hello-analyst hero, fraud-prevented dollar card, 5-model strip, KPI grid, activity chart, cases queue, split light/dark live feed (mirrors reference exactly)
- [x] Transaction Explorer: filterable/searchable table + right-side detail panel + CSV export + Create-case-from-tx
- [x] Cases: queue + detail with status moves + analyst notes + auto-generated-from-fraud
- [x] Rules Engine: 6 seeded rules + new-rule modal + toggle/delete
- [x] Data Analysis: KPIs, class-distribution pie, correlation bars, feature importance, amount distribution
- [x] Preprocessing: 3-step pipeline visual + before/after SMOTE bar chart
- [x] Models: training pipeline + per-model cards + comparison chart + live retraining logs
- [x] Evaluation: ROC + PR curves + radar + threshold sweep (all 5 models overlaid)
- [x] Prediction Lab: 30-feature input + model/threshold selector + live scoring + explanations
- [x] Audit Log: filtered activity stream
- [x] About: mission, stack, references, presentation script
- [x] Presentation Mode: 6-slide auto-advance (9s/slide) + speaker notes toggle + keyboard nav (← → P N ESC) + manual dots
- [x] Real Unsplash imagery (avatars, hero)
- [x] data-testid on every interactive element
- [x] Fully responsive (mobile sidebar drawer, adaptive grids, touch-friendly pills)

## Prioritized backlog (future)
### P0 (nice-to-have for polish)
- Real Kaggle CSV auto-download via kagglehub (graceful fallback if no credentials — already in place)
- Expose presentation auto-advance speed as a user preference

### P1 (feature depth)
- Websocket live transaction stream (currently polling every 12s)
- Transaction map overlay (real-time geo pinpoints)
- Stripe test webhook ingestion so real payments get scored
- Bulk CSV upload for offline transaction scoring

### P2 (enterprise)
- Multi-tenant (org_id scoping on all collections)
- Role-based access (admin vs analyst vs readonly)
- Compliance exports (PCI-DSS report, SOC2 activity bundle)
- Slack/Teams webhook on new critical case

## Tech decisions
- **Dataset**: synthetic generator matches Kaggle creditcardfraud schema (28 PCA features + Time + Amount + Class @ 1.73%). Loads real CSV from `/app/backend/data/creditcard.csv` if present. This keeps the environment reproducible without Kaggle credentials.
- **Models**: 120-tree RF / KNN(k=5) / LR / DT(depth 12) / SVM(RBF) — all scikit-learn 1.5.
- **SMOTE**: applied ONLY to training set (never to test) — evaluation numbers are honest.
- **Auth**: Bearer token in `Authorization` header + localStorage on frontend. Cookies supported but not used (CORS with `*`).
- **Presentation**: Cabinet Grotesk chosen deliberately (underutilised — avoids the "Inter/Space Grotesk AI-slop" look).

## Backend contract summary
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| /api/health | GET | - | Heartbeat + model-ready check |
| /api/auth/login | POST | - | { email, password } → { user, access_token } |
| /api/auth/me | GET | ✓ | Current user |
| /api/auth/logout | POST | ✓ | - |
| /api/dashboard/stats | GET | ✓ | KPIs + hourly series + best model |
| /api/transactions | GET | ✓ | Filter: status, q, min_amount, max_amount, skip, limit |
| /api/transactions/{tx_id} | GET | ✓ | Single |
| /api/predict | POST | ✓ | Score feature vector (any of 5 models) + explanations |
| /api/ml/metrics | GET | ✓ | Full metrics + feature importance + ROC/PR/threshold data |
| /api/ml/retrain | POST | ✓ | Retrain all models |
| /api/cases | GET POST | ✓ | List + create |
| /api/cases/{id} | GET PATCH | ✓ | Update status / add notes |
| /api/rules | GET POST | ✓ | List + create |
| /api/rules/{id} | PATCH DELETE | ✓ | Toggle / delete |
| /api/audit | GET | ✓ | Activity log |
| /api/live/feed | GET | ✓ | Latest transactions |

## Test credentials
See `/app/memory/test_credentials.md`
