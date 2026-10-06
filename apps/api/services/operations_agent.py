"""
GATEHOUSE Operations Agent
Powered by Google Gemini API with Function/Tool Calling.
Backend owns all tool execution; the LLM does not directly access the database.
Sensitive operations halt at perimeter and generate an approval request.
"""
import json
import logging
import time
from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from google import genai
from google.genai import types

from config import settings
from database import (
    db_get_inventory,
    db_get_customer_enquiries,
    db_get_approval_requests,
    db_get_audit_logs,
    DEMO_APPROVAL_REQUESTS,
    DEMO_AUDIT_LOGS,
    DEMO_MISSIONS,
    DEMO_INVENTORY,
)

logger = logging.getLogger("gatehouse.agent.operations")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class OperationsAgent:
    """
    Tactical Operations Agent for GATEHOUSE.
    Executes autonomous workflows with strict human-in-the-loop perimeter gating.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in environment.")
        self.client = genai.Client(api_key=self.api_key)
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"

    def execute_mission(self, mission_text: str, mission_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Orchestrates an end-to-end business mission using Gemini Function Calling.
        """
        mission_id = str(uuid4())
        code = mission_code or f"MSN-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}"

        logger.info("=" * 70)
        logger.info(f"[MISSION RECEIVED] Code: {code} | ID: {mission_id}")
        logger.info(f"[MISSION PROMPT] \"{mission_text}\"")
        logger.info("=" * 70)

        # Track execution history for logging and API response
        execution_trace = {
            "mission_id": mission_id,
            "mission_code": code,
            "mission": mission_text,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "tools_selected": [],
            "approval_requests_created": [],
            "logs": [],
        }

        def record_log(step_type: str, message: str, payload: Optional[Any] = None):
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "step": step_type,
                "message": message,
                "payload": payload,
            }
            execution_trace["logs"].append(entry)

        record_log("MISSION_START", f"Starting mission {code}", {"prompt": mission_text})

        # ======================================================================
        # 1. Tool Implementations (Owned & Executed Strictly by the Backend)
        # ======================================================================

        def get_inventory(category: Optional[str] = None, facility_id: Optional[str] = None) -> List[Dict[str, Any]]:
            """Get current inventory items from the warehouse facility.

            Args:
                category: Optional filter by item category (e.g. telemetry, cryptography, surveillance, power, hardware, security).
                facility_id: Optional facility identifier filter (e.g. WH-04).
            """
            logger.info(f"[SELECTED TOOL] get_inventory")
            logger.info(f"[TOOL ARGUMENTS] {json.dumps({'category': category, 'facility_id': facility_id})}")
            record_log("TOOL_SELECTED", "Selected tool get_inventory", {"category": category, "facility_id": facility_id})

            items = db_get_inventory()
            if category:
                items = [i for i in items if i.get("category", "").lower() == category.lower()]
            if facility_id:
                items = [i for i in items if i.get("facility_id", "").lower() == facility_id.lower()]

            # Return essential fields to the LLM
            sanitized = [
                {
                    "sku": i["sku"],
                    "name": i["name"],
                    "category": i["category"],
                    "quantity": i["quantity"],
                    "reorder_threshold": i["reorder_threshold"],
                    "unit_cost_usd": float(i["unit_cost_usd"]),
                    "status": i["status"],
                    "facility_id": i["facility_id"],
                }
                for i in items
            ]
            logger.info(f"[TOOL RESULT] Found {len(sanitized)} inventory items")
            record_log("TOOL_RESULT", f"Found {len(sanitized)} inventory items", sanitized)
            execution_trace["tools_selected"].append({
                "tool": "get_inventory",
                "arguments": {"category": category, "facility_id": facility_id},
                "result_count": len(sanitized),
                "is_sensitive": False,
            })
            return sanitized

        def identify_low_stock(threshold: Optional[int] = None) -> List[Dict[str, Any]]:
            """Identify all inventory items that are running low and need replenishing.

            Args:
                threshold: Optional custom quantity threshold. If not specified, uses the item's configured reorder threshold.
            """
            logger.info(f"[SELECTED TOOL] identify_low_stock")
            logger.info(f"[TOOL ARGUMENTS] {json.dumps({'threshold': threshold})}")
            record_log("TOOL_SELECTED", "Selected tool identify_low_stock", {"threshold": threshold})

            items = db_get_inventory()
            low_stock = []
            for item in items:
                limit = threshold if threshold is not None else item.get("reorder_threshold", 10)
                if item.get("quantity", 0) <= limit:
                    low_stock.append({
                        "sku": item["sku"],
                        "name": item["name"],
                        "category": item["category"],
                        "current_quantity": item["quantity"],
                        "reorder_threshold": item["reorder_threshold"],
                        "deficit": max(0, item["reorder_threshold"] - item["quantity"] + 10),
                        "unit_cost_usd": float(item["unit_cost_usd"]),
                        "status": item["status"],
                    })

            logger.info(f"[TOOL RESULT] Identified {len(low_stock)} low-stock items requiring attention")
            record_log("TOOL_RESULT", f"Identified {len(low_stock)} low-stock items", low_stock)
            execution_trace["tools_selected"].append({
                "tool": "identify_low_stock",
                "arguments": {"threshold": threshold},
                "low_stock_items": low_stock,
                "is_sensitive": False,
            })
            return low_stock

        def prepare_restock_order(
            sku: str,
            quantity: int,
            vendor_id: Optional[str] = None,
            estimated_cost_usd: Optional[float] = None,
            justification: str = "Automated predictive depletion restock",
        ) -> Dict[str, Any]:
            """Prepare a supply chain restock purchase order. SENSITIVE: Halts at Gatehouse perimeter and creates an approval request.

            Args:
                sku: The SKU code of the product to reorder (e.g. TAC-RELAY-01, THM-CAM-X4).
                quantity: Units to order.
                vendor_id: Optional vendor identifier.
                estimated_cost_usd: Optional estimated order cost in USD.
                justification: Operational reasoning for the purchase order.
            """
            logger.info(f"[SELECTED TOOL] prepare_restock_order (SENSITIVE OPERATION)")
            args = {
                "sku": sku,
                "quantity": quantity,
                "vendor_id": vendor_id,
                "estimated_cost_usd": estimated_cost_usd,
                "justification": justification,
            }
            logger.info(f"[TOOL ARGUMENTS] {json.dumps(args)}")
            record_log("TOOL_SELECTED", "Selected tool prepare_restock_order (SENSITIVE)", args)

            # Compute cost if missing
            inventory_items = db_get_inventory()
            item = next((i for i in inventory_items if i.get("sku") == sku), None)
            unit_cost = float(item["unit_cost_usd"]) if item else 100.0
            total_cost = estimated_cost_usd if estimated_cost_usd is not None else round(quantity * unit_cost, 2)
            assigned_vendor = vendor_id or (item.get("vendor_id") if item else "VND-PRIMARY-LOGISTICS")

            # Create Approval Request (Backend owns execution gating!)
            approval_id = f"gate_req_{uuid4().hex[:8]}"
            idempotency_key = f"idemp_restock_{sku}_{uuid4().hex[:8]}"
            validated_args = {
                "sku": sku,
                "item_name": item["name"] if item else "Tactical Hardware Item",
                "quantity": quantity,
                "vendor_id": assigned_vendor,
                "unit_cost_usd": unit_cost,
                "total_cost_usd": total_cost,
                "justification": justification,
                "facility_id": "WH-04",
            }

            approval_record = {
                "id": approval_id,
                "mission_id": mission_id,
                "tool_execution_id": f"tool_exec_{uuid4().hex[:8]}",
                "action_type": "PREPARE_RESTOCK_ORDER",
                "action_name": f"Restock Order: {quantity}x {sku} (${total_cost:,.2f})",
                "arguments": validated_args,
                "amount_usd": total_cost,
                "risk_factor": "elevated",
                "status": "pending",
                "idempotency_key": idempotency_key,
                "execution_count": 0,
                "requested_at": datetime.now(timezone.utc).isoformat(),
            }

            # Record in database store
            DEMO_APPROVAL_REQUESTS.append(approval_record)
            execution_trace["approval_requests_created"].append(approval_record)

            # Append to immutable audit log
            audit_entry = {
                "id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "APPROVAL_GATE_HALTED",
                "actor_type": "agent",
                "actor_id": "operations_agent_kernel",
                "mission_id": mission_id,
                "action": f"RESTOCK_ORDER_GATED:{sku}",
                "payload": validated_args,
                "payload_hash": f"hash_{uuid4().hex}",
                "status": "gated",
            }
            DEMO_AUDIT_LOGS.insert(0, audit_entry)

            logger.info("=" * 60)
            logger.info(f"[APPROVAL REQUEST CREATED] ID: {approval_id}")
            logger.info(f"  Action: {approval_record['action_name']}")
            logger.info(f"  Risk Factor: {approval_record['risk_factor'].upper()}")
            logger.info(f"  Idempotency Key: {idempotency_key}")
            logger.info(f"  Status: GATED - Halted at Gatehouse Perimeter Shield")
            logger.info("=" * 60)

            record_log("APPROVAL_REQUEST", f"Created approval request {approval_id}", approval_record)

            result = {
                "status": "APPROVAL_REQUIRED",
                "approval_request_id": approval_id,
                "action": "prepare_restock_order",
                "item_sku": sku,
                "units_requested": quantity,
                "total_estimated_cost_usd": total_cost,
                "vendor_id": assigned_vendor,
                "message": (
                    f"Sensitive operation halted at perimeter. Created approval request '{approval_id}' "
                    f"for {quantity}x {sku} (${total_cost:,.2f}). Requires human operator authorization."
                ),
            }
            logger.info(f"[TOOL RESULT] {json.dumps(result)}")
            record_log("TOOL_RESULT", "Tool halted for approval", result)
            execution_trace["tools_selected"].append({
                "tool": "prepare_restock_order",
                "arguments": args,
                "is_sensitive": True,
                "approval_id": approval_id,
                "result": result,
            })
            return result

        def get_customer_enquiries(
            priority: Optional[str] = None,
            status: Optional[str] = None,
        ) -> List[Dict[str, Any]]:
            """Fetch customer support enquiries and high-stakes dispute tickets.

            Args:
                priority: Optional priority filter ('low', 'medium', 'high', 'critical').
                status: Optional status filter ('open', 'triaged', 'investigating', 'escalated', 'resolved', 'closed').
            """
            logger.info(f"[SELECTED TOOL] get_customer_enquiries")
            logger.info(f"[TOOL ARGUMENTS] {json.dumps({'priority': priority, 'status': status})}")
            record_log("TOOL_SELECTED", "Selected tool get_customer_enquiries", {"priority": priority, "status": status})

            enquiries = db_get_customer_enquiries()
            if priority:
                enquiries = [e for e in enquiries if e.get("priority", "").lower() == priority.lower()]
            if status:
                enquiries = [e for e in enquiries if e.get("status", "").lower() == status.lower()]

            sanitized = [
                {
                    "ticket_number": e["ticket_number"],
                    "customer_name": e["customer_name"],
                    "customer_tier": e["customer_tier"],
                    "subject": e["subject"],
                    "description": e["description"],
                    "priority": e["priority"],
                    "status": e["status"],
                }
                for e in enquiries
            ]
            logger.info(f"[TOOL RESULT] Found {len(sanitized)} customer enquiries")
            record_log("TOOL_RESULT", f"Found {len(sanitized)} enquiries", sanitized)
            execution_trace["tools_selected"].append({
                "tool": "get_customer_enquiries",
                "arguments": {"priority": priority, "status": status},
                "result_count": len(sanitized),
                "is_sensitive": False,
            })
            return sanitized

        def draft_customer_reply(
            ticket_number: str,
            reply_text: str,
            suggested_resolution: str,
        ) -> Dict[str, Any]:
            """Draft an official response to a client dispute or high-priority ticket.

            Args:
                ticket_number: Unique ticket code (e.g. TCK-2026-0891, TCK-2026-0892).
                reply_text: The drafted tactical response to the client.
                suggested_resolution: Operational resolution code or summary.
            """
            logger.info(f"[SELECTED TOOL] draft_customer_reply")
            args = {"ticket_number": ticket_number, "reply_text": reply_text, "suggested_resolution": suggested_resolution}
            logger.info(f"[TOOL ARGUMENTS] {json.dumps(args)}")
            record_log("TOOL_SELECTED", "Selected tool draft_customer_reply", args)

            enquiries = db_get_customer_enquiries()
            enquiry = next((e for e in enquiries if e.get("ticket_number") == ticket_number), None)
            customer_name = enquiry.get("customer_name") if enquiry else "Client"

            draft = {
                "ticket_number": ticket_number,
                "recipient": customer_name,
                "draft_id": f"drf_{uuid4().hex[:6]}",
                "status": "draft_staged",
                "reply_text": reply_text,
                "suggested_resolution": suggested_resolution,
                "staged_at": datetime.now(timezone.utc).isoformat(),
            }
            logger.info(f"[TOOL RESULT] Draft staged for ticket {ticket_number}")
            record_log("TOOL_RESULT", f"Draft staged for ticket {ticket_number}", draft)
            execution_trace["tools_selected"].append({
                "tool": "draft_customer_reply",
                "arguments": args,
                "is_sensitive": False,
                "draft": draft,
            })
            return draft

        def create_invoice(
            customer_name: str,
            amount_usd: float,
            line_items: List[str],
            due_date: Optional[str] = None,
            notes: Optional[str] = "Standard Net-30 Sovereign settlement terms.",
        ) -> Dict[str, Any]:
            """Create an invoice or billing document for a client. SENSITIVE: Halts at Gatehouse perimeter and creates an approval request.

            Args:
                customer_name: Name of recipient enterprise or government account.
                amount_usd: Total billable amount in USD.
                line_items: List of billing line item descriptions.
                due_date: Payment due date string (e.g. '2026-11-04').
                notes: Tactical terms or billing justification.
            """
            logger.info(f"[SELECTED TOOL] create_invoice (SENSITIVE OPERATION)")
            args = {
                "customer_name": customer_name,
                "amount_usd": amount_usd,
                "line_items": line_items,
                "due_date": due_date,
                "notes": notes,
            }
            logger.info(f"[TOOL ARGUMENTS] {json.dumps(args)}")
            record_log("TOOL_SELECTED", "Selected tool create_invoice (SENSITIVE)", args)

            approval_id = f"gate_req_{uuid4().hex[:8]}"
            idempotency_key = f"idemp_inv_{uuid4().hex[:8]}"

            validated_args = {
                "customer_name": customer_name,
                "amount_usd": float(amount_usd),
                "line_items": line_items,
                "due_date": due_date or "2026-11-04",
                "notes": notes,
            }

            approval_record = {
                "id": approval_id,
                "mission_id": mission_id,
                "tool_execution_id": f"tool_exec_{uuid4().hex[:8]}",
                "action_type": "CREATE_INVOICE",
                "action_name": f"Issue Invoice: {customer_name} (${amount_usd:,.2f})",
                "arguments": validated_args,
                "amount_usd": float(amount_usd),
                "risk_factor": "critical" if amount_usd > 10000 else "elevated",
                "status": "pending",
                "idempotency_key": idempotency_key,
                "execution_count": 0,
                "requested_at": datetime.now(timezone.utc).isoformat(),
            }

            DEMO_APPROVAL_REQUESTS.append(approval_record)
            execution_trace["approval_requests_created"].append(approval_record)

            audit_entry = {
                "id": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "APPROVAL_GATE_HALTED",
                "actor_type": "agent",
                "actor_id": "operations_agent_kernel",
                "mission_id": mission_id,
                "action": f"INVOICE_GENERATION_GATED:{customer_name}",
                "payload": validated_args,
                "payload_hash": f"hash_{uuid4().hex}",
                "status": "gated",
            }
            DEMO_AUDIT_LOGS.insert(0, audit_entry)

            logger.info("=" * 60)
            logger.info(f"[APPROVAL REQUEST CREATED] ID: {approval_id}")
            logger.info(f"  Action: {approval_record['action_name']}")
            logger.info(f"  Amount: ${amount_usd:,.2f}")
            logger.info(f"  Risk Factor: {approval_record['risk_factor'].upper()}")
            logger.info(f"  Status: GATED - Financial dispatch halted for operator sign-off")
            logger.info("=" * 60)

            record_log("APPROVAL_REQUEST", f"Created invoice approval request {approval_id}", approval_record)

            result = {
                "status": "APPROVAL_REQUIRED",
                "approval_request_id": approval_id,
                "action": "create_invoice",
                "customer": customer_name,
                "amount_usd": float(amount_usd),
                "message": (
                    f"Sensitive financial operation halted at perimeter. Created approval request '{approval_id}' "
                    f"for ${amount_usd:,.2f} billed to {customer_name}. Awaiting operator authorization."
                ),
            }
            logger.info(f"[TOOL RESULT] {json.dumps(result)}")
            record_log("TOOL_RESULT", "Invoice tool halted for approval", result)
            execution_trace["tools_selected"].append({
                "tool": "create_invoice",
                "arguments": args,
                "is_sensitive": True,
                "approval_id": approval_id,
                "result": result,
            })
            return result

        # Register tools with Gemini
        tools = [
            get_inventory,
            identify_low_stock,
            prepare_restock_order,
            get_customer_enquiries,
            draft_customer_reply,
            create_invoice,
        ]

        system_instruction = (
            "You are GATEHOUSE Tactical Operations Command Agent. "
            "You are given high-level business missions. You have access to backend operational tools. "
            "Use tools as needed to gather information and stage actions. "
            "Note: The backend owns all tool execution. Certain sensitive operations (e.g. preparing restock orders or "
            "generating invoices) will be halted at the security perimeter and return an APPROVAL_REQUIRED status. "
            "When tools return APPROVAL_REQUIRED, explain the proposed action, specify the approval request ID, "
            "and confirm that the action is safely held at the perimeter awaiting operator biometric authorization. "
            "Respond concisely with tactical military precision in high-stakes operational tone."
        )

        # ======================================================================
        # 2. Invoke Gemini Multi-Turn Chat with Automatic Function Calling
        # ======================================================================
        try:
            chat = self.client.chats.create(
                model=self.model,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=tools,
                    temperature=0.2,
                ),
            )

            response = chat.send_message(mission_text)
            final_decision_text = response.text or "Mission executed. Review telemetry logs."

            logger.info("=" * 70)
            logger.info(f"[FINAL DECISION / REPORT]")
            logger.info(final_decision_text)
            logger.info("=" * 70)

            record_log("FINAL_DECISION", "Mission completed", {"response": final_decision_text})

            # Record completed mission in repository
            mission_record = {
                "id": mission_id,
                "mission_code": code,
                "title": mission_text[:80] + ("..." if len(mission_text) > 80 else ""),
                "objective": mission_text,
                "agent_id": "operations_agent_kernel",
                "status": "gated" if len(execution_trace["approval_requests_created"]) > 0 else "completed",
                "priority": "high_stakes" if len(execution_trace["approval_requests_created"]) > 0 else "standard",
                "current_step": 4 if len(execution_trace["approval_requests_created"]) > 0 else 5,
                "total_steps": 5,
                "initiated_by": "operations_operator",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            DEMO_MISSIONS.insert(0, mission_record)

            execution_trace["status"] = mission_record["status"]
            execution_trace["final_response"] = final_decision_text
            execution_trace["completed_at"] = datetime.now(timezone.utc).isoformat()
            return execution_trace

        except Exception as e:
            error_msg = f"Gemini Operations Agent execution failed: {str(e)}"
            logger.error(error_msg)
            record_log("MISSION_ERROR", error_msg, {"error": str(e)})
            execution_trace["status"] = "failed"
            execution_trace["error"] = error_msg
            return execution_trace
