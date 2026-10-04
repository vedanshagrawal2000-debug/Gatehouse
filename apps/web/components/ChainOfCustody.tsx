'use client';

import React from 'react';
import { PipelineStep } from '@gatehouse/shared';

interface ChainOfCustodyProps {
  steps?: PipelineStep[];
}

export function ChainOfCustody({ steps }: ChainOfCustodyProps) {
  const displaySteps: PipelineStep[] = steps && steps.length > 0 ? steps : [
    {
      step: 1,
      step_code: 'STEP 01',
      phase: 'INGESTION',
      title: 'BUSINESS REQUEST',
      description: 'Natural language intent parsed via Slack, incoming webhook, ERP trigger, or tactical operations terminal.',
      is_gate: false,
      risk_level: 'low',
      status: 'passed',
    },
    {
      step: 2,
      step_code: 'STEP 02',
      phase: 'REASONING',
      title: 'AI AGENT EVALUATION',
      description: 'Multi-model reasoning loops break requests into sub-tasks, synthesize parameters, and assign tool targets.',
      is_gate: false,
      risk_level: 'medium',
      status: 'passed',
    },
    {
      step: 3,
      step_code: 'STEP 03',
      phase: 'SANDBOX',
      title: 'TOOL EXECUTION',
      description: 'Cryptographic payload staging, sandbox pre-flight checks, and direct deterministic API invocation.',
      is_gate: false,
      risk_level: 'medium',
      status: 'active',
    },
    {
      step: 4,
      step_code: 'STEP 04 // REQUIRED GATE',
      phase: 'PERIMETER INTERRUPT',
      title: 'HUMAN APPROVAL',
      description: 'High-risk parameter detected. Workflow halted at the Gatehouse shield for single-click biometric authorization.',
      is_gate: true,
      risk_level: 'elevated',
      status: 'pending',
    },
    {
      step: 5,
      step_code: 'STEP 05',
      phase: 'CONFIRMATION',
      title: 'RESULT & IMMUTABLE AUDIT',
      description: 'Cryptographic log pinned to the immutable telemetry record. Immediate outcome committed to source system.',
      is_gate: false,
      risk_level: 'low',
      status: 'pending',
    },
  ];

  return (
    <section className="mt-space-lg">
      <div className="flex items-center gap-space-xs mb-space-sm">
        <span className="h-4 w-1 bg-primary-container" />
        <h2 className="font-headline text-lg uppercase tracking-wide text-on-surface font-bold">
          CHAIN OF CUSTODY PIPELINE
        </h2>
      </div>

      <div className="relative pl-6 space-y-space-md">
        {/* Continuous vertical separator track */}
        <div className="absolute left-2.5 top-3 bottom-6 w-0.5 bg-surface-container-high" />

        {displaySteps.map((s) => {
          const isGate = s.is_gate;
          return (
            <div key={s.step} className="relative flex flex-col">
              {/* Step indicator node on vertical track */}
              <div
                className={`absolute -left-[27px] top-2 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  isGate
                    ? 'bg-primary-container shadow-[0_0_10px_#dc2626]'
                    : s.status === 'passed'
                    ? 'bg-secondary'
                    : 'bg-surface-container-highest'
                }`}
              >
                {isGate ? (
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 bg-surface rounded-full" />
                )}
              </div>

              {/* Step content card */}
              <div
                className={`p-space-sm border relative ${
                  isGate
                    ? 'bg-surface-container-high border-primary-container shadow-md'
                    : 'bg-surface-container border-border-default shadow-sm'
                }`}
              >
                {isGate && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary-container text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                    PERIMETER INTERRUPT
                  </div>
                )}
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className={`font-mono text-xs font-semibold ${isGate ? 'text-primary' : 'text-secondary'}`}>
                    {s.step_code}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant/80">
                    {s.phase}
                  </span>
                </div>
                <div className="font-headline text-sm font-bold text-on-surface">
                  {s.title}
                </div>
                <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {s.description}
                </p>

                {isGate && (
                  <div className="mt-space-sm p-2 bg-surface-container-lowest border border-border-default flex items-center justify-between font-mono text-[10px]">
                    <span className="text-on-surface-variant">RISK FACTOR: ELEVATED (PAYOUT &gt; $25,000)</span>
                    <span className="text-primary font-bold">OPERATOR OVERRIDE REQ</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
