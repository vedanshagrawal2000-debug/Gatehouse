export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'timeout';

export interface ApprovalRequest {
  id: string;
  task_id: string;
  agent_id: string;
  action_type: string;
  title: string;
  description: string;
  risk_factor: 'standard' | 'elevated' | 'critical';
  requested_at: string;
  expires_at?: string;
  status: ApprovalStatus;
  amount_usd?: number;
  payload: Record<string, unknown>;
  operator_id?: string;
  operator_decision_at?: string;
  decision_notes?: string;
}

export interface ApprovalDecisionPayload {
  request_id: string;
  decision: 'approve' | 'reject';
  operator_id: string;
  notes?: string;
}
