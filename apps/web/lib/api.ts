import { HealthCheckResponse, SystemMetrics, AgentNode, PipelineStep } from '@gatehouse/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<{ data: HealthCheckResponse | null; error: string | null; latencyMs: number }> {
  const startTime = performance.now();
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    const latencyMs = Math.round(performance.now() - startTime);
    if (!res.ok) {
      return {
        data: null,
        error: `Server responded with status ${res.status}: ${res.statusText}`,
        latencyMs,
      };
    }
    const data: HealthCheckResponse = await res.json();
    return { data, error: null, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to connect to GATEHOUSE API backend',
      latencyMs,
    };
  }
}

export async function fetchMetrics(): Promise<SystemMetrics | null> {
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/v1/telemetry/metrics`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgents(): Promise<AgentNode[]> {
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/v1/agents`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchPipeline(): Promise<PipelineStep[]> {
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/v1/telemetry/pipeline`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
