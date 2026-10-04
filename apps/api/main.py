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
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Tactical Autonomous Business Infrastructure & AI Operations Command Post API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(telemetry_router)
app.include_router(agents_router)
app.include_router(inventory_router)
app.include_router(enquiries_router)
app.include_router(missions_router)
app.include_router(approvals_router)
app.include_router(audit_router)


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

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
