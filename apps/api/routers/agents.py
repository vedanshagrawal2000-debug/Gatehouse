from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from database import db_get_agents

router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_agents() -> List[Dict[str, Any]]:
    """Returns all active autonomous agents from Supabase PostgreSQL."""
    return db_get_agents()


@router.get("/{agent_id}", response_model=Dict[str, Any])
async def get_agent(agent_id: str) -> Dict[str, Any]:
    agents = db_get_agents()
    for agent in agents:
        if agent.get("id") == agent_id or agent.get("slug") == agent_id:
            return agent
    raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
