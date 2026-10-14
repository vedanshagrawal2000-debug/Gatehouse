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
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header telemetry stripe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="font-mono text-xs uppercase tracking-wider text-[#111111] font-semibold">
            INFRASTRUCTURE TELEMETRY // BACKEND HEALTH VERIFICATION
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#888888]">
            CHECKED: {lastChecked || 'CONNECTING...'}
          </span>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-3 py-1 text-xs font-mono uppercase tracking-wider bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111] rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-subtle"
          >
            {loading ? 'PINGING...' : 'RE-PING'}
          </button>
        </div>
      </div>

      {/* Main Connection Status Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Gateway Status */}
        <div className="bg-[#FAFAFA] p-4 rounded-lg border border-[#E5E5E5] flex flex-col justify-between">
          <div className="text-[11px] font-mono text-[#666666] uppercase tracking-wider">API GATEWAY</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-sm font-bold text-[#111111] uppercase tracking-tight">
              {isConnected ? 'ONLINE // READY' : 'CONNECTION FAILED'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#888888] mt-2">
            LATENCY: {latency !== null ? `${latency}ms` : 'TIMEOUT'}
          </div>
        </div>

        {/* Gemini API Status */}
        <div className="bg-[#FAFAFA] p-4 rounded-lg border border-[#E5E5E5] flex flex-col justify-between">
          <div className="text-[11px] font-mono text-[#666666] uppercase tracking-wider">GEMINI API ENGINE</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${health?.services.gemini.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-bold text-[#111111] uppercase tracking-tight">
              {health?.services.gemini.configured ? 'ACTIVE // INITIALIZED' : 'CONFIG REQUIRED'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#888888] mt-2 truncate">
            MODEL: {health?.services.gemini.model || 'gemini-2.5-flash'}
          </div>
        </div>

        {/* Supabase Status */}
        <div className="bg-[#FAFAFA] p-4 rounded-lg border border-[#E5E5E5] flex flex-col justify-between">
          <div className="text-[11px] font-mono text-[#666666] uppercase tracking-wider">SUPABASE POSTGRESQL</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${health?.services.database.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-bold text-[#111111] uppercase tracking-tight">
              {health?.services.database.configured ? 'CONNECTED' : 'DEGRADED / READY'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#888888] mt-2">
            PROVIDER: PostgreSQL
          </div>
        </div>

        {/* Kernel Telemetry */}
        <div className="bg-[#FAFAFA] p-4 rounded-lg border border-[#E5E5E5] flex flex-col justify-between">
          <div className="text-[11px] font-mono text-[#666666] uppercase tracking-wider">SYSTEM CLEARANCE</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-bold text-[#111111]">
              {health?.metrics?.clearance || 'SOVEREIGN-L5'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#888888] mt-2">
            UPTIME: {health ? `${health.uptime_seconds}s` : '0s'}
          </div>
        </div>
      </div>

      {/* Diagnostic / Error banner if any */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-mono text-xs rounded-lg">
          <div className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
            <span>BACKEND LINK NOTICE: Unable to communicate with FastAPI at backend URL</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700">
            Detail: {error}. Check backend server status or NEXT_PUBLIC_API_URL.
          </div>
        </div>
      )}

      {/* JSON Payload Inspector Drawer */}
      <details className="cursor-pointer group">
        <summary className="font-mono text-[11px] text-[#666666] uppercase hover:text-[#111111] flex items-center gap-1.5 transition-colors">
          <span className="material-symbols-outlined text-[14px]">data_object</span>
          <span>VIEW HEALTH CONTRACT RESPONSE (HTTP 200)</span>
        </summary>
        <pre className="mt-2 p-3 bg-[#FAFAFA] border border-[#E5E5E5] text-[10px] font-mono text-[#111111] overflow-x-auto max-h-48 rounded-lg">
          {health ? JSON.stringify(health, null, 2) : error ? JSON.stringify({ error }, null, 2) : 'Awaiting handshake...'}
        </pre>
      </details>
    </div>
  );
}
