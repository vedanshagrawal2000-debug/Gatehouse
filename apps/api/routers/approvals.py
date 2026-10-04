from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models.contracts import ApprovalDecisionPayload, ApprovalStatus
from database import db_get_approval_requests

router = APIRouter(prefix="/api/v1/approvals", tags=["Human Approvals"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_pending_approvals() -> List[Dict[str, Any]]:
    """Returns all pending and processed human approval requests."""
    return db_get_approval_requests()


@router.post("/{approval_id}/decision", response_model=Dict[str, Any])
async def submit_approval_decision(
    approval_id: str, payload: ApprovalDecisionPayload
) -> Dict[str, Any]:
    """Records human operator approval or rejection for gated high-risk actions."""
    approvals = db_get_approval_requests()
    for req in approvals:
        if req.get("id") == approval_id:
            if payload.decision == "approve":
                req["status"] = ApprovalStatus.APPROVED.value
                req["decision"] = "approved"
            else:
                req["status"] = ApprovalStatus.REJECTED.value
                req["decision"] = "rejected"
            req["operator_id"] = payload.operator_id
            req["operator_notes"] = payload.notes
            return req
    raise HTTPException(status_code=404, detail="Approval request not found")


@router.post("/{approval_id}/execute", response_model=Dict[str, Any])
async def execute_approved_action(approval_id: str) -> Dict[str, Any]:
    """
    Executes an approved action.
    Enforces the invariant: Approved actions cannot execute twice.
    """
    approvals = db_get_approval_requests()
    for req in approvals:
        if req.get("id") == approval_id:
            # Check 1: Must be approved
            if req.get("status") != ApprovalStatus.APPROVED.value and req.get("decision") != "approved":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot execute action: Request has not been approved by an operator.",
                )
            # Check 2: Cannot execute twice (Idempotency check)
            if req.get("execution_count", 0) >= 1:
                raise HTTPException(
                    status_code=409,
                    detail=f"Duplicate execution blocked: Action '{approval_id}' has already been executed.",
                )
            
            # Mark executed atomically
            req["execution_count"] = 1
            req["status"] = "executed"
            req["executed_at"] = "2026-10-04T12:00:00Z"
            return {
                "success": True,
                "message": f"Action '{req.get('action_type')}' successfully executed.",
                "idempotency_key": req.get("idempotency_key"),
                "approval_request": req,
            }
    raise HTTPException(status_code=404, detail="Approval request not found")
