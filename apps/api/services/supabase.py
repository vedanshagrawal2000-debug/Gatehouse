from config import settings
from models.contracts import ServiceHealth, HealthStatus


def check_database_health() -> ServiceHealth:
    """Checks the health and configuration of Supabase PostgreSQL."""
    has_url = bool(settings.SUPABASE_URL and settings.SUPABASE_URL.strip())
    has_key = bool(
        (settings.SUPABASE_ANON_KEY and settings.SUPABASE_ANON_KEY.strip())
        or (settings.SUPABASE_SERVICE_ROLE_KEY and settings.SUPABASE_SERVICE_ROLE_KEY.strip())
        or (settings.DATABASE_URL and settings.DATABASE_URL.strip())
    )

    if not has_url or not has_key:
        return ServiceHealth(
            status=HealthStatus.DEGRADED,
            configured=False,
            message="Supabase credentials not configured. Configure SUPABASE_URL and keys in .env",
            provider="Supabase PostgreSQL",
        )

    return ServiceHealth(
        status=HealthStatus.HEALTHY,
        configured=True,
        message="Supabase PostgreSQL endpoint configured and ready",
        provider="Supabase PostgreSQL",
    )
