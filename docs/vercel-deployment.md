# Deploying GATEHOUSE Frontend to Vercel

This guide walks you through deploying the **Next.js Web Command Post** (`apps/web`) to **Vercel**.

---

## Project Settings on Vercel

- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/web`
- **Build Command**: `next build` (or leave default, Vercel executes `npm run build` in `apps/web`)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (executed at monorepo root automatically by Vercel)

---

## Step-by-Step Deployment Instructions

1. Push your repository to GitHub / GitLab / Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** → **Project**.
3. Import your `Gatehouse` repository.
4. In the **Configure Project** screen:
   - **Project Name**: `gatehouse-web` (or your preferred name)
   - **Framework Preset**: Select **Next.js**
   - **Root Directory**: Click **Edit** and choose `apps/web`.
     *(Ensure "Include files outside the root directory in the Build Step" is CHECKED so Vercel accesses `packages/*`).*
5. Open the **Environment Variables** section and configure:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://gatehouse-api.onrender.com` | URL of your deployed Render backend |
| `API_URL` | `https://gatehouse-api.onrender.com` | Server-side proxy destination for Next.js rewrites |
| `NEXT_PUBLIC_APP_ENV` | `production` | Production environment flag |
| `NEXT_PUBLIC_APP_VERSION`| `4.2.0` | Application release version |

> 🔒 **Security Notice:**
> - **DO NOT** add `GEMINI_API_KEY` to Vercel.
> - **DO NOT** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.
> All AI inference and sovereign database operations are routed securely through the FastAPI backend on Render.

6. Click **Deploy**.

---

## How Vercel Connects to the Render Backend

The frontend communicates with the backend via two complementary mechanisms:

1. **Next.js Server Rewrites (`apps/web/next.config.ts`):**
   Calls from the browser to `/api/*` are transparently rewritten server-side by Next.js to `${API_URL}/api/*`.
   - **Benefit**: Eliminates browser CORS restrictions entirely, as requests appear same-origin to the browser.
2. **Direct Client SDK Calls (`apps/web/lib/api.ts`):**
   Uses `NEXT_PUBLIC_API_URL` with graceful fallback and connection error shielding.

---

## Verifying Frontend Deployment

1. Visit your Vercel deployment URL (e.g. `https://gatehouse-web.vercel.app`).
2. Verify:
   - Dashboard renders the 4 telemetry cards and Mission Command.
   - Dispatch an example directive (e.g. "Check low-stock products and prepare a restock order").
   - Confirm the AI Strategist Architecture generates the phased roadmap and company agents.
   - Navigate to the **Approvals** tab and confirm Gmail-style approval inbox displays pending items.

---

## ⚠️ Troubleshooting: Vercel Shows FastAPI JSON Response

If your Vercel URL displays the FastAPI JSON:
```json
{
  "service": "GATEHOUSE Tactical Operations API",
  "status": "operational"
}
```

### Why this happens:
In a monorepo containing both `apps/api` (FastAPI) and `apps/web` (Next.js), Vercel may auto-detect `apps/api` or default to it if the project's **Root Directory** was not explicitly configured to `apps/web`. Vercel automatically deploys Python apps when it finds `main.py` and `requirements.txt`.

### How to Fix:
1. Open the [Vercel Dashboard](https://vercel.com/dashboard) and navigate to your project.
2. Go to **Settings** → **General**.
3. Under **Build & Development Settings**, locate **Root Directory**.
4. Click **Edit**, enter or select: `apps/web`.
5. Check the box **"Include source files outside of the Root Directory in the Build Step"** (needed to transpile shared monorepo packages).
6. Click **Save**.
7. Go to **Deployments** → Click the latest deployment → Click **Redeploy**.
8. Once complete, your Vercel production URL will serve the Next.js GATEHOUSE Tactical Command Post.

