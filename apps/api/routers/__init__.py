from .health import router as health_router
from .telemetry import router as telemetry_router
from .agents import router as agents_router
from .approvals import router as approvals_router
from .inventory import router as inventory_router
from .enquiries import router as enquiries_router
from .missions import router as missions_router
from .audit import router as audit_router
from .agent_router import router as agent_router
from .stitch_api import router as stitch_router

__all__ = [
    "health_router",
    "telemetry_router",
    "agents_router",
    "approvals_router",
    "inventory_router",
    "enquiries_router",
    "missions_router",
    "audit_router",
    "agent_router",
    "stitch_router",
]
