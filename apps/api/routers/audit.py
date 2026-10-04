from fastapi import APIRouter
from typing import List, Dict, Any
from database import db_get_audit_logs

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Ledger"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_audit_logs() -> List[Dict[str, Any]]:
    """Returns immutable cryptographic audit logs from Supabase PostgreSQL."""
    return db_get_audit_logs()
