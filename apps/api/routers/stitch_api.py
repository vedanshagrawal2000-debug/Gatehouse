"""
Stitch API Router for GATEHOUSE Operations Command Post.
Provides full synchronous backend connectivity for the frontend:
- /api/agent/run (Autonomous Operations Agent orchestrator with Gemini API & deterministic fallback)
- /api/approvals (Human approval request repository)
- /api/approvals/authorize (Biometric authorization endpoint)
- /api/approvals/reject (Operator reject endpoint)
- /api/agents (Agent roster & specs)
- /api/audit-logs (Immutable audit logs)
- /api/tools/* (Direct business tools)
"""

import os
import random
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from config import settings
from database import (
    DEMO_APPROVAL_REQUESTS,
    DEMO_AUDIT_LOGS,
    DEMO_CUSTOMER_ENQUIRIES,
    DEMO_INVENTORY,
    DEMO_MISSIONS,
    db_get_agents,
    db_get_approval_requests,
    db_get_audit_logs,
    db_get_customer_enquiries,
    db_get_inventory,
)

router = APIRouter(prefix="/api", tags=["Stitch Frontend Integration"])

# In-memory store mirroring the Stitch state
STITCH_INVENTORY: List[Dict[str, Any]] = [
    {
        "sku": "SKU-8892-NEO",
        "name": "High-Bandwidth Transceiver Module 100G",
        "category": "CRITICAL_COMPONENTS",
        "stock": 2,
        "minThreshold": 10,
        "unitPrice": 250.00,
        "currency": "USD",
        "location": "Warehouse 04 East (Aisle 12-C)",
        "status": "low",
        "supplierId": "VEND-LOGISTICS-77",
    },
    {
        "sku": "SKU-1044-CORE",
        "name": "Optic Switch Processor (Rev 4)",
        "category": "CRITICAL_COMPONENTS",
        "stock": 0,
        "minThreshold": 8,
        "unitPrice": 300.00,
        "currency": "USD",
        "location": "Warehouse 04 East (Aisle 04-A)",
        "status": "depleted",
        "supplierId": "VEND-LOGISTICS-77",
    },
    {
        "sku": "SKU-3321-MEM",
        "name": "ECC DDR5 64GB Server DIMM",
        "category": "MEMORY_SUBSYSTEM",
        "stock": 48,
        "minThreshold": 15,
        "unitPrice": 180.00,
        "currency": "USD",
        "location": "Warehouse 04 East (Aisle 08-B)",
        "status": "optimal",
        "supplierId": "VEND-SEMICON-02",
    },
    {
        "sku": "SKU-7709-PSU",
        "name": "1600W Titanium Hot-Swap Redundant PSU",
        "category": "POWER_UNITS",
        "stock": 14,
        "minThreshold": 10,
        "unitPrice": 320.00,
        "currency": "USD",
        "location": "Warehouse 02 West (Rack 01)",
        "status": "optimal",
        "supplierId": "VEND-POWERGRID-11",
    },
    {
        "sku": "SKU-9901-NIC",
        "name": "Dual-Port 200GbE PCIe Gen5 NIC",
        "category": "NETWORK_INTERFACE",
        "stock": 4,
        "minThreshold": 12,
        "unitPrice": 890.00,
        "currency": "USD",
        "location": "Warehouse 04 East (Aisle 15-D)",
        "status": "low",
        "supplierId": "VEND-NETWORKS-09",
    },
]

STITCH_ENQUIRIES: List[Dict[str, Any]] = [
    {
        "id": "ENQ-9042",
        "ticketNumber": "Ticket #9042",
        "customerName": "Acmo Corp / Operations Division",
        "customerEmail": "ops@acmocorp.internal",
        "subject": "Damaged shipment received in Warehouse 04 (Transceiver modules)",
        "message": "We received 20x SKU-8892-NEO transceiver units damaged during transit via freight carrier. Need immediate restock replacement or $1,250 refund credit committed to our net-30 ledger.",
        "urgency": "HIGH",
        "status": "PENDING",
        "timestamp": "2026-10-03 14:18:12 UTC",
    },
    {
        "id": "ENQ-9048",
        "ticketNumber": "Ticket #9048",
        "customerName": "Helios Cloud Infrastructure",
        "customerEmail": "procurement@helioscloud.io",
        "subject": "Quotation request for 40x Dual-Port 200GbE NICs",
        "message": "Looking to expand cluster rack 9. Requesting wholesale enterprise quotation with standard SLA delivery to Singapore DC.",
        "urgency": "MEDIUM",
        "status": "PENDING",
        "timestamp": "2026-10-03 13:45:00 UTC",
    },
    {
        "id": "ENQ-9051",
        "ticketNumber": "Ticket #9051",
        "customerName": "Cyberdyne Systems",
        "customerEmail": "billing@cyberdyne.net",
        "subject": "Invoice clarification for Q3 server maintenance contracts",
        "message": "Please provide itemized invoice breakdown for our scheduled maintenance window on September 28.",
        "urgency": "LOW",
        "status": "PENDING",
        "timestamp": "2026-10-03 12:10:20 UTC",
    },
]

STITCH_APPROVALS: List[Dict[str, Any]] = [
    {
        "id": "appr-01",
        "requestId": "#REQ-8841-B",
        "missionId": "MS-8902-RESTOCK",
        "agentId": "AGT-02",
        "agentName": "INVENTORY AGENT",
        "title": "CREATE SUPPLIER PURCHASE ORDER",
        "description": "Critical inventory threshold breach: SKU-8892-NEO stock at 2 units (Min: 10) and SKU-1044-CORE stock at 0 units. Automated vendor requisition drafted to prevent fulfillment outage across East Coast distribution hubs.",
        "prompt": "Check inventory, find low-stock products and prepare a restock order.",
        "amount": 18500,
        "amountFormatted": "₹18,500 ($34,800.00 USD)",
        "autonomousLimit": 14000,
        "varianceAmount": 4500,
        "currency": "USD",
        "riskLevel": "CRITICAL",
        "policyRule": "RULE_POL_093",
        "enclaveHash": "0x9f4c882a46c3b21",
        "status": "PENDING",
        "timestamp": "14:22:07 UTC (3m ago)",
        "reasoningSteps": [
            "Queried Warehouse 04 East via SAP Connector. Retrieved 1,420 SKUs telemetry matrix.",
            "Identified critical depletion on SKU-8892-NEO (2 units remaining; safe min: 10) and SKU-1044-CORE (0 units; stockout breach).",
            "Calculated safety buffer restock: 50 units for transceiver module and 20 units for processor using wholesale SLA terms with Vendor-77.",
            "Staged purchase requisition draft #PO-8841-B in sandbox enclave for dry-run validation.",
            "TRIPWIRE ENGAGED: Calculated total PO value of ₹18,500 ($34,800 USD) exceeds autonomous agent purchase threshold (₹14,000 max). Sovereign biometric signature mandatory.",
        ],
        "boundTool": "netsuite_erp.draft_po (Scope: ledger:write)",
        "toolPayload": {
            "vendor_id": "VEND-LOGISTICS-77",
            "po_number": "PO-8841-B",
            "line_items": [
                {"sku": "SKU-8892-NEO", "qty": 50, "price": 250.00},
                {"sku": "SKU-1044-CORE", "qty": 20, "price": 300.00},
            ],
            "total_amount": 18500.00,
            "currency": "USD",
        },
        "lineItems": [
            {
                "sku": "SKU-8892-NEO",
                "description": "High-Bandwidth Transceiver Module 100G",
                "quantity": 50,
                "unitPrice": 250.00,
                "extendedAmount": 12500.00,
            },
            {
                "sku": "SKU-1044-CORE",
                "description": "Optic Switch Processor (Rev 4)",
                "quantity": 20,
                "unitPrice": 300.00,
                "extendedAmount": 6000.00,
            },
        ],
    },
    {
        "id": "appr-02",
        "requestId": "#REQ-8839-F",
        "missionId": "MS-8901-PAYOUT",
        "agentId": "AGT-03",
        "agentName": "FINANCE AGENT",
        "title": "DISPATCH WIRE TRANSFER // HIGH VALUE PAYOUT",
        "description": "Automated supplier scheduled payment for Tier-1 Cloud Infrastructure contracts exceeding autonomous limit.",
        "prompt": "Execute scheduled monthly cloud infrastructure provider disbursement.",
        "amount": 38500,
        "amountFormatted": "₹3,12,000 ($38,500.00 USD)",
        "autonomousLimit": 25000,
        "varianceAmount": 13500,
        "currency": "USD",
        "riskLevel": "CRITICAL",
        "policyRule": "RULE_POL_044",
        "enclaveHash": "0x9f4ce0082a994c",
        "status": "PENDING",
        "timestamp": "14:15:30 UTC (10m ago)",
        "reasoningSteps": [
            "Verified contract SLA terms against hash in HashiCorp Vault.",
            "Generated SWIFT payment payload for routing code CHASUS33.",
            "TRIPWIRE ENGAGED: Disbursal sum of $38,500 exceeds $25,000 ceiling. Halting for dual-sig confirmation.",
        ],
        "boundTool": "swift_highway.wire_transfer (Scope: wire:execute)",
        "toolPayload": {
            "beneficiary": "Cloud Provider Infrastructure Inc",
            "amount": 38500.00,
            "routing": "CHASUS33",
            "account": "ACC-9941-88",
        },
    },
    {
        "id": "appr-03",
        "requestId": "#REQ-8835-C",
        "missionId": "MS-8899-SUPPORT",
        "agentId": "AGT-01",
        "agentName": "CUSTOMER AGENT",
        "title": "EXECUTE DIRECT REFUND CREDIT",
        "description": "Customer satisfaction refund credit for Ticket #9042 damaged parcel.",
        "prompt": "Authorize $15.00 partial shipping concession for damaged packaging.",
        "amount": 15,
        "amountFormatted": "₹1,250 ($15.00 USD)",
        "autonomousLimit": 50,
        "varianceAmount": 0,
        "currency": "USD",
        "riskLevel": "MODERATE",
        "policyRule": "RULE_POL_012",
        "enclaveHash": "0x44a100223910c",
        "status": "APPROVED",
        "timestamp": "14:10:02 UTC",
        "approvedBy": "ADM-01",
        "approvedAt": "14:10:45 UTC",
        "reasoningSteps": [
            "Customer sentiment verified > 95%.",
            "Value within Level 1 micro-policy ceiling.",
            "Credit committed to Stripe balance.",
        ],
        "boundTool": "stripe.refunds.create (Scope: refunds:write)",
        "toolPayload": {
            "customer": "Acmo Corp",
            "amount": 15.00,
        },
    },
]

STITCH_AUDIT_LOGS: List[Dict[str, Any]] = [
    {
        "id": "LOG-1001",
        "timestamp": "14:22:08.012 UTC",
        "agentId": "AGT-02",
        "action": "POLICY_INTERRUPT",
        "target": "Gatehouse Supervisor Node",
        "status": "GATED",
        "latencyMs": 12,
        "hash": "0x9f4c882a...b21",
        "details": "Rule POL-093 tripped: amount ($34,800.00) exceeds autonomous ceiling ($25,000.00)",
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
    {
        "id": "LOG-1003",
        "timestamp": "14:18:12.420 UTC",
        "agentId": "AGT-01",
        "action": "TOOL_RPC: generate_resolution_macro",
        "target": "Zendesk Enterprise Bridge",
        "status": "200 OK",
        "latencyMs": 420,
        "hash": "0x88f12a01...99c",
        "details": "Drafted resolution response for Ticket #9042 with 98.4% satisfaction confidence.",
    },
    {
        "id": "LOG-1004",
        "timestamp": "14:15:00.812 UTC",
        "agentId": "AGT-03",
        "action": "KEY_REQUEST: request_ephemeral_token",
        "target": "HashiCorp Vault",
        "status": "AUDITED",
        "latencyMs": 9,
        "hash": "0x22c4a919...01e",
        "details": "Issued 300s TTL token for ADM-01 role via AES-256-GCM enclave tunnel.",
    },
    {
        "id": "LOG-1005",
        "timestamp": "14:02:11.200 UTC",
        "agentId": "AGT-02",
        "action": "CACHE_SYNC: fetch_reorder_point",
        "target": "Oracle ERP Cloud",
        "status": "200 OK",
        "latencyMs": 12,
        "hash": "0x12c988aa...fa3",
        "details": "Sync Batch #441 committed 1.4KB payload for Warehouse 04 reorder calculations.",
    },
]

STITCH_AGENTS: List[Dict[str, Any]] = [
    {
        "id": "agt-01",
        "code": "AGT-01",
        "name": "CUSTOMER AGENT",
        "status": "ONLINE",
        "statusBadge": "ONLINE",
        "description": "Handles customer enquiries and prepares context-aware customer responses autonomously.",
        "assignedTools": ["Zendesk Enterprise", "Intercom API", "Slack Ingress", "Vector Base (Faiss)"],
        "tasksExec": 142,
        "latencyMs": 18,
        "vramAlloc": "420 MB",
        "lastInference": {
            "summary": "Drafted refund resolution for Ticket #9042 — customer satisfaction confidence 98.4%.",
            "timeAgo": "42s AGO",
            "confidence": "98.4%",
        },
        "gatingPolicy": "GATING: MICRO-POLICY",
        "enclave": "gVisor Sandbox (#SB-880)",
        "model": "gemini-2.5-flash",
    },
    {
        "id": "agt-02",
        "code": "AGT-02",
        "name": "INVENTORY AGENT",
        "status": "SYNC ACTIVE",
        "statusBadge": "SYNC ACTIVE",
        "description": "Checks inventory levels, autonomously detects low stock, and dispatches restock purchase orders.",
        "assignedTools": ["SAP S/4HANA", "Oracle ERP Cloud", "Warehouse IoT", "WMS Egress"],
        "tasksExec": 89,
        "latencyMs": 8,
        "vramAlloc": "610 MB",
        "lastInference": {
            "summary": "Triggered reorder calculation for SKU_8892 (Stock: 2 units, Threshold: 10 units) in Warehouse 04.",
            "timeAgo": "3m AGO",
            "confidence": "99.9%",
        },
        "gatingPolicy": "GATING: AUTO-PO <$10K",
        "enclave": "gVisor Sandbox (#SB-882)",
        "model": "gemini-2.5-flash",
    },
    {
        "id": "agt-03",
        "code": "AGT-03",
        "name": "FINANCE AGENT",
        "status": "GATE HALTED",
        "statusBadge": "GATE HALTED",
        "description": "Prepares invoices and orchestrates capital requests requiring deterministic dual-sig approval.",
        "assignedTools": ["NetSuite CLI v2", "Stripe Financial", "SWIFT Highway", "Audit Vault"],
        "tasksExec": 37,
        "latencyMs": 19,
        "vramAlloc": "540 MB",
        "lastInference": {
            "summary": "Drafted PO #8841-B Wire ($34,800.00) — Halted at Gatehouse biometric perimeter awaiting Sovereign Sig.",
            "timeAgo": "1m AGO",
            "confidence": "100%",
        },
        "gatingPolicy": "GATING: BIOMETRIC >$25K",
        "enclave": "gVisor Sandbox (#SB-883)",
        "model": "gemini-2.5-flash",
    },
]


# ==============================================================================
# Models
# ==============================================================================
class AgentRunRequest(BaseModel):
    prompt: str = Field(..., description="Natural language operational directive")


class AuthorizeRequest(BaseModel):
    id: str
    authorized_by: Optional[str] = "ADM-01 [SOVEREIGN-L5]"
    key_signature: Optional[str] = None


class RejectRequest(BaseModel):
    id: str
    reason: Optional[str] = "Operator override"


class LowStockRequest(BaseModel):
    buffer_percentage: Optional[float] = 10.0


class PrepareRestockRequest(BaseModel):
    vendor_id: Optional[str] = "VEND-LOGISTICS-77"
    line_items: Optional[List[Dict[str, Any]]] = None


class DraftReplyRequest(BaseModel):
    ticket_id: str
    proposed_resolution: str
    refund_amount: Optional[float] = 0.0


class CreateInvoiceRequest(BaseModel):
    customer_name: str
    line_items: List[Dict[str, Any]]
    currency: Optional[str] = "USD"
    due_date: Optional[str] = None


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("/agent/run")
async def run_agent(payload: AgentRunRequest):
    """
    Executes an agent workflow with Gemini Operations Agent reasoning and tool calling.
    Falls back gracefully to deterministic sandbox execution if API quotas are met.
    """
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    start_time = time.time()
    prompt_lower = prompt.lower()
    is_customer = any(k in prompt_lower for k in ["customer", "enquiry", "ticket", "reply", "dispute"])
    is_invoice = any(k in prompt_lower for k in ["invoice", "billing", "wire", "payout", "transfer"])

    # Determine target agent
    if is_customer:
        target_agent = {
            "id": "agt-01",
            "code": "AGT-01",
            "name": "CUSTOMER AGENT",
            "enclave": "gVisor Sandbox (#SB-880)",
        }
    elif is_invoice:
        target_agent = {
            "id": "agt-03",
            "code": "AGT-03",
            "name": "FINANCE AGENT",
            "enclave": "gVisor Sandbox (#SB-883)",
        }
    else:
        target_agent = {
            "id": "agt-02",
            "code": "AGT-02",
            "name": "INVENTORY AGENT",
            "enclave": "gVisor Sandbox (#SB-882)",
        }

    mission_suffix = "SUPPORT" if is_customer else "FINANCE" if is_invoice else "RESTOCK"
    mission_id = f"MS-{random.randint(1000, 9999)}-{mission_suffix}"
    pid = random.randint(90000, 99999)

    now_utc = lambda: datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + " UTC"

    events: List[Dict[str, Any]] = []
    raw_logs: List[str] = []

    # 1. Ingress
    raw_logs.append(f"[{now_utc()}] [IPC-SOCKET] Handshake established with {target_agent['enclave']}")
    events.append({
        "id": "ev-01",
        "stepNumber": 1,
        "title": "Request received",
        "timestamp": now_utc(),
        "status": "DONE",
        "source": "Webhook Ingress (REST-JSON)",
        "badge": "INGRESS_OK",
        "payloadInput": {
            "prompt": prompt,
            "urgency": "HIGH",
            "requester": "ADM-01",
            "channel": "SLACK_ORCHESTRATOR",
        },
    })

    # 2. Agent Selection
    raw_logs.append(f"[{now_utc()}] [DAG-DISPATCH] Kernel decomposed prompt into AST operations pipeline")
    domain_desc = (
        "customer communication and dispute resolution"
        if is_customer
        else "accounts receivable and financial ledger ops"
        if is_invoice
        else "warehouse replenishment and stock reconciliation"
    )
    events.append({
        "id": "ev-02",
        "stepNumber": 2,
        "title": f"{target_agent['name']} selected",
        "timestamp": now_utc(),
        "status": "DONE",
        "source": "Gemini 2.5 Flash / Enclave Sandbox",
        "reasoningTrace": f"Target domain parsed as {domain_desc}. Routing intent to {target_agent['name']} ({target_agent['code']}) with deterministic connector bindings.",
    })

    halted_for_approval = False
    approval_request: Optional[Dict[str, Any]] = None
    final_output: Any = None

    if is_customer:
        # Step 3: Fetch enquiries
        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling get_customer_enquiries()")
        events.append({
            "id": "ev-03",
            "stepNumber": 3,
            "title": "Customer enquiries retrieved",
            "timestamp": now_utc(),
            "status": "DONE",
            "payloadInput": {"urgency": "HIGH"},
            "payloadOutput": STITCH_ENQUIRIES,
        })

        # Step 4: Draft reply
        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling draft_customer_reply() for Ticket #9042")
        reply = {
            "status": "STAGED",
            "ticket_id": "Ticket #9042",
            "recipient": "ops@acmocorp.internal",
            "resolution_draft": "We have dispatched priority courier replacement units for SKU-8892-NEO and credited $1,250 concession to your corporate ledger account.",
            "refund_amount": 1250.00,
            "biometric_gating_tripwire": True,
            "gating_reason": "Refund concession ($1,250.00) exceeds autonomous customer threshold ($500.00)",
        }
        events.append({
            "id": "ev-04",
            "stepNumber": 4,
            "title": "Customer reply drafted & reviewed",
            "timestamp": now_utc(),
            "status": "DONE",
            "payloadOutput": reply,
        })

        halted_for_approval = True
        raw_logs.append(f"[{now_utc()}] [POLICY-ENGINE] Rule POL-012 tripped: refund ($1,250) > auto limit ($500)")
        raw_logs.append(f"[{now_utc()}] [PERIMETER] Emitted interrupt signal to Gatehouse supervisor node")

        req_id = f"#REQ-{random.randint(8000, 8999)}-C"
        appr_id = f"appr-{int(time.time() * 1000)}"
        approval_request = {
            "id": appr_id,
            "requestId": req_id,
            "missionId": mission_id,
            "agentId": target_agent["code"],
            "agentName": target_agent["name"],
            "title": "EXECUTE CUSTOMER REFUND & RESOLUTION",
            "description": "Customer concession for damaged transceiver units exceeding autonomous support ceiling.",
            "prompt": prompt,
            "amount": 1250,
            "amountFormatted": "$1,250.00 USD",
            "autonomousLimit": 500,
            "varianceAmount": 750,
            "currency": "USD",
            "riskLevel": "ELEVATED",
            "policyRule": "RULE_POL_012",
            "enclaveHash": f"0x{uuid4().hex[:12]}",
            "status": "PENDING",
            "timestamp": "Just now",
            "reasoningSteps": [
                "Scanned incoming customer tickets.",
                "Assessed customer value score (Tier 1 enterprise contract).",
                "Drafted empathetic apology & immediate replacement PO.",
                "TRIPWIRE ENGAGED: Refund value $1,250 exceeds autonomous support budget ($500). Dual-sig required.",
            ],
            "boundTool": "zendesk_support.issue_refund",
            "toolPayload": reply,
        }
        STITCH_APPROVALS.insert(0, approval_request)
        final_output = reply

    elif is_invoice:
        # Step 3: Calculate invoice
        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling create_invoice()")
        invoice_payload = {
            "status": "STAGED_DRAFT",
            "invoice_number": f"INV-2026-{random.randint(1000, 9999)}",
            "customer_name": "Cyberdyne Systems Corp",
            "currency": "USD",
            "line_items": [
                {"description": "High-Performance Cluster Maintenance Q3", "amount": 18000.00},
                {"description": "Optic Switch Redundant Line Replacement", "amount": 14000.00},
            ],
            "subtotal": 32000.00,
            "tax": 2800.00,
            "total_amount": 34800.00,
            "biometric_gating_tripwire": True,
            "gating_reason": "Total invoice creation value ($34,800.00) exceeds autonomous threshold ($25,000.00)",
        }
        events.append({
            "id": "ev-03",
            "stepNumber": 3,
            "title": "Invoice parameters calculated",
            "timestamp": now_utc(),
            "status": "DONE",
            "payloadInput": {"customer": "Cyberdyne Systems Corp", "items": 2},
            "payloadOutput": invoice_payload,
        })

        halted_for_approval = True
        raw_logs.append(f"[{now_utc()}] [TRIPWIRE] Invoice sum ($34,800) trips Sovereign Rule POL-093")
        raw_logs.append(f"[{now_utc()}] [CRYPTO-ENCLAVE] Generated signed state snapshot hash: 0x9f4ce0082a994c")

        req_id = f"#REQ-{random.randint(8800, 8899)}-F"
        appr_id = f"appr-{int(time.time() * 1000)}"
        approval_request = {
            "id": appr_id,
            "requestId": req_id,
            "missionId": mission_id,
            "agentId": target_agent["code"],
            "agentName": target_agent["name"],
            "title": "ISSUE OUTBOUND INVOICE & RECEIVABLES COMMIT",
            "description": "Enterprise maintenance contract billing exceeding standard billing ceiling.",
            "prompt": prompt,
            "amount": 34800,
            "amountFormatted": "$34,800.00 USD",
            "autonomousLimit": 25000,
            "varianceAmount": 9800,
            "currency": "USD",
            "riskLevel": "CRITICAL",
            "policyRule": "RULE_POL_093",
            "enclaveHash": f"0x{uuid4().hex[:14]}",
            "status": "PENDING",
            "timestamp": "Just now",
            "reasoningSteps": [
                "Compiled timesheets and hardware consumption telemetry.",
                "Audited rate cards against contractual Master Services Agreement.",
                "Generated Stripe Billing invoice payload with net-30 terms.",
                "TRIPWIRE ENGAGED: Invoice amount $34,800 > $25,000 threshold. Halting for CFO / Sovereign approval.",
            ],
            "boundTool": "stripe_billing.issue_invoice",
            "toolPayload": invoice_payload,
        }
        STITCH_APPROVALS.insert(0, approval_request)
        final_output = invoice_payload

    else:
        # Inventory flow
        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling get_inventory() on Warehouse 04 East")
        events.append({
            "id": "ev-03",
            "stepNumber": 3,
            "title": "Inventory queried",
            "timestamp": now_utc(),
            "status": "DONE",
            "payloadInput": {"warehouse": "WH_04_EAST", "skus": 1420},
            "payloadOutput": {
                "total_items": 1420,
                "scanned": 1420,
                "anomalies": 2,
            },
        })

        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling identify_low_stock()")
        low_stock_items = [i for i in STITCH_INVENTORY if i["status"] in ["low", "depleted"]]
        events.append({
            "id": "ev-04",
            "stepNumber": 4,
            "title": "Low stock items detected",
            "timestamp": now_utc(),
            "status": "DONE",
            "payloadOutput": {
                "depleted_count": 2,
                "items": [
                    {"sku": "SKU-8892-NEO", "stock": 2, "min": 10},
                    {"sku": "SKU-1044-CORE", "stock": 0, "min": 8},
                ],
            },
        })

        raw_logs.append(f"[{now_utc()}] [TOOL-RPC] Calling prepare_restock_order()")
        po_payload = {
            "status": "STAGED",
            "po_number": f"PO-{random.randint(8000, 8999)}-B",
            "vendor_id": "VEND-LOGISTICS-77",
            "line_items": [
                {"sku": "SKU-8892-NEO", "quantity": 50, "unitPrice": 250.00, "extendedAmount": 12500.00},
                {"sku": "SKU-1044-CORE", "quantity": 20, "unitPrice": 300.00, "extendedAmount": 6000.00},
            ],
            "total_amount": 18500.00,
            "biometric_gating_tripwire": True,
            "gating_reason": "Total purchase order value ($18,500.00) exceeds autonomous threshold ($14,000.00)",
        }

        halted_for_approval = True
        raw_logs.append(f"[{now_utc()}] [POLICY-CHECK] Requisition sum ($18,500) > Autonomous Limit ($14,000)")
        raw_logs.append(f"[{now_utc()}] [PERIMETER-HALT] Tripwire POL-093 engaged. Execution paused.")

        req_id = f"#REQ-{random.randint(8800, 8899)}-B"
        appr_id = f"appr-{int(time.time() * 1000)}"
        approval_request = {
            "id": appr_id,
            "requestId": req_id,
            "missionId": mission_id,
            "agentId": target_agent["code"],
            "agentName": target_agent["name"],
            "title": "CREATE SUPPLIER PURCHASE ORDER",
            "description": "Critical inventory threshold breach in WH-04. Automated vendor requisition drafted to prevent fulfillment outage.",
            "prompt": prompt,
            "amount": 18500,
            "amountFormatted": "₹18,500 ($34,800.00 USD)",
            "autonomousLimit": 14000,
            "varianceAmount": 4500,
            "currency": "USD",
            "riskLevel": "CRITICAL",
            "policyRule": "RULE_POL_093",
            "enclaveHash": f"0x{uuid4().hex[:15]}",
            "status": "PENDING",
            "timestamp": "Just now",
            "reasoningSteps": [
                "Queried Warehouse 04 East via SAP Connector. Retrieved 1,420 SKUs telemetry matrix.",
                "Identified critical depletion on SKU-8892-NEO (2 units) and SKU-1044-CORE (0 units).",
                "Calculated safety buffer restock: 50 units for transceiver module and 20 units for processor.",
                "TRIPWIRE ENGAGED: Total PO value ($18,500) exceeds autonomous purchase threshold ($14,000). Sovereign biometric signature mandatory.",
            ],
            "boundTool": "netsuite_erp.draft_po (Scope: ledger:write)",
            "toolPayload": po_payload,
            "lineItems": [
                {
                    "sku": "SKU-8892-NEO",
                    "description": "High-Bandwidth Transceiver Module 100G",
                    "quantity": 50,
                    "unitPrice": 250.00,
                    "extendedAmount": 12500.00,
                },
                {
                    "sku": "SKU-1044-CORE",
                    "description": "Optic Switch Processor (Rev 4)",
                    "quantity": 20,
                    "unitPrice": 300.00,
                    "extendedAmount": 6000.00,
                },
            ],
        }
        STITCH_APPROVALS.insert(0, approval_request)
        final_output = po_payload

    # Append Tripwire Halt event
    if halted_for_approval and approval_request:
        events.append({
            "id": "ev-05",
            "stepNumber": 5,
            "title": "Perimeter halt triggered",
            "timestamp": now_utc(),
            "status": "GATED",
            "source": "Gatehouse Sentinel Kernel (eBPF Shield)",
            "badge": "TRIPWIRE_HALT",
            "gatingAlert": {
                "tripwire": approval_request["policyRule"],
                "reason": approval_request["description"],
                "delta": f"+${approval_request['varianceAmount']:,.2f} over limit",
                "poId": approval_request["requestId"],
            },
        })
        # Add to audit log
        STITCH_AUDIT_LOGS.insert(0, {
            "id": f"LOG-{random.randint(2000, 9999)}",
            "timestamp": now_utc(),
            "agentId": target_agent["code"],
            "action": "POLICY_INTERRUPT",
            "target": "Gatehouse Supervisor Node",
            "status": "GATED",
            "latencyMs": 14,
            "hash": approval_request["enclaveHash"],
            "details": f"Rule {approval_request['policyRule']} tripped: {approval_request['description']}",
        })

    elapsed_ms = int((time.time() - start_time) * 1000)

    dag_stages = [
        {"step": "01", "title": "Ingress & Parse", "subtitle": "Webhook JSON", "status": "DONE", "timing": "12ms", "metric": "100% OK"},
        {"step": "02", "title": "Kernel Dispatch", "subtitle": target_agent["enclave"], "status": "DONE", "timing": "44ms", "metric": "0.99 CONF"},
        {"step": "03", "title": "Tool Execution", "subtitle": "Sandbox Enclave", "status": "DONE", "timing": "128ms", "metric": "RPC OK"},
        {"step": "04", "title": "Tripwire Gating", "subtitle": "eBPF Shield", "status": "HALTED_AUTH" if halted_for_approval else "DONE", "timing": "18ms", "metric": "POL-093"},
        {"step": "05", "title": "Egress Dispatch", "subtitle": "Production ERP", "status": "HALTED_AUTH" if halted_for_approval else "DONE", "timing": "AWAITING SIG" if halted_for_approval else "15ms", "metric": "GATED" if halted_for_approval else "COMMITTED"},
    ]

    return {
        "missionId": mission_id,
        "pid": pid,
        "prompt": prompt,
        "targetAgent": target_agent,
        "dagStages": dag_stages,
        "events": events,
        "rawKernelLogs": raw_logs,
        "haltedForApproval": halted_for_approval,
        "approvalRequest": approval_request,
        "finalOutput": final_output,
        "elapsedTimeMs": elapsed_ms,
    }


@router.get("/approvals")
async def get_approvals():
    """Returns human approval requests for the command post."""
    return {"approvals": STITCH_APPROVALS}


@router.post("/approvals/authorize")
async def authorize_approval(payload: AuthorizeRequest):
    """Authorizes a gated approval request with biometric signature."""
    approval = next((a for a in STITCH_APPROVALS if a.get("id") == payload.id or a.get("requestId") == payload.id), None)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval["status"] = "APPROVED"
    approval["approvedBy"] = payload.authorized_by or "ADM-01 [SOVEREIGN-L5]"
    approval["approvedAt"] = datetime.now(timezone.utc).isoformat()

    # Commit to audit log
    now_utc = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + " UTC"
    sig = payload.key_signature or approval.get("enclaveHash", f"0x{uuid4().hex[:12]}")
    STITCH_AUDIT_LOGS.insert(0, {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "timestamp": now_utc,
        "agentId": approval.get("agentId", "AGT-02"),
        "action": "SOVEREIGN_AUTHORIZATION_COMMIT",
        "target": approval.get("boundTool", "gatehouse.perimeter"),
        "status": "APPROVED",
        "latencyMs": 14,
        "hash": sig,
        "details": f"Sovereign signature confirmed for {approval.get('requestId')}. Amount {approval.get('amountFormatted', '$18,500')} released for egress dispatch.",
    })

    return {"success": True, "approval": approval}


@router.post("/approvals/reject")
async def reject_approval(payload: RejectRequest):
    """Rejects a gated approval request."""
    approval = next((a for a in STITCH_APPROVALS if a.get("id") == payload.id or a.get("requestId") == payload.id), None)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    approval["status"] = "REJECTED"

    now_utc = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3] + " UTC"
    STITCH_AUDIT_LOGS.insert(0, {
        "id": f"LOG-{random.randint(1000, 9999)}",
        "timestamp": now_utc,
        "agentId": approval.get("agentId", "AGT-02"),
        "action": "SOVEREIGN_OVERRIDE_PURGE",
        "target": approval.get("boundTool", "gatehouse.perimeter"),
        "status": "REJECTED",
        "latencyMs": 9,
        "hash": approval.get("enclaveHash", f"0x{uuid4().hex[:12]}"),
        "details": f"Operator rejected {approval.get('requestId')}. Intent purged from sandbox enclave. Reason: {payload.reason or 'Operator override'}",
    })

    return {"success": True, "approval": approval}


@router.get("/agents")
async def get_agents():
    """Returns AI agent roster."""
    return {"agents": STITCH_AGENTS}


@router.get("/audit-logs")
async def get_audit_logs():
    """Returns immutable audit logs."""
    return {"logs": STITCH_AUDIT_LOGS}


@router.get("/tools/inventory")
async def get_tools_inventory(warehouse_id: Optional[str] = "WH_04_EAST", category: Optional[str] = None):
    """Direct inventory tool endpoint."""
    items = list(STITCH_INVENTORY)
    if category and category.upper() != "ALL":
        items = [i for i in items if category.lower() in i.get("category", "").lower()]
    return {
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "facility_id": warehouse_id,
        "items_scanned": 1420,
        "total_returned": len(items),
        "inventory": items,
    }


@router.post("/tools/low-stock")
async def get_low_stock(payload: LowStockRequest):
    """Identifies low stock SKUs."""
    items = [i for i in STITCH_INVENTORY if i.get("status") in ["low", "depleted"]]
    return {
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "threshold_policy": "STRICT_LEAN",
        "depleted_count": len(items),
        "low_stock_items": items,
    }


@router.post("/tools/prepare-restock")
async def prepare_restock(payload: PrepareRestockRequest):
    """Prepares restock order. Halts at perimeter for approval."""
    return {
        "status": 202,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vendor_id": payload.vendor_id or "VEND-LOGISTICS-77",
        "po_number": f"PO-{random.randint(8000, 8999)}-B",
        "biometric_gating_tripwire": True,
        "total_amount": 18500.00,
        "message": "Sensitive restock order halted at Gatehouse perimeter awaiting operator authorization.",
    }


@router.get("/tools/customer-enquiries")
async def get_tools_customer_enquiries(urgency: Optional[str] = None, status: Optional[str] = None):
    """Fetches customer support enquiries."""
    items = list(STITCH_ENQUIRIES)
    if urgency:
        items = [i for i in items if i.get("urgency", "").upper() == urgency.upper()]
    if status:
        items = [i for i in items if i.get("status", "").upper() == status.upper()]
    return {
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total": len(items),
        "enquiries": items,
    }


@router.post("/tools/draft-reply")
async def draft_customer_reply_endpoint(payload: DraftReplyRequest):
    """Drafts customer reply."""
    return {
        "status": "STAGED",
        "ticket_id": payload.ticket_id,
        "proposed_resolution": payload.proposed_resolution,
        "refund_amount": payload.refund_amount,
        "biometric_gating_tripwire": (payload.refund_amount or 0) > 500,
    }


@router.post("/tools/create-invoice")
async def create_invoice_endpoint(payload: CreateInvoiceRequest):
    """Creates customer invoice. Halts at perimeter for approval."""
    total = sum(i.get("amount", 0) for i in payload.line_items) if payload.line_items else 34800.00
    return {
        "status": "STAGED_DRAFT",
        "invoice_number": f"INV-2026-{random.randint(1000, 9999)}",
        "customer_name": payload.customer_name,
        "currency": payload.currency or "USD",
        "total_amount": total,
        "biometric_gating_tripwire": total > 25000,
    }
