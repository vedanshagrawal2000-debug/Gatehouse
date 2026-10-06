# GATEHOUSE Production Deployment Guide

Complete master guide for deploying the **GATEHOUSE Tactical Autonomous Business Infrastructure & AI Operations Command Post** to production.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        Next.js Frontend         │  API  │         FastAPI Backend         │
│          (apps/web)             ├──────►│           (apps/api)            │
│         Hosted on Vercel        │Rewrite│         Hosted on Render        │
└─────────────────────────────────┘       └───────┬───────────────────┬─────┘
                                                  │                   │
                                                  ▼                   ▼
                                      ┌───────────────────┐   ┌───────────────┐
                                      │   Google Gemini   │   │   Supabase    │
                                      │     AI Studio     │   │  PostgreSQL   │
                                      └───────────────────┘   └───────────────┘
```

---

## 1. Monorepo Architecture Overview

| Component | Path | Technology | Production Target |
| :--- | :--- | :--- | :--- |
| **Frontend** | `apps/web` | Next.js 15 (App Router), Tailwind CSS, React 19 | **Vercel** |
| **Backend** | `apps/api` | FastAPI, Uvicorn, Python 3.11+, Pydantic v2 | **Render** |
| **Shared Packages** | `packages/*` | `@gatehouse/shared`, `@gatehouse/tools`, `@gatehouse/agents` | Monorepo internal |
| **Database** | `supabase/` | Supabase PostgreSQL, SQL Migrations & RLS | **Supabase** |

---

## 2. Step 1: Database Setup (Supabase)

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Apply the migrations in sequential order from `supabase/migrations/`:
   - Run `supabase/migrations/20261004000001_create_gatehouse_schema.sql` (Creates 7 tables, audit trail, enum types).
   - Run `supabase/migrations/20261004000002_seed_demo_data.sql` (Seeds initial agents, inventory, and telemetry).
4. Alternatively, run the migration runner locally:
   ```bash
   DATABASE_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres" python apps/api/database/migrate.py
   ```
5. From **Project Settings** → **API**, copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 3. Step 2: Backend Deployment (Render)

### Option A: One-Click Render Blueprint (`render.yaml`)
1. Connect your repository in [Render Dashboard](https://dashboard.render.com).
2. Select **New +** → **Blueprint**.
3. Render automatically detects `render.yaml` at the root and configures the `gatehouse-api` web service.
4. Input your environment secrets (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`).

### Option B: Manual Web Service Configuration
- **Root Directory**: `apps/api`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### Required Environment Variables on Render:
```env
ENVIRONMENT="production"
DEBUG="false"
HOST="0.0.0.0"
CORS_ORIGINS="https://your-gatehouse-app.vercel.app,http://localhost:3000"
FRONTEND_URL="https://your-gatehouse-app.vercel.app"
GEMINI_API_KEY="AIzaSyYourGoogleGeminiApiKey"
GEMINI_MODEL="gemini-2.5-flash"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"
```

> **Health Check Verification:**
> Once deployed, visit `https://<your-render-service>.onrender.com/health` → returns `{"status":"ok"}`.

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Connect your repository in [Vercel Dashboard](https://vercel.com/dashboard).
2. Select **Add New...** → **Project**.
3. **Configure Settings:**
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - *Ensure "Include files outside the root directory in the Build Step" is enabled.*
4. **Environment Variables on Vercel:**
   ```env
   NEXT_PUBLIC_API_URL="https://your-render-service.onrender.com"
   API_URL="https://your-render-service.onrender.com"
   NEXT_PUBLIC_APP_ENV="production"
   NEXT_PUBLIC_APP_VERSION="4.2.0"
   ```
5. Click **Deploy**.

---

## 5. Security & Isolation Checklist

- [x] **No Gemini API Key in Frontend**: Only the FastAPI backend on Render accesses `GEMINI_API_KEY`.
- [x] **No Supabase Service Role Key in Frontend**: Admin database access is strictly server-side.
- [x] **Dynamic CORS Configuration**: Backend allows Vercel frontend URL via `CORS_ORIGINS` / `FRONTEND_URL`.
- [x] **Next.js Proxy Rewrites**: Frontend proxies `/api/*` to the Render backend, preventing client-side CORS issues.
- [x] **Fail-Safe Fallbacks**: Frontend gracefully falls back to deterministic local state if the backend is cold-starting.
- [x] **Dedicated Health Probe**: `GET /health` returns `{"status":"ok"}` for zero-downtime health checking.

---

## 6. Commands Reference

### Frontend (`apps/web`):
- **Build Command**: `npm run build --workspace=@gatehouse/web` (or `npm run build` in `apps/web`)
- **Start Command**: `npm run start --workspace=@gatehouse/web` (or `npm run start` in `apps/web`)
- **Dev Command**: `npm run dev --workspace=@gatehouse/web`

### Backend (`apps/api`):
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Entry Point**: `main:app` (or from root: `apps.api.main:app`)
