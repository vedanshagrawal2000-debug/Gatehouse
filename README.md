# GATEHOUSE // Tactical AI Operations Command Post

> **Autonomous Business Infrastructure with Cryptographic Precision and Fail-Safe Human Gating**

GATEHOUSE is a mission-critical multi-agent operational platform engineered for high-stakes business automation. Built on top of Next.js, FastAPI, Google Gemini API, and Supabase PostgreSQL, GATEHOUSE orchestrates autonomous agent loops while ensuring sensitive actions (such as high-value wire payouts, ERP updates, and customer dispute escalations) are strictly halted at the security perimeter for operator biometric confirmation.

---

## Architecture Overview

```
GATEHOUSE Monorepo
│
├── apps/
│   ├── web/                    # Next.js 15 (App Router, TypeScript, Tailwind CSS)
│   └── api/                    # FastAPI Uvicorn Backend (Python 3.12+)
│
└── packages/
    ├── shared/                 # Shared TypeScript interfaces, health & telemetry contracts
    ├── agents/                 # Multi-agent definitions, reasoning loop orchestrators
    └── tools/                  # Deterministic tool registry (ERP, Banking, CRM adapters)
```

### The 5-Step Chain of Custody Pipeline
1. **Step 01: Ingestion (Business Request)** – Natural language intent parsed via Slack, incoming webhooks, or terminal.
2. **Step 02: Reasoning (AI Agent Evaluation)** – Multi-model reasoning loops (Google Gemini) break requests into sub-tasks and tool targets.
3. **Step 03: Sandbox (Tool Execution)** – Cryptographic payload staging, parameter pre-flight validation, and sandbox execution.
4. **Step 04: Perimeter Interrupt (Human Approval)** – Mandatory fail-safe gate: any high-risk parameter (e.g. payouts > $25,000) halts for operator authorization.
5. **Step 05: Confirmation (Result & Immutable Audit)** – Cryptographic outcome recorded in Supabase PostgreSQL audit trail.

---

## Technology Stack

- **Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS
- **Design System:** Tactical Heist Operations & Telemetry Interface (Space Grotesk, Geist, JetBrains Mono)
- **Backend:** FastAPI (Python), Uvicorn, Pydantic v2
- **AI Core:** Google Gemini API (`google-genai` SDK, `gemini-2.5-flash` / `gemini-2.5-pro`)
- **Database / Audit:** Supabase PostgreSQL
- **Monorepo Management:** npm Workspaces

---

## Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **npm**: v9+ (tested on npm 11)

### 2. Installation

Clone or open the repository root:

```bash
cd Gatehouse
```

Install root npm workspace dependencies:

```bash
npm install
```

Set up the Python backend virtual environment:

```bash
# On Windows
python -m venv apps/api/.venv
apps/api/.venv/Scripts/python -m pip install -r apps/api/requirements.txt

# On macOS/Linux
python3 -m venv apps/api/.venv
apps/api/.venv/bin/python -m pip install -r apps/api/requirements.txt
```

### 3. Environment Configuration

Copy the template configuration files:

```bash
# Backend configuration
cp apps/api/.env.example apps/api/.env

# Frontend configuration
cp apps/web/.env.example apps/web/.env.local
```

Fill in your API credentials in `apps/api/.env`:
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/app/apikey).
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Get from your [Supabase Project](https://supabase.com).

*(Note: The system boots safely in development mode even if keys are pending configuration, reporting clear status flags on the telemetry interface).*

---

## Running the Application

### Launch Both Frontend & Backend Concurrently
From the root directory:

```bash
npm run dev
```

This starts:
- **FastAPI Backend:** [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs))
- **Next.js Web Command Post:** [http://localhost:3000](http://localhost:3000)

### Run Services Individually

```bash
# Start FastAPI backend only
npm run dev:api

# Start Next.js frontend only
npm run dev:web
```

---

## Database Architecture & Migrations (Supabase PostgreSQL)

GATEHOUSE implements a production-grade relational database architecture on Supabase PostgreSQL.

### Entity Relationship Model

1. **`agents`**: Autonomous agent nodes, models (`gemini-2.5-flash`/`gemini-2.5-pro`), operational states, and clearance levels.
2. **`inventory`**: Tactical communication hardware, cryptographic tokens, surveillance modules, and power cells across facilities.
3. **`customer_enquiries`**: Incoming high-priority dispute tickets, CRM tasks, and tier evaluations.
4. **`missions`**: Multi-agent workflows with explicit execution statuses (`pending`, `running`, `gated`, `completed`, `failed`, `cancelled`).
5. **`tool_executions`**: Tool invocations strictly belonging to a mission, tracking sensitive flags, durations, and diagnostic errors.
6. **`approval_requests`**: Perimeter fail-safe gates referencing the exact proposed action, validated arguments, amount, and idempotency key.
7. **`audit_logs`**: Append-only cryptographic ledger tracking all sensitive actions, approval outcomes, and SHA256 action payloads.

### Architectural Invariants & Guarantees
- **Mission Execution Status**: Enforced by check constraints on `missions.status`.
- **Tool Belongs to Mission**: Enforced by `FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE`.
- **Exact Action & Arguments Reference**: `approval_requests.arguments` stores the validated JSONB payload and references the exact `tool_execution_id`.
- **Approved Actions Cannot Execute Twice**: Enforced by `chk_cannot_execute_twice (execution_count <= 1)`, unique `idempotency_key`, and `chk_executed_requires_approved`.
- **Auditable Sensitive Actions**: Sensitive tool executions and approval gates trigger automated hashing and insertion into `audit_logs`.
- **Useful Error Messages on Failure**: Both `missions` and `tool_executions` store structured `error_message` and `error_details` JSONB.

### Migration Files
- `supabase/migrations/20261004000001_create_gatehouse_schema.sql`: Complete DDL, constraints, foreign keys, rules, triggers, and indexes.
- `supabase/migrations/20261004000002_seed_demo_data.sql`: Seed data for 3 agents, 10 inventory items, 3 customer enquiries, demonstration missions, gated tool executions, and audit records.

### Database Verification & Migration Commands

```bash
# Verify schema, constraints, seed queries, and invariants locally:
npm run db:verify

# Apply migrations to configured Supabase PostgreSQL instance:
npm run db:migrate
```

---

## Health Check & Verification Endpoints

- **Handshake Endpoint:** `GET http://localhost:8000/health`
- **Telemetry Metrics:** `GET http://localhost:8000/api/v1/telemetry/metrics`
- **Agent Registry:** `GET http://localhost:8000/api/v1/agents`
- **Pipeline Status:** `GET http://localhost:8000/api/v1/telemetry/pipeline`
- **Pending Approvals:** `GET http://localhost:8000/api/v1/approvals`

### Health Check Response Schema Example:
```json
{
  "status": "healthy",
  "service": "GATEHOUSE Tactical Operations API",
  "version": "4.2.0",
  "timestamp": "2026-10-04T06:14:00Z",
  "uptime_seconds": 45.2,
  "environment": "development",
  "services": {
    "api": {
      "status": "healthy",
      "configured": true,
      "message": "GATEHOUSE API core kernel online"
    },
    "gemini": {
      "status": "healthy",
      "configured": true,
      "model": "gemini-2.5-flash"
    },
    "database": {
      "status": "healthy",
      "configured": true,
      "provider": "Supabase PostgreSQL"
    }
  }
}
```

---

## Security & Credentials Notice

- Never commit `.env` or `.env.local` files to version control.
- Secrets and service role tokens are strictly restricted to the backend kernel (`apps/api`).
- The frontend client only communicates through authenticated `/api/v1` routes or public health indicators.
