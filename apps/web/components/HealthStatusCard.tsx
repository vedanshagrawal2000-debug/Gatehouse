'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HealthCheckResponse } from '@gatehouse/shared';
import { fetchHealth } from '@/lib/api';

export function HealthStatusCard() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const result = await fetchHealth();
    setHealth(result.data);
    setError(result.error);
    setLatency(result.latencyMs);
    setLoading(false);
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const isConnected = health !== null && !error;

  return (
    <div className="relative bg-surface-container-low border border-border-default reticle-box p-space-md shadow-2xl">
      {/* Header telemetry stripe */}
      <div className="flex items-center justify-between pb-space-sm border-b border-border-default/60 mb-space-md">
        <div className="flex items-center gap-space-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary animate-pulse' : 'bg-primary-container'}`} />
          <span className="font-mono text-xs uppercase tracking-wider text-on-surface font-semibold">
            TELEMETRY LINK // BACKEND HEALTH VERIFICATION
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="font-mono text-[11px] text-on-surface-variant">
            CHECKED: {lastChecked || 'CONNECTING...'}
          </span>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-surface-container hover:bg-surface-container-high border border-border-default text-primary hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? 'PINGING...' : 'RE-PING'}
          </button>
        </div>
      </div>

      {/* Main Connection Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm mb-space-md">
        {/* Core Gateway Status */}
        <div className="bg-surface-container p-space-sm border border-border-default">
          <div className="text-[11px] font-mono text-on-surface-variant uppercase">API GATEWAY</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-base font-bold font-headline uppercase ${isConnected ? 'text-secondary' : 'text-primary'}`}>
              {isConnected ? 'ONLINE // READY' : 'CONNECTION FAILED'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
            LATENCY: {latency !== null ? `${latency}ms` : 'TIMEOUT'}
          </div>
        </div>

        {/* Gemini API Status */}
        <div className="bg-surface-container p-space-sm border border-border-default">
          <div className="text-[11px] font-mono text-on-surface-variant uppercase">GEMINI API ENGINE</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-base font-bold font-headline uppercase ${
                health?.services.gemini.status === 'healthy'
                  ? 'text-secondary'
                  : 'text-tertiary'
              }`}
            >
              {health?.services.gemini.configured ? 'ACTIVE // INITIALIZED' : 'CONFIG REQUIRED'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant/80 mt-1 truncate">
            MODEL: {health?.services.gemini.model || 'gemini-2.5-flash'}
          </div>
        </div>

        {/* Supabase Status */}
        <div className="bg-surface-container p-space-sm border border-border-default">
          <div className="text-[11px] font-mono text-on-surface-variant uppercase">SUPABASE POSTGRESQL</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-base font-bold font-headline uppercase ${
                health?.services.database.status === 'healthy'
                  ? 'text-secondary'
                  : 'text-tertiary'
              }`}
            >
              {health?.services.database.configured ? 'CONNECTED' : 'TEMPLATE READY'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
            PROVIDER: PostgreSQL
          </div>
        </div>

        {/* Kernel Telemetry */}
        <div className="bg-surface-container p-space-sm border border-border-default">
          <div className="text-[11px] font-mono text-on-surface-variant uppercase">SYSTEM CLEARANCE</div>
          <div className="text-base font-bold font-headline text-on-surface mt-1">
            {health?.metrics?.clearance || 'SOVEREIGN-L5'}
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
            UPTIME: {health ? `${health.uptime_seconds}s` : '0s'}
          </div>
        </div>
      </div>

      {/* Diagnostic / Error banner if any */}
      {error && (
        <div className="p-space-sm bg-error-container/20 border border-primary-container text-primary font-mono text-xs mb-space-sm">
          <div className="font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            LINK ERROR: Unable to communicate with FastAPI at http://localhost:8000
          </div>
          <div className="mt-1 text-[11px] text-on-surface-variant">
            Detail: {error}. Ensure FastAPI is running via <code className="text-primary font-bold">npm run dev:api</code>.
          </div>
        </div>
      )}

      {/* JSON Payload Inspector Drawer */}
      <details className="cursor-pointer group">
        <summary className="font-mono text-[11px] text-on-surface-variant uppercase hover:text-white flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">data_object</span>
          VIEW RAW HEALTH CONTRACT PAYLOAD (HTTP 200)
        </summary>
        <pre className="mt-2 p- space-sm bg-surface-container-lowest border border-border-default p-2 text-[10px] font-mono text-secondary overflow-x-auto max-h-48">
          {health ? JSON.stringify(health, null, 2) : error ? JSON.stringify({ error, target: 'http://localhost:8000/health' }, null, 2) : 'Awaiting handshake...'}
        </pre>
      </details>
    </div>
  );
}
