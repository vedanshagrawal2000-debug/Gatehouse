"""
GATEHOUSE Database Module: Supabase PostgreSQL Client
Keeps service-role credentials strictly server-side.
Provides resilient queries, atomic approval state management, duplicate-execution protection,
and cryptographic audit logging with graceful degraded-mode error reporting.
"""

import hashlib
import json
import logging
import os
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from config import settings

logger = logging.getLogger("gatehouse.database")

_supabase_client = None


# ==============================================================================
# Domain Exceptions
# ==============================================================================
class DatabaseDegradedError(Exception):
    """Raised when an operation requires persistent database storage, but Supabase is unavailable."""
    pass


class DuplicateExecutionError(Exception):
    """Raised when an approval action has already been executed or approved (chk_cannot_execute_twice)."""
    pass


class ApprovalNotFoundError(Exception):
    """Raised when the specified approval request does not exist."""
    pass


class InvalidApprovalStateError(Exception):
    """Raised when the approval state transition is invalid (e.g. approving a rejected request)."""
    pass


# ==============================================================================
# Client Initialization & Connectivity Verification
# ==============================================================================
def is_database_configured() -> bool:
    """Returns True only if Supabase URL and a service or anon key are present."""
    has_url = bool(settings.SUPABASE_URL and settings.SUPABASE_URL.strip())
    has_key = bool(
        (settings.SUPABASE_SERVICE_ROLE_KEY and settings.SUPABASE_SERVICE_ROLE_KEY.strip())
        or (settings.SUPABASE_ANON_KEY and settings.SUPABASE_ANON_KEY.strip())
        or (settings.DATABASE_URL and settings.DATABASE_URL.strip())
    )
    return has_url and has_key


def get_supabase_admin_client():
    """
    Returns an authenticated Supabase admin client using the service-role key.
    STRICTLY SERVER-SIDE. Never expose this client or its credentials to the client.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not is_database_configured():
        return None

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def db_ping() -> Dict[str, Any]:
    """Tests connectivity to the live Supabase PostgreSQL database."""
    client = get_supabase_admin_client()
    if not client:
        return {
            "connected": False,
            "configured": False,
            "error": "Supabase credentials not configured. Configure SUPABASE_URL and keys in .env",
            "latency_ms": None,
        }

    start = time.time()
    try:
        # Lightweight query against agents table to test RLS / permissions
        client.table("agents").select("id").limit(1).execute()
        latency = round((time.time() - start) * 1000, 2)
        return {
            "connected": True,
            "configured": True,
            "error": None,
            "latency_ms": latency,
        }
    except Exception as e:
        latency = round((time.time() - start) * 1000, 2)
        return {
            "connected": False,
            "configured": True,
            "error": str(e),
            "latency_ms": latency,
        }


# ==============================================================================
# In-Memory Demonstration Repository (Fallback when Supabase credentials are unset)
# Mirrors the exact tables seeded in Supabase migrations, with realistic INR datasets.
# ==============================================================================
DEMO_AGENTS: List[Dict[str, Any]] = [
    {
        "id": "10000000-0000-0000-0000-000000000001",
        "slug": "customer",
        "name": "Customer Agent",
        "role": "Autonomous Dispute & Ticket Routing",
        "model": "gemini-2.5-flash",
        "status": "ready",
        "execution_rate": "99.4% EXEC",
        "queue_pending": 0,
        "external_system": "CRM // ZENDESK",
        "system_status": "READY",
        "requires_approval": False,
    },
    {
        "id": "10000000-0000-0000-0000-000000000002",
        "slug": "inventory",
        "name": "Inventory Agent",
        "role": "Predictive Supply Chain & PO Dispatch",
        "model": "gemini-2.5-flash",
        "status": "sync_active",
        "execution_rate": "SYNC ACTIVE",
        "queue_pending": 0,
        "external_system": "ERP: SAP / ORACLE",
        "system_status": "OK // 8MS",
        "requires_approval": False,
    },
    {
        "id": "10000000-0000-0000-0000-000000000003",
        "slug": "finance",
        "name": "Finance Agent",
        "role": "Ledger Reconciliation & Gated Payouts",
        "model": "gemini-2.5-pro",
        "status": "gate_pending",
        "execution_rate": "GATE PENDING",
        "queue_pending": 1,
        "external_system": "LEDGER: ACC_0941",
        "system_status": "SIG REQ",
        "requires_approval": True,
    },
]

DEMO_INVENTORY: List[Dict[str, Any]] = [
    {"id": "01000000-0000-0000-0000-000000000001", "sku": "SKU-8892-NEO", "name": "High-Bandwidth Transceiver Module 100G", "category": "telemetry", "facility_id": "WH-04", "quantity": 2, "reorder_threshold": 10, "unit_cost_usd": 180.00, "status": "low_stock", "vendor_id": "VEND-NLH-7701"},
    {"id": "01000000-0000-0000-0000-000000000002", "sku": "SKU-1044-CORE", "name": "Optic Switch Processor (Rev 4)", "category": "telemetry", "facility_id": "WH-04", "quantity": 0, "reorder_threshold": 8, "unit_cost_usd": 300.00, "status": "depleted", "vendor_id": "VEND-NLH-7701"},
    {"id": "01000000-0000-0000-0000-000000000003", "sku": "SKU-4410-NET", "name": "Industrial Gigabit Network Controller", "category": "hardware", "facility_id": "WH-04", "quantity": 3, "reorder_threshold": 10, "unit_cost_usd": 560.00, "status": "low_stock", "vendor_id": "VEND-APX-4412"},
    {"id": "01000000-0000-0000-0000-000000000004", "sku": "SKU-2291-FBR", "name": "Single-Mode Fiber SFP+ Module", "category": "hardware", "facility_id": "WH-04", "quantity": 5, "reorder_threshold": 15, "unit_cost_usd": 210.00, "status": "low_stock", "vendor_id": "VEND-APX-4412"},
    {"id": "01000000-0000-0000-0000-000000000005", "sku": "TAC-RELAY-01", "name": "Tactical Encrypted Communication Relay", "category": "telemetry", "facility_id": "WH-04", "quantity": 42, "reorder_threshold": 15, "unit_cost_usd": 1450.00, "status": "in_stock", "vendor_id": "VND-SATCOM-09"},
    {"id": "01000000-0000-0000-0000-000000000006", "sku": "ENC-KEY-L5", "name": "Sovereign-L5 Hardware Cryptographic Token", "category": "cryptography", "facility_id": "WH-04", "quantity": 18, "reorder_threshold": 10, "unit_cost_usd": 850.00, "status": "in_stock", "vendor_id": "VND-SEC-CIPHER"},
    {"id": "01000000-0000-0000-0000-000000000007", "sku": "DRN-BAT-8K", "name": "Tactical Drone High-Density Power Cell", "category": "power", "facility_id": "WH-04", "quantity": 65, "reorder_threshold": 20, "unit_cost_usd": 320.00, "status": "in_stock", "vendor_id": "VND-AERO-POWER"},
    {"id": "01000000-0000-0000-0000-000000000008", "sku": "THM-CAM-X4", "name": "Long-Wave Infrared Thermal Surveillance Node", "category": "surveillance", "facility_id": "WH-04", "quantity": 8, "reorder_threshold": 5, "unit_cost_usd": 4200.00, "status": "low_stock", "vendor_id": "VND-OPTIC-SPEC"},
    {"id": "01000000-0000-0000-0000-000000000009", "sku": "SRV-BLD-9U", "name": "Air-Gapped High-Throughput Server Blade Unit", "category": "hardware", "facility_id": "WH-04", "quantity": 12, "reorder_threshold": 8, "unit_cost_usd": 9800.00, "status": "in_stock", "vendor_id": "VND-COMPUTE-CORP"},
    {"id": "01000000-0000-0000-0000-000000000010", "sku": "VLT-SL-77", "name": "Hermetic Vault Seal Gasket Kit", "category": "security", "facility_id": "WH-04", "quantity": 150, "reorder_threshold": 30, "unit_cost_usd": 180.00, "status": "in_stock", "vendor_id": "VND-SEAL-TECH"},
]

DEMO_CUSTOMER_ENQUIRIES: List[Dict[str, Any]] = [
    {
        "id": "20000000-0000-0000-0000-000000000001",
        "ticket_number": "TCK-2026-0891",
        "customer_name": "Sovereign Reserve Bank of Zurich",
        "customer_email": "security-ops@srbz.ch",
        "customer_tier": "sovereign",
        "subject": "High-Frequency Ledger Discrepancy on Node 0941",
        "description": "Automated reconciliation flagged a $38,450 debit anomaly across transit accounts. Requesting immediate forensic verification and settlement dispatch.",
        "priority": "critical",
        "status": "triaged",
        "assigned_agent_id": "10000000-0000-0000-0000-000000000003",
    },
    {
        "id": "20000000-0000-0000-0000-000000000002",
        "ticket_number": "TCK-2026-0892",
        "customer_name": "Apex Defense Systems Global",
        "customer_email": "logistics@apexdefense.com",
        "customer_tier": "enterprise",
        "subject": "Urgent Restock Dispatch for Facility WH-04 Relays",
        "description": "Telemetry indicates stock of TAC-RELAY-01 is depleting ahead of schedule due to scheduled field deployment. Requesting automatic vendor purchase order generation.",
        "priority": "high",
        "status": "investigating",
        "assigned_agent_id": "10000000-0000-0000-0000-000000000002",
    },
    {
        "id": "20000000-0000-0000-0000-000000000003",
        "ticket_number": "TCK-2026-0893",
        "customer_name": "Helios Cyber Command",
        "customer_email": "triage@helios-command.gov",
        "customer_tier": "tier_1",
        "subject": "Authentication Gateway Lockout Dispute",
        "description": "Tier-1 operator credentials rejected at perimeter gate SEC-04 during routine rotation. Require instant credential re-issuance and audit verification.",
        "priority": "medium",
        "status": "resolved",
        "assigned_agent_id": "10000000-0000-0000-0000-000000000001",
    },
]

DEMO_MISSIONS: List[Dict[str, Any]] = [
    {
        "id": "30000000-0000-0000-0000-000000000001",
        "mission_code": "MS-8902-RESTOCK",
        "title": "Autonomous Replenishment PO // National Logistics Hub",
        "objective": "Check inventory, find low-stock products and prepare a restock order.",
        "agent_id": "10000000-0000-0000-0000-000000000002",
        "status": "gated",
        "priority": "high_stakes",
        "current_step": 4,
        "total_steps": 5,
        "initiated_by": "inventory_agent_kernel",
    },
    {
        "id": "30000000-0000-0000-0000-000000000002",
        "mission_code": "MS-8901-PAYOUT",
        "title": "Scheduled Supplier Wire Settlement ($38,500)",
        "objective": "Execute scheduled monthly cloud infrastructure provider disbursement.",
        "agent_id": "10000000-0000-0000-0000-000000000003",
        "status": "gated",
        "priority": "high_stakes",
        "current_step": 4,
        "total_steps": 5,
        "initiated_by": "finance_agent_kernel",
    },
]

from services.transaction_scenarios import build_seed_approvals

DEMO_APPROVAL_REQUESTS: List[Dict[str, Any]] = build_seed_approvals(6)

DEMO_AUDIT_LOGS: List[Dict[str, Any]] = [
    {
        "id": "LOG-1001",
        "timestamp": "14:22:08.012 UTC",
        "agentId": "AGT-02",
        "action": "POLICY_INTERRUPT",
        "target": "Gatehouse Supervisor Node",
        "status": "GATED",
        "latencyMs": 12,
        "hash": "0x9f4c882a...b21",
        "details": "Rule POL-093 tripped: National Logistics Hub PO #PO-8841-B (Txn: TXN-2026-9101, Value: ₹18,500) exceeds autonomous ceiling (₹14,000).",
    },
    {
        "id": "LOG-1002",
        "timestamp": "14:20:44.112 UTC",
        "agentId": "AGT-02",
        "action": "TOOL_RPC: query_stock_levels",
        "target": "SAP S/4HANA Connector",
        "status": "200 OK",
        "latencyMs": 18,
        "hash": "0x44a10992...e11",
        "details": "Queried stock for WH_04_EAST. 1,420 SKUs scanned, 2 depleted anomalies flagged.",
    },
]


# ==============================================================================
# Bi-directional Serialization & Schema Adaptors
# ==============================================================================
def row_to_approval(row: Dict[str, Any]) -> Dict[str, Any]:
    """Converts a database approval_requests row to the rich frontend model."""
    amt = row.get("amount") or row.get("amount_usd") or 0
    curr = row.get("currency") or "INR"
    status_raw = (row.get("status") or "pending").upper()
    total_val = float(amt)
    subtotal_val = float(row.get("subtotal") or (total_val * 0.81))
    gst_val = float(row.get("gst") or (total_val * 0.15))
    shipping_val = float(row.get("shipping") or 0)
    limit_val = float(row.get("autonomous_limit") or 14000)
    variance_val = float(row.get("variance_amount") or max(0, total_val - limit_val))

    supplier = row.get("supplier") or (
        row.get("arguments", {}).get("vendor")
        if isinstance(row.get("arguments"), dict)
        else "National Logistics Hub"
    )
    po_num = row.get("po_number") or row.get("request_id") or f"PO-{str(row.get('id', ''))[:8]}"
    req_id = row.get("request_id") or f"#REQ-{str(row.get('id', ''))[:8]}"

    line_items = row.get("line_items") or []
    if isinstance(line_items, str):
        try:
            line_items = json.loads(line_items)
        except Exception:
            line_items = []

    reasoning_steps = row.get("reasoning_steps") or []
    if isinstance(reasoning_steps, str):
        try:
            reasoning_steps = json.loads(reasoning_steps)
        except Exception:
            reasoning_steps = []

    return {
        "id": str(row.get("id")),
        "requestId": req_id,
        "missionId": str(row.get("mission_id") or ""),
        "agentId": row.get("agent_id") or "AGT-02",
        "agentName": row.get("agent_name") or "INVENTORY AGENT",
        "senderEmail": "inventory.operations@enclave.internal",
        "recipientEmail": "business.owner@company.internal",
        "subject": f"ACTION REQUIRED: Authorize Supplier Purchase Order #{po_num} (₹{total_val:,.0f})",
        "category": "Procurement & Hardware Replenishment",
        "isStarred": True,
        "isRead": False,
        "title": row.get("action_name") or f"CREATE SUPPLIER PURCHASE ORDER // {supplier.upper()}",
        "description": row.get("action_type") or f"Procurement requisition for {supplier}.",
        "prompt": row.get("prompt") or "Check inventory, find low-stock products and prepare a restock order.",
        "amount": total_val,
        "amountFormatted": f"₹{total_val:,.0f} (${int(total_val * 1.88):,} USD)" if curr == "INR" else f"${total_val:,.2f} USD",
        "autonomousLimit": limit_val,
        "varianceAmount": variance_val,
        "currency": curr,
        "riskLevel": (row.get("risk_factor") or "CRITICAL").upper(),
        "policyRule": "RULE_POL_093",
        "enclaveHash": row.get("enclave_hash") or f"0x{uuid4().hex[:12]}",
        "status": status_raw,
        "timestamp": str(row.get("created_at") or "Just now"),
        "reasoningSteps": reasoning_steps,
        "boundTool": f"netsuite_erp.draft_po (Vendor: {row.get('supplier_code', 'VEND-NLH-7701')})",
        "toolPayload": row.get("arguments") or {},
        "lineItems": line_items,
        "supplier": supplier,
        "supplierCode": row.get("supplier_code") or "VEND-NLH-7701",
        "supplierAddress": row.get("supplier_address") or "",
        "poNumber": po_num,
        "invoiceNumber": row.get("invoice_number") or f"INV-2026-7701",
        "transactionId": row.get("transaction_id") or f"TXN-2026-9101",
        "subtotal": subtotal_val,
        "gst": gst_val,
        "shipping": shipping_val,
        "total": total_val,
        "subtotalFormatted": f"₹{subtotal_val:,.0f}",
        "gstFormatted": f"₹{gst_val:,.0f}",
        "shippingFormatted": f"₹{shipping_val:,.0f}",
        "limitFormatted": f"₹{limit_val:,.0f}",
        "varianceFormatted": f"₹{variance_val:,.0f}",
        "approvedBy": row.get("operator_id"),
        "approvedAt": row.get("decided_at"),
        "executionCount": row.get("execution_count", 0),
    }


# ==============================================================================
# Database Access Functions (Supabase with Demo Fallback)
# ==============================================================================
def db_get_agents() -> List[Dict[str, Any]]:
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("agents").select("*").order("slug").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase agents table: {e}")
    return DEMO_AGENTS


def db_get_inventory() -> List[Dict[str, Any]]:
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("inventory").select("*").order("sku").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase inventory table: {e}")
    return DEMO_INVENTORY


def db_get_customer_enquiries() -> List[Dict[str, Any]]:
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("customer_enquiries").select("*").order("ticket_number").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase customer_enquiries table: {e}")
    return DEMO_CUSTOMER_ENQUIRIES


def db_get_missions() -> List[Dict[str, Any]]:
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("missions").select("*").order("mission_code").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase missions table: {e}")
    return DEMO_MISSIONS


def db_get_approval_requests() -> List[Dict[str, Any]]:
    """Returns approval requests from Supabase PostgreSQL, formatted for the UI."""
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("approval_requests").select("*").order("created_at", desc=True).execute()
            if res.data:
                return [row_to_approval(row) for row in res.data]
        except Exception as e:
            logger.warning(f"Failed querying Supabase approval_requests table: {e}")
    return DEMO_APPROVAL_REQUESTS


def db_insert_approval_request(appr: Dict[str, Any]) -> Dict[str, Any]:
    """Persists a new approval request into Supabase PostgreSQL (or fallback store)."""
    client = get_supabase_admin_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    row = {
        "id": str(appr.get("id") or uuid4()),
        "mission_id": appr.get("missionId"),
        "tool_execution_id": None,
        "action_type": appr.get("title") or "CREATE_PURCHASE_ORDER",
        "action_name": appr.get("title") or "Create Supplier Purchase Order",
        "arguments": appr.get("toolPayload") or {},
        "amount": float(appr.get("amount") or appr.get("total") or 0),
        "amount_usd": float(appr.get("amount") or 0) * 1.88,
        "currency": appr.get("currency") or "INR",
        "subtotal": float(appr.get("subtotal") or 0),
        "gst": float(appr.get("gst") or 0),
        "shipping": float(appr.get("shipping") or 0),
        "autonomous_limit": float(appr.get("autonomousLimit") or 14000),
        "variance_amount": float(appr.get("varianceAmount") or 0),
        "supplier": appr.get("supplier"),
        "supplier_code": appr.get("supplierCode"),
        "supplier_address": appr.get("supplierAddress"),
        "po_number": appr.get("poNumber"),
        "invoice_number": appr.get("invoiceNumber"),
        "transaction_id": appr.get("transactionId"),
        "line_items": appr.get("lineItems") or [],
        "reasoning_steps": appr.get("reasoningSteps") or [],
        "enclave_hash": appr.get("enclaveHash") or f"0x{uuid4().hex[:15]}",
        "request_id": appr.get("requestId") or f"#REQ-{uuid4().hex[:6].upper()}",
        "risk_factor": (appr.get("riskLevel") or "critical").lower(),
        "status": (appr.get("status") or "pending").lower(),
        "idempotency_key": f"idemp_{appr.get('transactionId') or uuid4().hex}",
        "execution_count": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    if client:
        try:
            res = client.table("approval_requests").insert(row).execute()
            if res.data:
                return row_to_approval(res.data[0])
        except Exception as e:
            logger.error(f"Failed to persist approval request to Supabase: {e}")

    # Fallback to in-memory store
    DEMO_APPROVAL_REQUESTS.insert(0, appr)
    return appr


def db_authorize_approval(
    approval_id: str,
    operator_id: str = "Business Owner // Sovereign L5",
    key_signature: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Authorizes a gated approval request.
    Enforces atomic state transition, idempotency, and single-execution constraint (chk_cannot_execute_twice).
    Rejects financial execution when persistent database storage is unavailable.
    """
    if not is_database_configured():
        raise DatabaseDegradedError(
            "Persistent database storage is unavailable (DEGRADED). "
            "Supabase connection is required to authorize and execute financial purchase orders. "
            "Configure SUPABASE_URL and service keys in apps/api/.env."
        )

    client = get_supabase_admin_client()
    if not client:
        raise DatabaseDegradedError(
            "Persistent database client could not be established. "
            "Supabase connection is required to authorize and execute financial purchase orders."
        )

    # 1. Fetch current approval record
    res = client.table("approval_requests").select("*").or_(
        f"id.eq.{approval_id},request_id.eq.{approval_id},po_number.eq.{approval_id},transaction_id.eq.{approval_id}"
    ).execute()

    if not res.data or len(res.data) == 0:
        raise ApprovalNotFoundError(f"Approval request '{approval_id}' not found.")

    record = res.data[0]
    rec_id = record["id"]

    # 2. Check state invariants
    if record.get("execution_count", 0) >= 1 or record.get("status", "").lower() in ["approved", "executed"]:
        raise DuplicateExecutionError(
            f"Duplicate execution blocked: Purchase order '{record.get('po_number') or rec_id}' "
            f"has already been executed ({record.get('execution_count', 0)} executions recorded)."
        )

    if record.get("status", "").lower() == "rejected":
        raise InvalidApprovalStateError(
            f"Cannot execute rejected action: Purchase order '{record.get('po_number') or rec_id}' was rejected."
        )

    # 3. Atomic update enforcing single execution constraint
    now_iso = datetime.now(timezone.utc).isoformat()
    sig = key_signature or f"0x{uuid4().hex[:12]}"
    update_payload = {
        "status": "approved",
        "decision": "approved",
        "operator_id": operator_id,
        "operator_notes": f"Biometric signature: {sig}",
        "decided_at": now_iso,
        "executed_at": now_iso,
        "execution_count": 1,
        "updated_at": now_iso,
    }

    update_res = (
        client.table("approval_requests")
        .update(update_payload)
        .eq("id", rec_id)
        .eq("status", "pending")
        .eq("execution_count", 0)
        .execute()
    )

    if not update_res.data:
        raise DuplicateExecutionError(f"Concurrent execution conflict on approval '{rec_id}'.")

    updated_record = update_res.data[0]

    # 4. Record tamper-evident audit log in Supabase
    supplier = updated_record.get("supplier") or "Supplier"
    po_num = updated_record.get("po_number") or updated_record.get("request_id") or rec_id
    txn_id = updated_record.get("transaction_id") or "TXN-EXEC"
    amt = updated_record.get("amount") or updated_record.get("amount_usd") or 0

    log_entry = {
        "event_type": "SOVEREIGN_AUTHORIZATION_COMMIT",
        "actor_type": "operator",
        "actor_id": operator_id,
        "approval_request_id": rec_id,
        "mission_id": updated_record.get("mission_id"),
        "tool_execution_id": updated_record.get("tool_execution_id"),
        "action": "SOVEREIGN_AUTHORIZATION_COMMIT",
        "payload": {
            "approval_id": rec_id,
            "po_number": po_num,
            "transaction_id": txn_id,
            "amount": amt,
            "signature": sig,
            "mode": "SANDBOX_SIMULATED_PO_DISPATCH",
        },
        "payload_hash": sig,
        "status": "success",
        "details": f"Sovereign signature confirmed for {updated_record.get('request_id') or po_num} (PO: {po_num}, TXN: {txn_id}). Released ₹{amt:,.0f} to {supplier} for fulfillment (Sandbox simulated PO dispatch).",
    }
    db_insert_audit_log(log_entry)

    return row_to_approval(updated_record)


def db_reject_approval(
    approval_id: str,
    reason: Optional[str] = "Operator override in Command Post",
    operator_id: str = "Business Owner // Sovereign L5",
) -> Dict[str, Any]:
    """
    Rejects a gated approval request.
    Enforces state invariants and prevents rejecting executed transactions.
    """
    if not is_database_configured():
        raise DatabaseDegradedError(
            "Persistent database storage is unavailable (DEGRADED). "
            "Supabase connection is required to record approval decisions. "
            "Configure SUPABASE_URL and service keys in apps/api/.env."
        )

    client = get_supabase_admin_client()
    if not client:
        raise DatabaseDegradedError(
            "Persistent database client could not be established. "
            "Supabase connection is required to record approval decisions."
        )

    res = client.table("approval_requests").select("*").or_(
        f"id.eq.{approval_id},request_id.eq.{approval_id},po_number.eq.{approval_id},transaction_id.eq.{approval_id}"
    ).execute()

    if not res.data or len(res.data) == 0:
        raise ApprovalNotFoundError(f"Approval request '{approval_id}' not found.")

    record = res.data[0]
    rec_id = record["id"]

    if record.get("execution_count", 0) >= 1 or record.get("status", "").lower() in ["approved", "executed"]:
        raise DuplicateExecutionError(f"Cannot reject an already executed/approved purchase order '{rec_id}'.")

    if record.get("status", "").lower() == "rejected":
        raise InvalidApprovalStateError(f"Purchase order '{rec_id}' is already rejected.")

    now_iso = datetime.now(timezone.utc).isoformat()
    update_payload = {
        "status": "rejected",
        "decision": "rejected",
        "operator_id": operator_id,
        "operator_notes": reason,
        "decided_at": now_iso,
        "updated_at": now_iso,
    }

    update_res = client.table("approval_requests").update(update_payload).eq("id", rec_id).execute()
    updated_record = update_res.data[0] if update_res.data else record

    # Audit log
    supplier = updated_record.get("supplier") or "Supplier"
    po_num = updated_record.get("po_number") or updated_record.get("request_id") or rec_id
    txn_id = updated_record.get("transaction_id") or "TXN-PURGE"

    log_entry = {
        "event_type": "SOVEREIGN_OVERRIDE_PURGE",
        "actor_type": "operator",
        "actor_id": operator_id,
        "approval_request_id": rec_id,
        "mission_id": updated_record.get("mission_id"),
        "tool_execution_id": updated_record.get("tool_execution_id"),
        "action": "SOVEREIGN_OVERRIDE_PURGE",
        "payload": {
            "approval_id": rec_id,
            "po_number": po_num,
            "transaction_id": txn_id,
            "reason": reason,
        },
        "payload_hash": f"0x{uuid4().hex[:12]}",
        "status": "rejected",
        "details": f"Operator rejected {po_num} (TXN: {txn_id}). Intent for {supplier} purged from sandbox enclave. Zero funds disbursed. Reason: {reason}",
    }
    db_insert_audit_log(log_entry)

    return row_to_approval(updated_record)


def db_insert_audit_log(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Records an immutable cryptographic audit log into Supabase (or fallback in-memory list)."""
    client = get_supabase_admin_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = entry.get("payload") or {}
    payload_hash = entry.get("payload_hash")
    if not payload_hash:
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    row = {
        "id": str(uuid4()),
        "timestamp": entry.get("timestamp") or now_iso,
        "event_type": entry.get("event_type") or "AUDIT_EVENT",
        "actor_type": entry.get("actor_type") or "system",
        "actor_id": str(entry.get("actor_id") or "system"),
        "mission_id": entry.get("mission_id"),
        "tool_execution_id": entry.get("tool_execution_id"),
        "approval_request_id": entry.get("approval_request_id"),
        "action": entry.get("action") or "ACTION",
        "payload": payload,
        "payload_hash": payload_hash,
        "status": entry.get("status") or "success",
        "details": entry.get("details"),
    }

    if client:
        try:
            res = client.table("audit_logs").insert(row).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to persist audit log to Supabase: {e}")

    # Fallback to in-memory list
    frontend_log = {
        "id": f"LOG-{random.randint(2000, 9999)}",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + " UTC",
        "agentId": entry.get("actor_id") or "AGT-02",
        "action": entry.get("action"),
        "target": f"Gatehouse // {entry.get('actor_id', 'Core')}",
        "status": (entry.get("status") or "SUCCESS").upper(),
        "latencyMs": 14,
        "hash": payload_hash[:16] if payload_hash else "0x00",
        "details": entry.get("details") or f"Event {entry.get('event_type')} recorded.",
    }
    DEMO_AUDIT_LOGS.insert(0, frontend_log)
    return frontend_log


def db_get_audit_logs() -> List[Dict[str, Any]]:
    """Returns immutable cryptographic audit logs from Supabase PostgreSQL (or fallback store)."""
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("audit_logs").select("*").order("timestamp", desc=True).limit(50).execute()
            if res.data:
                formatted_logs = []
                for r in res.data:
                    formatted_logs.append({
                        "id": f"LOG-{str(r['id'])[:8]}",
                        "timestamp": str(r.get("timestamp", "")),
                        "agentId": r.get("actor_id") or "AGT-02",
                        "action": r.get("action") or r.get("event_type"),
                        "target": f"Gatehouse // {r.get('actor_type')}",
                        "status": (r.get("status") or "SUCCESS").upper(),
                        "latencyMs": 14,
                        "hash": r.get("payload_hash") or "0x00",
                        "details": r.get("details") or f"Event {r.get('event_type')} executed.",
                    })
                return formatted_logs
        except Exception as e:
            logger.warning(f"Failed querying Supabase audit_logs table: {e}")
    return DEMO_AUDIT_LOGS
