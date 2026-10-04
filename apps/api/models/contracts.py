from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from enum import Enum


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ServiceHealth(BaseModel):
    status: HealthStatus
    configured: bool
    message: Optional[str] = None
    latency_ms: Optional[float] = None
    provider: Optional[str] = None
    model: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: HealthStatus
    service: str
    version: str
    timestamp: str
    uptime_seconds: float
    environment: str
    services: Dict[str, ServiceHealth]
    metrics: Optional[Dict[str, Any]] = None


class SystemMetricsResponse(BaseModel):
    throughput_ops_sec: float
    clearance_level: str
    active_agents: int
    total_agents: int
    latency_ms: float
    air_gapped: bool
    secured_volume_usd: str
    execution_reliability: str
    mean_reasoning_time_ms: float
    cluster_region: str


class AgentOperationalStatus(str, Enum):
    READY = "ready"
    SYNC_ACTIVE = "sync_active"
    GATE_PENDING = "gate_pending"
    OFFLINE = "offline"
    BUSY = "busy"


class AgentNodeResponse(BaseModel):
    id: str
    name: str
    role: str
    status: AgentOperationalStatus
    execution_rate: str
    description: str
    queue_pending: int
    external_system: str
    system_status: str
    requires_approval: bool
    model: str


class PipelineStepResponse(BaseModel):
    step: int
    step_code: str
    phase: str
    title: str
    description: str
    is_gate: bool
    risk_level: Optional[str] = "low"
    status: str = "passed"
    timestamp: Optional[str] = None
    details: Optional[str] = None


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalRequestResponse(BaseModel):
    id: str
    task_id: str
    agent_id: str
    action_type: str
    title: str
    description: str
    risk_factor: str
    requested_at: str
    status: ApprovalStatus
    amount_usd: Optional[float] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    operator_id: Optional[str] = None


class ApprovalDecisionPayload(BaseModel):
    decision: str  # "approve" | "reject"
    operator_id: str
    notes: Optional[str] = None
