import time
from fastapi import APIRouter
from models.contracts import HealthCheckResponse
from services.health import get_system_health

router = APIRouter(tags=["Health & Telemetry"])

START_TIME = time.time()


@router.get("/health", response_model=HealthCheckResponse)
@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def get_health_status() -> HealthCheckResponse:
    return get_system_health(START_TIME)

