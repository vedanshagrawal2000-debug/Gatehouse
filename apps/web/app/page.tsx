'use client';

import React, { useEffect, useState } from 'react';
import { TacticalHeader } from '@/components/TacticalHeader';
import { HealthStatusCard } from '@/components/HealthStatusCard';
import { AgentTopology } from '@/components/AgentTopology';
import { ChainOfCustody } from '@/components/ChainOfCustody';
import { TelemetryMetrics } from '@/components/TelemetryMetrics';
import { fetchAgents, fetchMetrics, fetchPipeline } from '@/lib/api';
import { AgentNode, PipelineStep, SystemMetrics } from '@gatehouse/shared';

export default function HomePage() {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    async function loadData() {
      const [agentsData, pipelineData, metricsData] = await Promise.all([
        fetchAgents(),
        fetchPipeline(),
        fetchMetrics(),
      ]);
      if (agentsData.length > 0) setAgents(agentsData);
      if (pipelineData.length > 0) setPipeline(pipelineData);
      if (metricsData) setMetrics(metricsData);
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface tactical-grid">
      {/* 1. Tactical Header */}
      <TacticalHeader />

      {/* Main Content Post */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-24 pb-16 px-gutter">
        {/* 2. LIVE HEALTH CHECK BANNER (TASK REQUIREMENT) */}
        <section className="mb-space-lg">
          <HealthStatusCard />
        </section>

        {/* 3. HERO COMMAND POST */}
        <section className="relative overflow-hidden mb-space-lg p-space-lg bg-surface-container-low border border-border-default">
          {/* Subtle perimeter glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-48 -left-20 w-52 h-52 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

          {/* Tactical HUD Pill */}
          <div className="inline-flex items-center gap-space-xs px-2.5 py-1 bg-surface-container-high border border-border-default self-start mb-space-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
              AUTONOMOUS BUSINESS INFRASTRUCTURE // PROTOCOL 01
            </span>
          </div>

          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight text-on-surface uppercase leading-tight">
            EVERY OPERATION. <br />
            <span className="text-primary-container">UNDER CONTROL.</span>
          </h1>

          <p className="font-sans text-sm md:text-base text-on-surface-variant mt-space-sm max-w-2xl leading-relaxed">
            Deploy intelligent AI agents powered by Google Gemini and Supabase PostgreSQL that execute mission-critical workflows with cryptographic precision, while your command post maintains fail-safe human perimeter control.
          </p>

          <div className="flex flex-col sm:flex-row gap-space-sm mt-space-md max-w-md">
            <button
              type="button"
              className="flex-1 min-h-[44px] bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-mono text-xs tracking-widest uppercase py-2.5 px-space-md flex items-center justify-center gap-space-sm shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>ENTER CONTROL ROOM</span>
              <span className="font-mono text-[10px] opacity-75 ml-auto">[AUTH_01]</span>
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-default font-mono text-xs tracking-widest uppercase py-2.5 px-space-md flex items-center justify-center gap-space-sm shadow-sm transition-colors text-center"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">terminal</span>
              <span>API DOCS (FASTAPI)</span>
            </a>
          </div>
        </section>

        {/* 4. AGENT NETWORK TOPOLOGY */}
        <section className="mb-space-lg">
          <AgentTopology agents={agents} />
        </section>

        {/* 5. TACTICAL CAPABILITIES */}
        <section className="mb-space-lg">
          <div className="flex items-center gap-space-xs mb-space-sm">
            <span className="h-4 w-1 bg-primary-container" />
            <h2 className="font-headline text-lg uppercase tracking-wide text-on-surface font-bold">
              TACTICAL CAPABILITIES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="bg-surface-container p-space-md border border-border-default">
              <div className="flex justify-between items-center mb-space-xs">
                <span className="font-mono text-[10px] text-primary px-2 py-0.5 bg-surface-container-high font-semibold">
                  TIER-1 CORE
                </span>
                <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
              </div>
              <h3 className="font-headline text-base uppercase text-on-surface font-bold mt-1">
                Autonomous Operations
              </h3>
              <p className="font-sans text-xs text-on-surface-variant mt-space-xs leading-relaxed">
                Multi-agent reasoning loops execute high-entropy business workflows end-to-end without manual intervention, self-correcting on downstream edge anomalies.
              </p>
              <div className="mt-space-md p-space-sm bg-surface-container-low border border-border-default flex items-center justify-between">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">EXECUTION OVERHEAD</span>
                <span className="font-mono text-xs text-secondary font-bold">-84% REDUCTION</span>
              </div>
            </div>

            <div className="bg-surface-container p-space-md border border-border-default">
              <div className="flex justify-between items-center mb-space-xs">
                <span className="font-mono text-[10px] text-secondary px-2 py-0.5 bg-surface-container-high font-semibold">
                  DYNAMIC DISPATCH
                </span>
                <span className="material-symbols-outlined text-secondary text-[20px]">terminal</span>
              </div>
              <h3 className="font-headline text-base uppercase text-on-surface font-bold mt-1">
                Intelligent Tool Execution
              </h3>
              <p className="font-sans text-xs text-on-surface-variant mt-space-xs leading-relaxed">
                Context-aware routing across ERP, CRM, core banking APIs, and telemetry pipelines with automated payload validation and zero-loss dynamic failover.
              </p>
              <div className="mt-space-md p-space-sm bg-surface-container-low border border-border-default flex items-center justify-between">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">ADAPTER CATALOG</span>
                <span className="font-mono text-xs text-secondary font-bold">120+ TACTICAL APIS</span>
              </div>
            </div>

            <div className="bg-surface-container p-space-md border border-border-default">
              <div className="flex justify-between items-center mb-space-xs">
                <span className="font-mono text-[10px] text-primary px-2 py-0.5 bg-surface-container-high font-semibold">
                  FAIL-SAFE GATING
                </span>
                <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
              </div>
              <h3 className="font-headline text-base uppercase text-on-surface font-bold mt-1">
                Human Approval
              </h3>
              <p className="font-sans text-xs text-on-surface-variant mt-space-xs leading-relaxed">
                Sensitive wire transfers, mass client notifications, and infrastructure policies halt at the perimeter for mandatory operator biometric confirmation.
              </p>
              <div className="mt-space-md p-space-sm bg-surface-container-low border border-border-default flex items-center justify-between">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">SECURITY COMPROMISE</span>
                <span className="font-mono text-xs text-primary font-bold">0 UNAPPROVED ACTIONS</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CHAIN OF CUSTODY PIPELINE */}
        <ChainOfCustody steps={pipeline} />

        {/* 7. VERIFIED TELEMETRY METRICS */}
        <TelemetryMetrics metrics={metrics} />
      </main>

      {/* 8. Tactical Command Post Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-border-default mt-auto py-space-md px-gutter">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-sm font-mono text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-space-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="text-secondary uppercase">ALL SYSTEMS OPERATIONAL</span>
            <span className="text-on-surface-variant/50">|</span>
            <span>GATEHOUSE v4.2</span>
          </div>
          <div>© GATEHOUSE SYSTEMS INC. // CONFIDENTIAL OPERATIONAL MATRIX</div>
        </div>
      </footer>
    </div>
  );
}
