import { ToolDefinition } from '@gatehouse/shared';

export const CORE_TOOLS: ToolDefinition[] = [
  {
    id: 'crm_resolve_dispute',
    name: 'Resolve Dispute Ticket',
    description: 'Resolves multi-tier client dispute or prioritizes ticket in CRM.',
    category: 'crm',
    risk_tier: 'standard',
    requires_human_approval: false,
    parameters: [
      { name: 'ticket_id', type: 'string', description: 'CRM ticket identifier', required: true },
      { name: 'resolution_code', type: 'string', description: 'Resolution code or action taken', required: true },
      { name: 'notes', type: 'string', description: 'Tactical agent notes', required: false },
    ],
  },
  {
    id: 'inventory_sync_warehouse',
    name: 'Sync Warehouse Inventory',
    description: 'Syncs warehouse telemetry and predictive depletion model against SAP/Oracle ERP.',
    category: 'erp',
    risk_tier: 'read_only',
    requires_human_approval: false,
    parameters: [
      { name: 'warehouse_id', type: 'string', description: 'Facility identifier (e.g. WH-04)', required: true },
      { name: 'sku_prefix', type: 'string', description: 'SKU category filter', required: false },
    ],
  },
  {
    id: 'inventory_dispatch_po',
    name: 'Dispatch Vendor Purchase Order',
    description: 'Generates and dispatches replenishment purchase order to approved suppliers.',
    category: 'erp',
    risk_tier: 'sensitive',
    requires_human_approval: false,
    approval_threshold_amount: 50000,
    parameters: [
      { name: 'vendor_id', type: 'string', description: 'Vendor account identifier', required: true },
      { name: 'item_sku', type: 'string', description: 'Item stock keeping unit', required: true },
      { name: 'quantity', type: 'number', description: 'Restock unit quantity', required: true },
    ],
  },
  {
    id: 'finance_reconcile_ledger',
    name: 'Reconcile Ledger Account',
    description: 'Audits ledger entries across sub-accounts and banking gateway.',
    category: 'banking',
    risk_tier: 'read_only',
    requires_human_approval: false,
    parameters: [
      { name: 'account_id', type: 'string', description: 'Ledger account number (e.g. ACC_0941)', required: true },
      { name: 'reconciliation_window', type: 'string', description: 'Time interval to audit', required: false },
    ],
  },
  {
    id: 'finance_dispatch_payout',
    name: 'Execute Secure Wire Transfer / Payout',
    description: 'Initiates high-value fund movement or payout. Actions > $25,000 halt at perimeter for human operator biometric authorization.',
    category: 'banking',
    risk_tier: 'high_risk',
    requires_human_approval: true,
    approval_threshold_amount: 25000,
    parameters: [
      { name: 'source_account', type: 'string', description: 'Debited ledger account', required: true },
      { name: 'destination_iban', type: 'string', description: 'Target IBAN / routing number', required: true },
      { name: 'amount_usd', type: 'number', description: 'Total payout amount in USD', required: true },
      { name: 'reason', type: 'string', description: 'Transaction justification', required: true },
    ],
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return CORE_TOOLS.find((tool) => tool.id === id);
}

export function requiresHumanApproval(toolId: string, amount?: number): boolean {
  const tool = getToolById(toolId);
  if (!tool) return true; // Fail closed
  if (tool.requires_human_approval) return true;
  if (tool.approval_threshold_amount && amount !== undefined) {
    return amount > tool.approval_threshold_amount;
  }
  return false;
}
