export type TabType = 
  | 'dashboard'
  | 'overview'
  | 'ai-agents'
  | 'agents'
  | 'live-operations'
  | 'operations'
  | 'approval-center'
  | 'approvals'
  | 'activity-logs'
  | 'audit_logs'
  | 'audit-logs'
  | 'activity'
  | 'protocols'
  | 'command-center';

export interface ExecutionPhase {
  phaseNumber: number;
  phaseName: string;
  responsibleAgent: string;
  actionDescription: string;
  isAutonomous: boolean;
  tripwireCondition?: string;
}

export interface AllocatedAgent {
  agentId: string;
  agentCode: string;
  agentName: string;
  role: string;
  assignedTask: string;
  boundTools: string[];
  enclave: string;
  clearance: string;
}

export interface StrategicPlan {
  objective: string;
  strategicRationale: string;
  allocatedAgents: AllocatedAgent[];
  executionPhases: ExecutionPhase[];
  riskTier?: 'LOW' | 'ELEVATED' | 'CRITICAL';
  estimatedCost?: number;
  approvalGatingRequired?: boolean;
  gatingReason?: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  stock: number;
  minThreshold: number;
  unitPrice: number;
  currency: string;
  location: string;
  status: 'optimal' | 'low' | 'depleted';
  supplierId: string;
}

export interface CustomerEnquiry {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'DRAFTED' | 'RESOLVED';
  timestamp: string;
  createdAt?: string;
}

export interface ApprovalRequest {
  id: string;
  requestId: string; // e.g. #REQ-8841-B
  missionId: string; // e.g. MS-8902-RESTOCK
  agentId: string; // AGT-02
  agentName: string; // INVENTORY AGENT
  title: string;
  description: string;
  prompt: string;
  amount: number;
  amountFormatted: string;
  autonomousLimit: number;
  varianceAmount: number;
  currency: string;
  riskLevel: 'ELEVATED' | 'CRITICAL' | 'MODERATE';
  policyRule: string; // RULE_POL_093
  enclaveHash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  reasoningSteps: string[];
  boundTool: string;
  toolPayload: any;
  lineItems?: Array<{
    sku: string;
    description: string;
    quantity: number;
    unitPrice: number;
    extendedAmount: number;
  }>;
  approvedBy?: string;
  approvedAt?: string;
  subject?: string;
  category?: string;
  senderEmail?: string;
  recipientEmail?: string;
  isStarred?: boolean;
  isRead?: boolean;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  db_type: string;
  db_status: string;
  encryption: string;
  tenant_id: string;
  last_sync: string;
  agent_count: number;
  inventory_count: number;
  enquiry_count: number;
  depleted_skus: number;
}

export interface CompanyIsolatedData {
  company: Company;
  inventory: InventoryItem[];
  enquiries: CustomerEnquiry[];
  approvals: ApprovalRequest[];
  auditLogs: AuditLogEntry[];
  agents?: AgentSpec[];
}

export interface ExecutionEvent {
  id: string;
  stepNumber: number;
  title: string;
  timestamp: string;
  status: 'DONE' | 'RUNNING' | 'FAILED' | 'GATED';
  source?: string;
  badge?: string;
  payloadInput?: any;
  payloadOutput?: any;
  reasoningTrace?: string;
  anomalyData?: any;
  gatingAlert?: {
    tripwire: string;
    reason: string;
    delta: string;
    poId?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  action: string;
  target: string;
  status: '200 OK' | 'GATED' | 'APPROVED' | 'REJECTED' | 'AUDITED';
  latencyMs: number;
  hash: string;
  details: string;
}

export interface AgentSpec {
  id: string;
  code: string;
  name: string;
  status: 'ONLINE' | 'SYNC ACTIVE' | 'GATE HALTED' | 'STANDBY';
  statusBadge: string;
  description: string;
  assignedTools: string[];
  tasksExec: number;
  latencyMs: number;
  vramAlloc: string;
  lastInference: {
    summary: string;
    timeAgo: string;
    confidence: string;
  };
  gatingPolicy: string;
  enclave: string;
  model: string;
}
