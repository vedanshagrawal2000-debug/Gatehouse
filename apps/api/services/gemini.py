import time
from typing import Optional
from config import settings
from models.contracts import ServiceHealth, HealthStatus


def check_gemini_health() -> ServiceHealth:
    """Checks the health and readiness of the Gemini API client."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return ServiceHealth(
            status=HealthStatus.DEGRADED,
            configured=False,
            message="GEMINI_API_KEY not configured. Set GEMINI_API_KEY in .env",
            provider="Google Gemini API",
            model=settings.GEMINI_MODEL,
        )

    try:
        from google import genai

        start = time.perf_counter()
        _client = genai.Client(api_key=api_key)
        latency_ms = (time.perf_counter() - start) * 1000

        return ServiceHealth(
            status=HealthStatus.HEALTHY,
            configured=True,
            message="Gemini API client initialized successfully",
            latency_ms=round(latency_ms, 2),
            provider="Google Gemini API",
            model=settings.GEMINI_MODEL,
        )
    except Exception as e:
        return ServiceHealth(
            status=HealthStatus.DEGRADED,
            configured=True,
            message=f"Gemini client initialization failed: {str(e)}",
            provider="Google Gemini API",
            model=settings.GEMINI_MODEL,
        )
