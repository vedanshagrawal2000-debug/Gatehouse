export type ToolRiskTier = 'read_only' | 'standard' | 'sensitive' | 'high_risk';

export interface ToolParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'erp' | 'banking' | 'crm' | 'telemetry' | 'security';
  risk_tier: ToolRiskTier;
  requires_human_approval: boolean;
  approval_threshold_amount?: number;
  parameters: ToolParameterDefinition[];
}

export interface ToolExecutionPayload {
  tool_id: string;
  parameters: Record<string, unknown>;
  invocation_id: string;
  agent_id: string;
}

export interface ToolExecutionResult {
  invocation_id: string;
  tool_id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  execution_duration_ms: number;
}
