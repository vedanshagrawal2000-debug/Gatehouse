import time
from datetime import datetime, timezone
from fastapi import APIRouter
from config import settings
from models.contracts import HealthCheckResponse, ServiceHealth, HealthStatus
from services.gemini import check_gemini_health
from services.supabase import check_database_health

router = APIRouter(tags=["Health & Telemetry"])

START_TIME = time.time()


@router.get("/health", response_model=HealthCheckResponse)
@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def get_health_status() -> HealthCheckResponse:
    uptime = time.time() - START_TIME
    gemini_health = check_gemini_health()
    db_health = check_database_health()

    # Determine composite system status
    overall_status = HealthStatus.HEALTHY
    if gemini_health.status == HealthStatus.UNHEALTHY or db_health.status == HealthStatus.UNHEALTHY:
        overall_status = HealthStatus.UNHEALTHY
    elif gemini_health.status == HealthStatus.DEGRADED or db_health.status == HealthStatus.DEGRADED:
        overall_status = HealthStatus.DEGRADED

    return HealthCheckResponse(
        status=overall_status,
        service=settings.APP_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        uptime_seconds=round(uptime, 2),
        environment=settings.ENVIRONMENT,
        services={
            "api": ServiceHealth(
                status=HealthStatus.HEALTHY,
                configured=True,
                message="GATEHOUSE API core kernel online",
                latency_ms=0.5,
                provider="FastAPI Uvicorn",
            ),
            "gemini": gemini_health,
            "database": db_health,
        },
        metrics={
            "cluster_region": settings.CLUSTER_REGION,
            "air_gapped": settings.AIR_GAPPED,
            "clearance": settings.CLEARANCE_LEVEL,
        },
    )
