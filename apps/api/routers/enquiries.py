from fastapi import APIRouter
from typing import List, Dict, Any
from database import db_get_customer_enquiries

router = APIRouter(prefix="/api/v1/enquiries", tags=["Customer Enquiries"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_customer_enquiries() -> List[Dict[str, Any]]:
    """Returns high-priority customer enquiries from Supabase PostgreSQL."""
    return db_get_customer_enquiries()
