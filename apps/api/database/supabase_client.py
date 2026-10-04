"""
GATEHOUSE Database Module: Supabase PostgreSQL Client
Keeps service-role credentials strictly server-side.
"""
from typing import Optional, List, Dict, Any
from config import settings
import logging

logger = logging.getLogger("gatehouse.database")

_supabase_client = None


def get_supabase_admin_client():
    """
    Returns an authenticated Supabase admin client using the service-role key.
    STRICTLY SERVER-SIDE. Never expose this client or its credentials to the client.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    # Service role key has admin privileges to bypass RLS for agent operations
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not url or not key:
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


# ==============================================================================
# In-Memory Demonstration Repository (Fallback when Supabase credentials are unset)
# Mirrors the exact 7 tables seeded in Supabase migrations.
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
    {"id": "01000000-0000-0000-0000-000000000001", "sku": "TAC-RELAY-01", "name": "Tactical Encrypted Communication Relay", "category": "telemetry", "facility_id": "WH-04", "quantity": 42, "reorder_threshold": 15, "unit_cost_usd": 1450.00, "status": "in_stock", "vendor_id": "VND-SATCOM-09"},
    {"id": "01000000-0000-0000-0000-000000000002", "sku": "ENC-KEY-L5", "name": "Sovereign-L5 Hardware Cryptographic Token", "category": "cryptography", "facility_id": "WH-04", "quantity": 18, "reorder_threshold": 10, "unit_cost_usd": 850.00, "status": "in_stock", "vendor_id": "VND-SEC-CIPHER"},
    {"id": "01000000-0000-0000-0000-000000000003", "sku": "DRN-BAT-8K", "name": "Tactical Drone High-Density Power Cell", "category": "power", "facility_id": "WH-04", "quantity": 65, "reorder_threshold": 20, "unit_cost_usd": 320.00, "status": "in_stock", "vendor_id": "VND-AERO-POWER"},
    {"id": "01000000-0000-0000-0000-000000000004", "sku": "THM-CAM-X4", "name": "Long-Wave Infrared Thermal Surveillance Node", "category": "surveillance", "facility_id": "WH-04", "quantity": 8, "reorder_threshold": 5, "unit_cost_usd": 4200.00, "status": "low_stock", "vendor_id": "VND-OPTIC-SPEC"},
    {"id": "01000000-0000-0000-0000-000000000005", "sku": "SRV-BLD-9U", "name": "Air-Gapped High-Throughput Server Blade Unit", "category": "hardware", "facility_id": "WH-04", "quantity": 12, "reorder_threshold": 8, "unit_cost_usd": 9800.00, "status": "in_stock", "vendor_id": "VND-COMPUTE-CORP"},
    {"id": "01000000-0000-0000-0000-000000000006", "sku": "BIO-SCN-02", "name": "Multi-Modal Biometric Handprint Scanner", "category": "security", "facility_id": "WH-04", "quantity": 24, "reorder_threshold": 10, "unit_cost_usd": 1950.00, "status": "in_stock", "vendor_id": "VND-SEC-CIPHER"},
    {"id": "01000000-0000-0000-0000-000000000007", "sku": "RF-JAM-500", "name": "Wideband RF Frequency Shield & Attenuator", "category": "hardware", "facility_id": "WH-04", "quantity": 4, "reorder_threshold": 5, "unit_cost_usd": 6400.00, "status": "low_stock", "vendor_id": "VND-DEF-TACTICAL"},
    {"id": "01000000-0000-0000-0000-000000000008", "sku": "VLT-SL-77", "name": "Hermetic Vault Seal Gasket Kit", "category": "security", "facility_id": "WH-04", "quantity": 150, "reorder_threshold": 30, "unit_cost_usd": 180.00, "status": "in_stock", "vendor_id": "VND-SEAL-TECH"},
    {"id": "01000000-0000-0000-0000-000000000009", "sku": "FBR-SPL-96", "name": "96-Core Armored Optical Splice Cassette", "category": "telemetry", "facility_id": "WH-04", "quantity": 85, "reorder_threshold": 25, "unit_cost_usd": 240.00, "status": "in_stock", "vendor_id": "VND-OPTIC-SPEC"},
    {"id": "01000000-0000-0000-0000-000000000010", "sku": "QNT-RNG-01", "name": "Quantum Random Number Generator PCI Module", "category": "cryptography", "facility_id": "WH-04", "quantity": 2, "reorder_threshold": 3, "unit_cost_usd": 14500.00, "status": "low_stock", "vendor_id": "VND-QUANTUM-LABS"},
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
        "mission_code": "MSN-2026-9841",
        "title": "Sovereign Wire Transfer Settlement ($38,450)",
        "objective": "Execute automated high-value vendor settlement. Halt at Perimeter Gate for operator biometric sign-off.",
        "agent_id": "10000000-0000-0000-0000-000000000003",
        "customer_enquiry_id": "20000000-0000-0000-0000-000000000001",
        "status": "gated",
        "priority": "high_stakes",
        "current_step": 4,
        "total_steps": 5,
        "initiated_by": "finance_agent_autonomous_kernel",
    },
    {
        "id": "30000000-0000-0000-0000-000000000002",
        "mission_code": "MSN-2026-9842",
        "title": "Perimeter Key Rotation & Lockout Cleared",
        "objective": "Verify identity of Helios Cyber Command operator and issue refreshed authentication token.",
        "agent_id": "10000000-0000-0000-0000-000000000001",
        "customer_enquiry_id": "20000000-0000-0000-0000-000000000003",
        "status": "completed",
        "priority": "standard",
        "current_step": 5,
        "total_steps": 5,
        "initiated_by": "customer_agent_kernel",
    },
    {
        "id": "30000000-0000-0000-0000-000000000003",
        "mission_code": "MSN-2026-9843",
        "title": "Automated Replenishment PO Generation",
        "objective": "Generate vendor PO for TAC-RELAY-01 restock via SAP ERP API.",
        "agent_id": "10000000-0000-0000-0000-000000000002",
        "customer_enquiry_id": "20000000-0000-0000-0000-000000000002",
        "status": "failed",
        "priority": "standard",
        "current_step": 3,
        "total_steps": 5,
        "initiated_by": "inventory_agent_kernel",
        "error_message": "Upstream ERP Gateway Timeout: SAP RFC endpoint at erp-gateway.internal failed to respond within 5000ms after 3 retries.",
        "error_details": {"endpoint": "https://erp-gateway.internal/rfc/bapi_po_create1", "http_status": 504, "circuit_breaker": "OPEN", "retry_exhausted": True},
    },
]

DEMO_APPROVAL_REQUESTS: List[Dict[str, Any]] = [
    {
        "id": "50000000-0000-0000-0000-000000000001",
        "mission_id": "30000000-0000-0000-0000-000000000001",
        "tool_execution_id": "40000000-0000-0000-0000-000000000001",
        "action_type": "HIGH_VALUE_WIRE_PAYOUT",
        "action_name": "Authorize $38,450 Wire Payout to Apex Logistics Global LLC",
        "arguments": {
            "source_account": "ACC_0941_MAIN_TREASURY",
            "destination_iban": "US89370400440532013000",
            "amount_usd": 38450.00,
            "vendor": "Apex Logistics Global LLC",
            "invoice_ref": "INV-2026-9024",
            "reason": "Perimeter telemetry deployment tranche 01",
        },
        "amount_usd": 38450.00,
        "risk_factor": "critical",
        "status": "pending",
        "idempotency_key": "idemp_wire_payout_3000000000000000000000000001",
        "execution_count": 0,
    }
]

DEMO_AUDIT_LOGS: List[Dict[str, Any]] = [
    {
        "id": "60000000-0000-0000-0000-000000000002",
        "timestamp": "2026-10-04T06:20:00Z",
        "event_type": "APPROVAL_GATE_HALTED",
        "actor_type": "system",
        "actor_id": "gatehouse_perimeter_shield",
        "mission_id": "30000000-0000-0000-0000-000000000001",
        "tool_execution_id": "40000000-0000-0000-0000-000000000001",
        "approval_request_id": "50000000-0000-0000-0000-000000000001",
        "action": "HIGH_VALUE_WIRE_PAYOUT_HALTED",
        "payload": {"amount_usd": 38450.00, "threshold": 25000.00, "rule": "FAIL_SAFE_GATING_RULE_04"},
        "payload_hash": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        "status": "gated",
    },
    {
        "id": "60000000-0000-0000-0000-000000000001",
        "timestamp": "2026-10-04T06:15:00Z",
        "event_type": "TOOL_EXECUTION_COMPLETED",
        "actor_type": "agent",
        "actor_id": "10000000-0000-0000-0000-000000000001",
        "mission_id": "30000000-0000-0000-0000-000000000002",
        "tool_execution_id": "40000000-0000-0000-0000-000000000002",
        "approval_request_id": None,
        "action": "crm_resolve_dispute",
        "payload": {"ticket_id": "TCK-2026-0893", "resolution_code": "KEY_ROTATED_SUCCESS"},
        "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "status": "success",
    },
    {
        "id": "60000000-0000-0000-0000-000000000003",
        "timestamp": "2026-10-04T06:00:00Z",
        "event_type": "TOOL_EXECUTION_FAILED",
        "actor_type": "agent",
        "actor_id": "10000000-0000-0000-0000-000000000002",
        "mission_id": "30000000-0000-0000-0000-000000000003",
        "tool_execution_id": "40000000-0000-0000-0000-000000000003",
        "approval_request_id": None,
        "action": "inventory_dispatch_po",
        "payload": {"vendor_id": "VND-SATCOM-09", "quantity": 25},
        "payload_hash": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
        "status": "failed",
    }
]


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
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("approval_requests").select("*").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase approval_requests table: {e}")
    return DEMO_APPROVAL_REQUESTS


def db_get_audit_logs() -> List[Dict[str, Any]]:
    client = get_supabase_admin_client()
    if client:
        try:
            res = client.table("audit_logs").select("*").order("timestamp", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Failed querying Supabase audit_logs table: {e}")
    return DEMO_AUDIT_LOGS
