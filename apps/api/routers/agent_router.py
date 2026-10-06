from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from services.operations_agent import OperationsAgent

router = APIRouter(prefix="/api/v1/agent", tags=["Operations Agent"])


class MissionRequest(BaseModel):
    mission: str = Field(..., description="Natural-language business mission for the Operations Agent.")
    mission_code: Optional[str] = Field(None, description="Optional custom mission code identifier.")


@router.post("/mission", response_model=Dict[str, Any])
async def execute_agent_mission(payload: MissionRequest) -> Dict[str, Any]:
    """
    Executes a natural-language business mission using the Gemini Operations Agent.
    
    Workflow:
      1. User mission received by FastAPI
      2. Dispatched to Gemini Operations Agent with function calling
      3. Agent selects tools
      4. Backend validates and executes tools (LLM does NOT access DB directly)
      5. Sensitive operations (restock orders, invoices) halt and create Approval Requests
      6. Results returned to Gemini
      7. Gemini synthesizes final tactical decision
      8. FastAPI returns structured result with full telemetry logging
    """
    if not payload.mission or not payload.mission.strip():
        raise HTTPException(status_code=400, detail="Mission prompt cannot be empty.")

    try:
        agent = OperationsAgent()
        result = agent.execute_mission(payload.mission.strip(), payload.mission_code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mission execution error: {str(e)}")


@router.get("/tools", response_model=List[Dict[str, Any]])
async def list_agent_tools() -> List[Dict[str, Any]]:
    """Lists the 6 backend-owned tools available to the Operations Agent."""
    return [
        {
            "name": "get_inventory",
            "description": "Get current inventory items from the warehouse facility.",
            "is_sensitive": False,
            "requires_approval": False,
            "parameters": ["category (optional)", "facility_id (optional)"],
        },
        {
            "name": "identify_low_stock",
            "description": "Identify all inventory items that are running low and need replenishing.",
            "is_sensitive": False,
            "requires_approval": False,
            "parameters": ["threshold (optional)"],
        },
        {
            "name": "prepare_restock_order",
            "description": "Prepare a supply chain restock purchase order. SENSITIVE: Halts at perimeter for approval.",
            "is_sensitive": True,
            "requires_approval": True,
            "parameters": ["sku (required)", "quantity (required)", "vendor_id (optional)", "estimated_cost_usd (optional)", "justification (optional)"],
        },
        {
            "name": "get_customer_enquiries",
            "description": "Fetch customer support enquiries and high-stakes dispute tickets.",
            "is_sensitive": False,
            "requires_approval": False,
            "parameters": ["priority (optional)", "status (optional)"],
        },
        {
            "name": "draft_customer_reply",
            "description": "Draft an official response to a client dispute or high-priority ticket.",
            "is_sensitive": False,
            "requires_approval": False,
            "parameters": ["ticket_number (required)", "reply_text (required)", "suggested_resolution (required)"],
        },
        {
            "name": "create_invoice",
            "description": "Create an invoice or billing document for a client. SENSITIVE: Halts at perimeter for approval.",
            "is_sensitive": True,
            "requires_approval": True,
            "parameters": ["customer_name (required)", "amount_usd (required)", "line_items (required)", "due_date (optional)", "notes (optional)"],
        },
    ]
