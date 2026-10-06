# Deploying GATEHOUSE Backend to Render

This guide walks you through deploying the **FastAPI Operations Backend** (`apps/api`) to **Render**.

---

## Service Overview

- **Service Type**: Web Service
- **Runtime**: Python 3
- **Root Directory**: `apps/api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

---

## Deployment Option A: Using Render Blueprint (`render.yaml`) (Recommended)

1. Push your repository to GitHub / GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically read `render.yaml` at the root of the repository.
4. Fill in the secret environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`).
5. Click **Apply**. Render will automatically build and deploy the service.

---

## Deployment Option B: Manual Web Service Setup

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the following fields:
   - **Name**: `gatehouse-api` (or your preferred name)
   - **Region**: Select closest region to your users (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free or Starter

4. Expand **Advanced**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`

5. Add Environment Variables (under **Environment Variables**):

| Key | Value | Notes |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Disables debug mode and enables strict security |
| `DEBUG` | `false` | Production mode |
| `PORT` | *(Leave empty)* | Render automatically provides `$PORT` |
| `HOST` | `0.0.0.0` | Binds to all interfaces |
| `CORS_ORIGINS` | `https://your-gatehouse-app.vercel.app` | Comma-separated list of allowed frontend origins |
| `FRONTEND_URL` | `https://your-gatehouse-app.vercel.app` | Convenience URL of your Vercel frontend |
| `GEMINI_API_KEY` | `AIzaSy...` | Server-side Gemini API Key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Primary operational model |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase service-role admin key (server-side only) |
| `DATABASE_URL` | `postgresql://postgres:pass@db...` | Supabase direct PostgreSQL URI (for migrations) |

6. Click **Create Web Service**.

---

## Verifying Backend Deployment

Once Render finishes building:
1. Open your assigned Render URL: `https://gatehouse-api.onrender.com/health`
2. You should receive:
   ```json
   {"status":"ok"}
   ```
3. Open the interactive OpenAPI documentation: `https://gatehouse-api.onrender.com/docs`
4. Test the agent endpoint:
   ```bash
   curl -X POST https://gatehouse-api.onrender.com/api/agent/run \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Check warehouse inventory levels and prepare restock order"}'
   ```
