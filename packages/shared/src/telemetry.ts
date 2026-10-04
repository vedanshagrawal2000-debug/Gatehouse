export interface SystemMetrics {
  throughput_ops_sec: number;
  clearance_level: string;
  active_agents: number;
  total_agents: number;
  latency_ms: number;
  air_gapped: boolean;
  secured_volume_usd: string;
  execution_reliability: string;
  mean_reasoning_time_ms: number;
  cluster_region: string;
}

export interface PipelineStep {
  step: number;
  step_code: string;
  phase: string;
  title: string;
  description: string;
  is_gate: boolean;
  risk_level?: 'low' | 'medium' | 'elevated' | 'critical';
  status: 'passed' | 'active' | 'pending' | 'blocked';
  timestamp?: string;
  details?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  actor: string;
  status: 'success' | 'warning' | 'critical' | 'gated';
  payload_hash: string;
  metadata?: Record<string, unknown>;
}
