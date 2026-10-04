from fastapi import APIRouter
from typing import List
from models.contracts import SystemMetricsResponse, PipelineStepResponse
from config import settings

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry"])


@router.get("/metrics", response_model=SystemMetricsResponse)
async def get_system_metrics() -> SystemMetricsResponse:
    return SystemMetricsResponse(
        throughput_ops_sec=4800.0,
        clearance_level=settings.CLEARANCE_LEVEL,
        active_agents=3,
        total_agents=3,
        latency_ms=12.0,
        air_gapped=settings.AIR_GAPPED,
        secured_volume_usd="$420M+",
        execution_reliability="99.99%",
        mean_reasoning_time_ms=180.0,
        cluster_region=settings.CLUSTER_REGION,
    )


@router.get("/pipeline", response_model=List[PipelineStepResponse])
async def get_pipeline_steps() -> List[PipelineStepResponse]:
    return [
        PipelineStepResponse(
            step=1,
            step_code="STEP 01",
            phase="INGESTION",
            title="BUSINESS REQUEST",
            description="Natural language intent parsed via Slack, incoming webhook, ERP trigger, or tactical operations terminal.",
            is_gate=False,
            risk_level="low",
            status="passed",
        ),
        PipelineStepResponse(
            step=2,
            step_code="STEP 02",
            phase="REASONING",
            title="AI AGENT EVALUATION",
            description="Multi-model reasoning loops break requests into sub-tasks, synthesize parameters, and assign tool targets.",
            is_gate=False,
            risk_level="medium",
            status="passed",
        ),
        PipelineStepResponse(
            step=3,
            step_code="STEP 03",
            phase="SANDBOX",
            title="TOOL EXECUTION",
            description="Cryptographic payload staging, sandbox pre-flight checks, and direct deterministic API invocation.",
            is_gate=False,
            risk_level="medium",
            status="active",
        ),
        PipelineStepResponse(
            step=4,
            step_code="STEP 04 // REQUIRED GATE",
            phase="PERIMETER INTERRUPT",
            title="HUMAN APPROVAL",
            description="High-risk parameter detected. Workflow halted at the Gatehouse shield for single-click biometric authorization.",
            is_gate=True,
            risk_level="elevated",
            status="pending",
        ),
        PipelineStepResponse(
            step=5,
            step_code="STEP 05",
            phase="CONFIRMATION",
            title="RESULT & IMMUTABLE AUDIT",
            description="Cryptographic log pinned to the immutable telemetry record. Immediate outcome committed to source system.",
            is_gate=False,
            risk_level="low",
            status="pending",
        ),
    ]
