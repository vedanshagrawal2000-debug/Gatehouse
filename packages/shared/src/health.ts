export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  status: HealthStatus;
  configured: boolean;
  message?: string;
  latency_ms?: number;
  provider?: string;
  model?: string;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  environment: string;
  services: {
    api: ServiceHealth;
    gemini: ServiceHealth;
    database: ServiceHealth;
  };
  metrics?: {
    cpu_usage_pct?: number;
    memory_usage_mb?: number;
    active_requests?: number;
    cluster_region?: string;
    air_gapped?: boolean;
    clearance?: string;
  };
}
