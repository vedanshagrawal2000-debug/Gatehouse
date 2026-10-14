from config import settings
from models.contracts import ServiceHealth, HealthStatus
from database.supabase_client import is_database_configured, db_ping


def check_database_health() -> ServiceHealth:
    """
    Checks the genuine health and configuration of Supabase PostgreSQL.
    Never silently reports healthy if credentials are unset or the connection fails.
    """
    if not is_database_configured():
        return ServiceHealth(
            status=HealthStatus.DEGRADED,
            configured=False,
            message="Supabase credentials not configured. Configure SUPABASE_URL and keys in .env",
            provider="Supabase PostgreSQL",
            latency_ms=None,
        )

    ping_result = db_ping()
    if not ping_result["connected"]:
        return ServiceHealth(
            status=HealthStatus.DEGRADED,
            configured=True,
            message=f"Supabase configured but connection ping failed: {ping_result.get('error')}",
            provider="Supabase PostgreSQL",
            latency_ms=ping_result.get("latency_ms"),
        )

    return ServiceHealth(
        status=HealthStatus.HEALTHY,
        configured=True,
        message="Supabase PostgreSQL endpoint connected and operational",
        provider="Supabase PostgreSQL",
        latency_ms=ping_result.get("latency_ms"),
    )
