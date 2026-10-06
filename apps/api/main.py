from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import (
    health_router,
    telemetry_router,
    agents_router,
    approvals_router,
    inventory_router,
    enquiries_router,
    missions_router,
    audit_router,
    agent_router,
    stitch_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Tactical Autonomous Business Infrastructure & AI Operations Command Post API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
allowed_origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, list) else [str(settings.CORS_ORIGINS)]
if settings.FRONTEND_URL and settings.FRONTEND_URL.strip():
    clean_origin = settings.FRONTEND_URL.strip().rstrip("/")
    if clean_origin not in allowed_origins:
        allowed_origins.append(clean_origin)

is_wildcard = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard Production Health Probe
@app.get("/health", tags=["Health"])
def health_check():
    """Production health check probe for Render and uptime monitoring."""
    return {"status": "ok"}


# Register routers
app.include_router(health_router)
app.include_router(telemetry_router)
app.include_router(agents_router)
app.include_router(inventory_router)
app.include_router(enquiries_router)
app.include_router(missions_router)
app.include_router(approvals_router)
app.include_router(audit_router)
app.include_router(agent_router)
app.include_router(stitch_router)


@app.get("/", tags=["Root"])
def read_root():
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", str(settings.PORT)))
    host = os.environ.get("HOST", settings.HOST)

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=settings.DEBUG and settings.ENVIRONMENT == "development",
    )
