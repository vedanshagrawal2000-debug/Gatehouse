from fastapi import APIRouter
from typing import List, Dict, Any
from database import db_get_inventory

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_inventory() -> List[Dict[str, Any]]:
    """Returns the tactical inventory items (10 products) from Supabase PostgreSQL."""
    return db_get_inventory()
