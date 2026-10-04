import { AgentExecutionRequest, AgentExecutionResult, PipelineStep } from '@gatehouse/shared';
import { GATEHOUSE_AGENTS } from './definitions.js';

export interface IAgentOrchestrator {
  executeTask(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
  getPipelineSteps(taskId: string): Promise<PipelineStep[]>;
}

export const INITIAL_PIPELINE_STEPS: PipelineStep[] = [
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
