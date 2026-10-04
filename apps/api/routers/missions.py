from fastapi import APIRouter
from typing import List, Dict, Any
from database import db_get_missions

router = APIRouter(prefix="/api/v1/missions", tags=["Missions"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_missions() -> List[Dict[str, Any]]:
    """Returns multi-agent missions with execution statuses from Supabase PostgreSQL."""
    return db_get_missions()
