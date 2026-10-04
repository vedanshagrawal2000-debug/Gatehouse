export type AgentId = 'customer' | 'inventory' | 'finance' | string;

export type AgentOperationalStatus = 'ready' | 'sync_active' | 'gate_pending' | 'offline' | 'busy';

export interface AgentNode {
  id: AgentId;
  name: string;
  role: string;
  status: AgentOperationalStatus;
  execution_rate: string;
  description: string;
  queue_pending: number;
  external_system: string;
  system_status: string;
  requires_approval: boolean;
  model: string;
  last_heartbeat?: string;
}

export interface AgentExecutionRequest {
  agent_id: AgentId;
  task_id: string;
  input_prompt: string;
  context?: Record<string, unknown>;
  require_human_gate?: boolean;
}

export interface AgentExecutionResult {
  task_id: string;
  agent_id: AgentId;
  status: 'completed' | 'gated' | 'failed';
  output: string;
  tools_called: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
  execution_time_ms: number;
  tokens_used?: number;
}
