'use client';

import React from 'react';
import { AgentNode } from '@gatehouse/shared';

interface AgentTopologyProps {
  agents: AgentNode[];
}

export function AgentTopology({ agents }: AgentTopologyProps) {
  const displayAgents = agents.length > 0 ? agents : [
    {
      id: 'customer',
      name: 'Customer Agent',
      role: 'Autonomous Dispute & Ticket Routing',
      status: 'ready',
      execution_rate: '99.4% EXEC',
      description: 'Resolving multi-tier disputes, triaging Tier-1 priority tickets, auto-routing escalations.',
      queue_pending: 0,
      external_system: 'CRM // ZENDESK',
      system_status: 'READY',
      requires_approval: false,
      model: 'gemini-2.5-flash',
    },
    {
      id: 'inventory',
      name: 'Inventory Agent',
      role: 'Predictive Supply Chain & PO Dispatch',
      status: 'sync_active',
      execution_rate: 'SYNC ACTIVE',
      description: 'Syncing Warehouse 04, telemetry predictive depletion models, instant vendor PO dispatch.',
      queue_pending: 0,
      external_system: 'ERP: SAP / ORACLE',
      system_status: 'OK // 8MS',
      requires_approval: false,
      model: 'gemini-2.5-flash',
    },
    {
      id: 'finance',
      name: 'Finance Agent',
      role: 'Ledger Reconciliation & Gated Payouts',
      status: 'gate_pending',
      execution_rate: 'GATE PENDING',
      description: 'Reconciling ledger entries. Automated dispatch halted on payouts >$25k for security sign-off.',
      queue_pending: 1,
      external_system: 'LEDGER: ACC_0941',
      system_status: 'SIG REQ',
      requires_approval: true,
      model: 'gemini-2.5-pro',
    },
  ];

  return (
    <div className="relative bg-surface-container-low p-space-md border border-border-default shadow-md rounded-none">
      {/* Reticle corner accents */}
      <div className="absolute top-2 left-2 font-mono text-[10px] text-on-surface-variant opacity-60">┌ [SYS_TOPOLOGY]</div>
      <div className="absolute top-2 right-2 font-mono text-[10px] text-on-surface-variant opacity-60">┐</div>
      <div className="absolute bottom-2 left-2 font-mono text-[10px] text-on-surface-variant opacity-60">└ REGION: US-EAST</div>
      <div className="absolute bottom-2 right-2 font-mono text-[10px] text-on-surface-variant opacity-60">┘</div>

      {/* Network Header */}
      <div className="flex items-center justify-between pt-3 pb-space-sm mb-space-md border-b border-border-default/40">
        <div className="flex items-center gap-space-xs">
          <span className="inline-block w-2 h-2 bg-primary-container" />
          <span className="font-mono text-xs uppercase tracking-wider text-on-surface font-semibold">
            GRID_STATUS // LIVE AGENT ORCHESTRATION
          </span>
        </div>
        <span className="font-mono text-[10px] text-secondary px-2 py-0.5 bg-surface-container-high uppercase tracking-widest border border-secondary/30">
          ENCRYPTED AIR-GAP
        </span>
      </div>

      {/* Central Node: AI OPERATIONS CORE */}
      <div className="relative bg-surface-container p-space-md border border-border-default text-center mb-space-sm">
        <div className="inline-flex p-2 bg-primary-container/20 rounded-full mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white shadow-md font-bold">
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </div>
        </div>
        <div className="font-headline text-base uppercase tracking-wider text-on-surface font-bold">
          AI OPERATIONS CORE
        </div>
        <p className="font-mono text-[11px] text-on-surface-variant uppercase mt-0.5">
          AUTONOMOUS MULTI-MODEL KERNEL (GEMINI ENGINE)
        </p>

        {/* Live telemetry readout metrics inside node */}
        <div className="grid grid-cols-2 gap-space-xs mt-space-sm bg-surface-container-lowest p-2 border border-border-default">
          <div className="flex flex-col text-left">
            <span className="font-mono text-[10px] text-on-surface-variant">THROUGHPUT</span>
            <span className="font-mono text-sm text-primary font-semibold">4.8k ops/s</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-mono text-[10px] text-on-surface-variant">CLEARANCE</span>
            <span className="font-mono text-sm text-secondary font-semibold">SOVEREIGN-L5</span>
          </div>
        </div>
      </div>

      {/* Satellite Agent Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-3">
        {displayAgents.map((agent) => {
          const isGated = agent.requires_approval;
          return (
            <div
              key={agent.id}
              className={`bg-surface-container p-space-sm border ${
                isGated ? 'border-primary-container/70 shadow-[0_0_12px_rgba(220,38,38,0.2)]' : 'border-border-default'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-space-xs">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isGated ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {agent.id === 'customer' ? 'support_agent' : agent.id === 'inventory' ? 'inventory_2' : 'account_balance'}
                  </span>
                  <span className="font-mono text-xs uppercase font-semibold text-on-surface">
                    {agent.name}
                  </span>
                </div>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 ${
                    isGated
                      ? 'bg-primary-container/20 text-primary border border-primary-container/50'
                      : 'bg-surface-container-high text-secondary border border-secondary/30'
                  }`}
                >
                  {agent.execution_rate}
                </span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed min-h-[3rem]">
                {agent.description}
              </p>
              <div className="mt-3 pt-2 border-t border-border-default/40 flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
                <span>{agent.external_system}</span>
                <span className={isGated ? 'text-primary font-bold animate-pulse' : 'text-secondary'}>
                  {agent.system_status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live HUD Status Ticker */}
      <div className="mt-space-md p-2 bg-surface-container-lowest border border-border-default flex items-center justify-between font-mono text-[11px] text-on-surface-variant uppercase">
        <span className="text-secondary font-semibold">AGENTS: 03/03 ACTIVE</span>
        <span className="text-on-surface-variant">AIR-GAPPED TELEMETRY</span>
        <span className="text-primary font-semibold">LATENCY: 12MS</span>
      </div>
    </div>
  );
}
