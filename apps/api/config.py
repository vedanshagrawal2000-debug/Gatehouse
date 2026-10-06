from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional, Any, Union
import os
import json


class Settings(BaseSettings):
    APP_NAME: str = "GATEHOUSE Tactical Operations API"
    VERSION: str = "4.2.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "t")

    # Security & CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    FRONTEND_URL: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
        elif isinstance(v, (list, set, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]

    # Gemini API (Strictly Server-Side)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Supabase PostgreSQL (Strictly Server-Side)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: str = ""

    # Telemetry defaults
    AIR_GAPPED: bool = True
    CLEARANCE_LEVEL: str = "SOVEREIGN-L5"
    CLUSTER_REGION: str = "CLUSTER-US-EAST"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
