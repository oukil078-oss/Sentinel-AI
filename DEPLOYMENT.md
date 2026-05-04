# Deploying Sentinel AI for Free

> **Stack:** Vercel (frontend) + Render (backend) + MongoDB Atlas (database) + GitHub Actions (keep-alive)
> **Total cost:** $0/month
> **Total time:** ~25 minutes

---

## Step 0 — Push the new files to GitHub

I just added these to your repo. Push them first using the **"Save to GitHub"** button in your Emergent chat:

| File | Purpose |
|---|---|
| `vercel.json` | Tells Vercel where the frontend lives |
| `render.yaml` | Render Blueprint — one-click backend deploy |
| `.github/workflows/keep-alive.yml` | Pings backend every 14 min so it never sleeps |
| `backend/.gitignore` | Keeps `models_cache/` out of git |
| `DEPLOYMENT.md` | This guide |

---

## Step 1 — MongoDB Atlas (free database)

Render no longer offers free MongoDB, but Atlas's M0 tier is free forever (512 MB).

1. Go to <https://www.mongodb.com/cloud/atlas/register> → sign up.
2. **Build a Database** → **M0 FREE** → pick any region close to you (e.g. AWS Oregon).
3. **Database Access** (left sidebar) → **Add New Database User**:
   - Authentication: **Password**
   - Username: `sentinel`
   - Password: click **Autogenerate Secure Password** → **Copy** → save it somewhere
   - Built-in Role: **Read and write to any database**
   - **Add User**
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) → **Confirm**.
5. **Database** → click **Connect** on your cluster → **Drivers** → **Python 3.6 or later** → copy the connection string. Looks like:
   ```
   mongodb+srv://sentinel:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   Replace `<password>` with the password from step 3. **Save the full string** — you'll paste it on Render.

---

## Step 2 — Render (free backend)

### Method A: One-click via Blueprint (recommended)

1. Go to <https://render.com> → sign in with GitHub.
2. Click **New** → **Blueprint**.
3. Connect your `oukil078-oss/Sentinel-AI` repo. Render auto-detects `render.yaml`.
4. You'll see one service: **sentinel-ai-backend**. Click **Apply**.
5. On the next screen Render asks you to fill in the **secret env vars** (the ones marked `sync: false` in `render.yaml`):

   | Key | Value |
   |---|---|
   | `MONGO_URL` | the full Atlas connection string from Step 1.5 |
   | `ADMIN_PASSWORD` | `Sentinel2026!` (or anything you want — write it down) |
   | `FRONTEND_URL` | leave **blank** for now → we'll fill it in Step 4 |

   `JWT_SECRET` is auto-generated. `DB_NAME`, `ADMIN_EMAIL`, `PYTHON_VERSION` are pre-filled.

6. Click **Apply** again. Render starts building.
7. **Wait ~5 minutes.** First build is slow because:
   - Installing scikit-learn, imbalanced-learn, pandas, numpy (~2-3 min)
   - Training 5 ML models with SMOTE on first startup (~30 sec)
   - Seeding 800 transactions, 6 rules, 18 cases (~5 sec)

8. Watch the **Logs** tab. You'll know it's ready when you see:
   ```
   ✓ Seeded admin user: analyst@sentinel.ai
   ✓ Models trained and saved
   🚀 Sentinel AI backend ready
   ```

9. At the top of your Render service page, click the URL — should look like:
   ```
   https://sentinel-ai-backend-xxxx.onrender.com
   ```
   **Copy it.** Test it:
   ```bash
   curl https://sentinel-ai-backend-xxxx.onrender.com/api/health
   # → {"status":"ok","service":"sentinel-ai","models_loaded":true,...}
   ```

### Method B: Manual (if Blueprint fails)

1. **New** → **Web Service** → connect your repo.
2. Settings:
   - **Name**: `sentinel-ai-backend`
   - **Region**: Oregon (or closest)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
3. Add env vars under **Environment**:
   ```
   PYTHON_VERSION=3.11.9
   MONGO_URL=<from Atlas>
   DB_NAME=sentinel_fraud
   JWT_SECRET=<generate: python3 -c "import secrets; print(secrets.token_hex(32))">
   ADMIN_EMAIL=analyst@sentinel.ai
   ADMIN_PASSWORD=Sentinel2026!
   ```
4. **Advanced** → **Health Check Path**: `/api/health`
5. **Create Web Service**.

---

## Step 3 — Vercel (free frontend)

1. Go to <https://vercel.com> → sign in with GitHub.
2. **Add New** → **Project** → import `oukil078-oss/Sentinel-AI`.
3. **CRITICAL — configure these before clicking Deploy:**

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Other (Vercel will auto-detect Vite once Root Directory is set) |
   | **Root Directory** | click **Edit** → select `frontend` |

4. Expand **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | the Render URL from Step 2.9 (e.g. `https://sentinel-ai-backend-xxxx.onrender.com`) |

   Make sure all 3 environments (Production, Preview, Development) are checked.

5. Click **Deploy**. ~2 min.
6. Copy your Vercel URL (e.g. `https://sentinel-ai.vercel.app`).

---

## Step 4 — Tell the backend about the frontend (CORS)

1. Render dashboard → **sentinel-ai-backend** → **Environment** tab.
2. Edit `FRONTEND_URL` → set it to your Vercel URL:
   ```
   https://sentinel-ai.vercel.app
   ```
3. Render redeploys automatically (~1 min).

> Vercel preview URLs (`*.vercel.app`) are already auto-allowed by the backend regex, so you don't need to whitelist every preview deploy.

---

## Step 5 — Set up the keep-alive ping (free, no cold starts)

Render's free tier sleeps after **15 min** of inactivity → first request afterward takes ~30-60 sec. The included GitHub Action pings every 14 min to prevent that.

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Name: `BACKEND_URL`
3. Value: `https://sentinel-ai-backend-xxxx.onrender.com` (no trailing slash)
4. **Add secret**.
5. Go to the **Actions** tab in your repo → enable workflows if prompted → click **Keep Render backend awake** → **Run workflow** to test.

Now your backend will be pinged every 14 minutes, 24/7, for free. 🎉

---

## Step 6 — Test the full app

1. Open `https://sentinel-ai.vercel.app`.
2. Login:
   - Email: `analyst@sentinel.ai`
   - Password: `Sentinel2026!` (or whatever you set in Step 2.5)
3. Click around — Overview, Transactions, Cases, Rules, Predict, **Present** mode (top-right lime button).

---

## Troubleshooting

### Render build fails on `sklearn` / `imbalanced-learn`
- Render free tier has 512 MB RAM, just barely enough. If it OOM's, set `PYTHON_VERSION=3.11.9` (smaller wheels than 3.12) — already in `render.yaml`.

### Render starts but `/api/health` returns 502
- Check **Logs** tab. Most common: `MONGO_URL` typo or Atlas IP whitelist missing `0.0.0.0/0`.

### Login returns 401
- The admin user wasn't seeded. Check Render logs for `Seeded admin user`. If absent, MongoDB connection failed during startup — fix `MONGO_URL` and click **Manual Deploy → Clear build cache & deploy**.

### Browser console shows "CORS blocked"
- `FRONTEND_URL` on Render doesn't match your Vercel domain exactly. Re-check the URL (no trailing slash, correct subdomain) and Render redeploys.

### Vercel build still says `vite: command not found`
- You forgot **Root Directory = frontend** in the Vercel project settings. **Settings** → **General** → **Root Directory** → set to `frontend` → **Save** → **Redeploy**.

### After deploy, every API call is slow (~3-5 sec)
- Render free tier is geographically distant from your user. The 750 free hours/mo are still plenty. For faster response, you could pay $7/mo for a Starter instance, but it's optional.

### "Cold start" still happens occasionally
- The keep-alive workflow only runs while your free GitHub Actions minutes last (2,000/mo on free GitHub — way more than enough). If it fails to run, manually trigger from the Actions tab. Or use a free pinger like <https://uptimerobot.com> (set 5-min HTTP monitor on `/api/health`).

---

## Costs recap

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Render Web Service | Free (512 MB, 750 hr/mo) | $0 |
| MongoDB Atlas | M0 (512 MB, shared) | $0 |
| GitHub Actions (keep-alive) | 2000 min/mo free | $0 |
| **Total** | | **$0/month** |

---

## Quick env vars cheat sheet

### Render → sentinel-ai-backend → Environment
```
PYTHON_VERSION=3.11.9
MONGO_URL=mongodb+srv://sentinel:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=sentinel_fraud
JWT_SECRET=<auto-generated by render.yaml>
ADMIN_EMAIL=analyst@sentinel.ai
ADMIN_PASSWORD=Sentinel2026!
FRONTEND_URL=https://sentinel-ai.vercel.app
```

### Vercel → Settings → Environment Variables
```
REACT_APP_BACKEND_URL=https://sentinel-ai-backend-xxxx.onrender.com
```

### GitHub → Settings → Secrets → Actions
```
BACKEND_URL=https://sentinel-ai-backend-xxxx.onrender.com
```

That's the whole thing. Push to GitHub → Vercel + Render auto-deploy → demo your platform to your teacher. 🚀
