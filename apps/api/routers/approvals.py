from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from database import (
    db_get_approval_requests,
    db_authorize_approval,
    db_reject_approval,
    DatabaseDegradedError,
    DuplicateExecutionError,
    ApprovalNotFoundError,
    InvalidApprovalStateError,
)
from models.contracts import ApprovalDecisionPayload, ApprovalStatus

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
    try:
        if payload.decision == "approve":
            return db_authorize_approval(
                approval_id=approval_id,
                operator_id=payload.operator_id or "SOVEREIGN_OPERATOR",
                key_signature=None,
            )
        else:
            return db_reject_approval(
                approval_id=approval_id,
                reason=payload.notes or "Rejected via /api/v1/approvals",
                operator_id=payload.operator_id or "SOVEREIGN_OPERATOR",
            )
    except DatabaseDegradedError as dbe:
        raise HTTPException(status_code=503, detail=str(dbe))
    except DuplicateExecutionError as dee:
        raise HTTPException(status_code=409, detail=str(dee))
    except InvalidApprovalStateError as iase:
        raise HTTPException(status_code=400, detail=str(iase))
    except ApprovalNotFoundError as anfe:
        raise HTTPException(status_code=404, detail=str(anfe))


@router.post("/{approval_id}/execute", response_model=Dict[str, Any])
async def execute_approved_action(approval_id: str) -> Dict[str, Any]:
    """
    Executes an approved action.
    Enforces the invariant: Approved actions cannot execute twice.
    """
    try:
        result = db_authorize_approval(
            approval_id=approval_id,
            operator_id="SOVEREIGN_OPERATOR_EXEC",
        )
        return {
            "success": True,
            "message": f"Action '{result.get('action_type') or result.get('title')}' successfully executed.",
            "idempotency_key": result.get("transactionId") or approval_id,
            "approval_request": result,
        }
    except DatabaseDegradedError as dbe:
        raise HTTPException(status_code=503, detail=str(dbe))
    except DuplicateExecutionError as dee:
        raise HTTPException(status_code=409, detail=str(dee))
    except InvalidApprovalStateError as iase:
        raise HTTPException(status_code=400, detail=str(iase))
    except ApprovalNotFoundError as anfe:
        raise HTTPException(status_code=404, detail=str(anfe))
