# Deploying Sentinel AI to Vercel + Railway

This guide walks you through deploying the **frontend on Vercel** and the **FastAPI backend on Railway**, with **MongoDB on MongoDB Atlas (free tier)**.

> **Estimated time:** ~25 minutes total.

---

## Step 0 — Push the latest code to GitHub

I just added these new files to your repo. Push them first:

```bash
git add vercel.json Procfile nixpacks.toml railway.json runtime.txt backend/.gitignore DEPLOYMENT.md
git commit -m "Add Vercel + Railway deployment configs"
git push origin main
```

---

## Step 1 — MongoDB on MongoDB Atlas (free)

Railway no longer offers free MongoDB, so we use Atlas's M0 tier (512 MB, free forever).

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Create a new project → "Sentinel AI".
3. Click **Build a Database** → **M0 FREE** → choose any region close to you.
4. **Database Access** (left sidebar) → **Add New Database User**:
   - Username: `sentinel`
   - Password: generate a strong one — *save this somewhere*.
5. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Required for Railway.
6. Back to **Database** → click **Connect** on your cluster → **Drivers** → **Python** → copy the connection string. It looks like:
   ```
   mongodb+srv://sentinel:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the password from step 4.

---

## Step 2 — Backend on Railway

1. Go to <https://railway.app> and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → pick `oukil078-oss/Sentinel-AI`.
3. Railway will detect `nixpacks.toml` and start building. **Wait — first add the env vars.**
4. Click your service → **Variables** tab → add these (one at a time):

   | Key | Value |
   |---|---|
   | `MONGO_URL` | the Atlas connection string from Step 1 |
   | `DB_NAME` | `sentinel_fraud` |
   | `JWT_SECRET` | a long random hex string (run `python3 -c "import secrets; print(secrets.token_hex(32))"`) |
   | `ADMIN_EMAIL` | `analyst@sentinel.ai` |
   | `ADMIN_PASSWORD` | `Sentinel2026!` (or change to whatever you prefer) |
   | `FRONTEND_URL` | leave blank for now — we fill it in Step 4 |
   | `PORT` | Railway sets this automatically — **don't add it yourself** |

5. **Settings** → **Networking** → click **Generate Domain**. You get a URL like:
   ```
   https://sentinel-ai-production-abc1.up.railway.app
   ```
   **Copy it.** This is your `RAILWAY_BACKEND_URL`.

6. Wait until the build finishes (~3–5 min — the first build trains the ML models). Test it:
   ```bash
   curl https://YOUR_RAILWAY_URL/api/health
   # → {"status":"ok","service":"sentinel-ai","models_loaded":true,...}
   ```

---

## Step 3 — Frontend on Vercel

1. Go to <https://vercel.com> → sign in with GitHub.
2. **Add New** → **Project** → import `oukil078-oss/Sentinel-AI`.
3. **IMPORTANT — Configure these three things before clicking Deploy:**

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Other (or Vite if shown) |
   | **Root Directory** | `frontend`  ← click "Edit", then select `frontend` |
   | **Build Command** | `yarn build` (default) |
   | **Output Directory** | `dist` (default) |
   | **Install Command** | `yarn install` (default) |

4. Expand **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | the Railway URL from Step 2.5 (e.g. `https://sentinel-ai-production-abc1.up.railway.app`) |

5. Click **Deploy**. Wait ~2 min.

6. Vercel gives you a URL like `https://sentinel-ai.vercel.app`. **Copy it.**

> If Vercel still uses the root `vercel.json` (because you forgot to set Root Directory = `frontend`), the build will still work because `vercel.json` instructs it to `cd frontend && yarn build`. But setting Root Directory is cleaner.

---

## Step 4 — Tell the backend about the frontend (CORS)

1. Back in Railway → your service → **Variables** → find `FRONTEND_URL` → set it to your Vercel URL:
   ```
   https://sentinel-ai.vercel.app
   ```
   (Use *only* the production URL — Vercel preview URLs are auto-allowed by the regex.)
2. Railway redeploys automatically (~30s).

---

## Step 5 — Test it

1. Open `https://sentinel-ai.vercel.app` in a browser.
2. Log in with:
   - Email: `analyst@sentinel.ai`
   - Password: `Sentinel2026!` (or whatever you set in Railway)
3. You should land on the Overview dashboard. ML models, transactions, cases, rules — everything should load.

---

## Troubleshooting

### Vercel: `vite: command not found`
- You forgot to set **Root Directory** = `frontend` in Vercel project settings, AND `vercel.json` is missing from your repo. Push the new `vercel.json` I just created.

### Vercel build succeeds but UI is blank / API calls fail
- `REACT_APP_BACKEND_URL` env var is missing or wrong on Vercel. Settings → Environment Variables → make sure it's set for **Production**, **Preview**, and **Development**. Then **Redeploy** (env var changes don't take effect until a new build).

### Railway: build fails on `imbalanced-learn`
- Means the build OOM'd (the M0 build is small). Upgrade Railway plan briefly OR remove `imbalanced-learn` from `requirements.txt` and use a fallback (the engine has fallback logic — actually no, SMOTE is required). Just upgrade Railway to Hobby ($5/mo, includes $5 credits = effectively free).

### Railway: starts but `/api/health` 502s
- Open the **Deploy Logs** tab on Railway. Probably a missing env var or a MongoDB connection issue. Check `MONGO_URL` is the full Atlas string with `<password>` replaced.

### Browser: "CORS blocked"
- `FRONTEND_URL` on Railway doesn't match your Vercel domain. Fix it and Railway redeploys.

### Login: 401 every time
- Atlas isn't reachable, so the admin user wasn't seeded. Check Railway logs for `seeded admin user`.

---

## After deployment

- **First request is slow (~5–10s)**: Railway free containers cold-start. Subsequent requests are instant.
- **Models retrain every time the container restarts** (Railway redeploys clear `models_cache/`). Takes ~30s of startup. If you want true persistence, attach a Railway Volume to `/app/backend/models_cache`.
- **Database persists** on Atlas — your seeded transactions, cases, rules survive Railway redeploys.

---

## Costs
- **MongoDB Atlas M0**: Free forever
- **Railway Hobby**: $5/mo (includes $5 of usage = effectively free for low traffic)
- **Vercel Hobby**: Free
- **Total**: $0–$5/mo

---

## Quick reference: env vars

### Railway (backend)
```
MONGO_URL=mongodb+srv://sentinel:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=sentinel_fraud
JWT_SECRET=<64 hex chars>
ADMIN_EMAIL=analyst@sentinel.ai
ADMIN_PASSWORD=Sentinel2026!
FRONTEND_URL=https://sentinel-ai.vercel.app
```

### Vercel (frontend)
```
REACT_APP_BACKEND_URL=https://sentinel-ai-production-abc1.up.railway.app
```

That's it — push to GitHub and both services auto-redeploy on every commit. 🚀
