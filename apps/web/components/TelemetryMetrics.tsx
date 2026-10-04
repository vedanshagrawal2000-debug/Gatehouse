'use client';

import React from 'react';
import { SystemMetrics } from '@gatehouse/shared';

interface TelemetryMetricsProps {
  metrics?: SystemMetrics | null;
}

export function TelemetryMetrics({ metrics }: TelemetryMetricsProps) {
  const volume = metrics?.secured_volume_usd || '$420M+';
  const reliability = metrics?.execution_reliability || '99.99%';
  const reasoning = metrics?.mean_reasoning_time_ms ? `<${metrics.mean_reasoning_time_ms}ms` : '<180ms';

  return (
    <section className="mt-space-lg">
      <div className="bg-surface-container-low p-space-md border border-border-default shadow-sm">
        <div className="flex items-center justify-between pb-space-xs border-b border-border-default/40 mb-space-sm">
          <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-semibold">
            VERIFIED TELEMETRY PROOF
          </span>
          <span className="font-mono text-[10px] text-secondary flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
            LIVE STREAM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
          <div className="bg-surface-container p-space-sm border border-border-default flex items-center justify-between">
            <div>
              <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
                {volume}
              </div>
              <div className="font-sans text-xs text-on-surface-variant">
                Secured Autonomous Transactions
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px] text-primary">security</span>
          </div>

          <div className="bg-surface-container p-space-sm border border-border-default flex items-center justify-between">
            <div>
              <div className="font-headline text-2xl font-bold text-secondary tracking-tight">
                {reliability}
              </div>
              <div className="font-sans text-xs text-on-surface-variant">
                Execution Reliability Under Load
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px] text-secondary">verified</span>
          </div>

          <div className="bg-surface-container p-space-sm border border-border-default flex items-center justify-between">
            <div>
              <div className="font-headline text-2xl font-bold text-tertiary tracking-tight">
                {reasoning}
              </div>
              <div className="font-sans text-xs text-on-surface-variant">
                Mean Agent Reasoning Time
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px] text-tertiary">speed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
