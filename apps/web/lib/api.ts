import { HealthCheckResponse, SystemMetrics, AgentNode, PipelineStep } from '@gatehouse/shared';

/**
 * Resolves the primary base URL for API calls.
 * In browser environments, defaults to same-origin relative URL ('')
 * so requests leverage Next.js rewrites (/health and /api/:path*) to proxy to Render.
 * This avoids cross-origin CORS, mixed content, and localhost connection failures.
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    // Only use NEXT_PUBLIC_API_URL directly in the browser if it's explicitly set to an external HTTPS URL
    if (publicUrl && publicUrl.startsWith('https://') && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
      return publicUrl.replace(/\/$/, '');
    }
    // Default for browser: same-origin relative path (Next.js rewrites proxy to backend)
    return '';
  }

  // Server-side execution (SSR/build-time):
  const rawUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return rawUrl.replace(/\/$/, '');
}

/**
 * Resilient fetch that tries the primary URL and falls back to relative same-origin if needed.
 */
async function resilientFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  const primaryUrl = `${baseUrl}${cleanPath}`;

  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok || baseUrl === '') {
      return res;
    }
  } catch (err) {
    if (baseUrl === '') {
      throw err;
    }
  }

  // If primaryUrl was an absolute URL that failed, fallback to same-origin relative path
  if (baseUrl !== '') {
    return await fetch(cleanPath, options);
  }

  throw new Error(`Failed to fetch from ${primaryUrl}`);
}

export async function fetchHealth(): Promise<{ data: HealthCheckResponse | null; error: string | null; latencyMs: number }> {
  const startTime = performance.now();
  try {
    const res = await resilientFetch('/health', {
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
    const res = await resilientFetch('/api/v1/telemetry/metrics', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgents(): Promise<AgentNode[]> {
  try {
    const res = await resilientFetch('/api/v1/agents', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchPipeline(): Promise<PipelineStep[]> {
  try {
    const res = await resilientFetch('/api/v1/telemetry/pipeline', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
