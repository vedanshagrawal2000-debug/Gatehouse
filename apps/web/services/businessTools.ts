import { InventoryItem, CustomerEnquiry, ApprovalRequest, ExecutionEvent, AuditLogEntry, AgentSpec } from '../types';

// Mock inventory state
export let INVENTORY_DB: InventoryItem[] = [
  {
    sku: 'SKU-8892-NEO',
    name: 'High-Bandwidth Transceiver Module 100G',
    category: 'CRITICAL_COMPONENTS',
    stock: 2,
    minThreshold: 10,
    unitPrice: 250.00,
    currency: 'USD',
    location: 'Warehouse 04 East (Aisle 12-C)',
    status: 'low',
    supplierId: 'VEND-LOGISTICS-77',
  },
  {
    sku: 'SKU-1044-CORE',
    name: 'Optic Switch Processor (Rev 4)',
    category: 'CRITICAL_COMPONENTS',
    stock: 0,
    minThreshold: 8,
    unitPrice: 300.00,
    currency: 'USD',
    location: 'Warehouse 04 East (Aisle 04-A)',
    status: 'depleted',
    supplierId: 'VEND-LOGISTICS-77',
  },
  {
    sku: 'SKU-3321-MEM',
    name: 'ECC DDR5 64GB Server DIMM',
    category: 'MEMORY_SUBSYSTEM',
    stock: 48,
    minThreshold: 15,
    unitPrice: 180.00,
    currency: 'USD',
    location: 'Warehouse 04 East (Aisle 08-B)',
    status: 'optimal',
    supplierId: 'VEND-SEMICON-02',
  },
  {
    sku: 'SKU-7709-PSU',
    name: '1600W Titanium Hot-Swap Redundant PSU',
    category: 'POWER_UNITS',
    stock: 14,
    minThreshold: 10,
    unitPrice: 320.00,
    currency: 'USD',
    location: 'Warehouse 02 West (Rack 01)',
    status: 'optimal',
    supplierId: 'VEND-POWERGRID-11',
  },
  {
    sku: 'SKU-9901-NIC',
    name: 'Dual-Port 200GbE PCIe Gen5 NIC',
    category: 'NETWORK_INTERFACE',
    stock: 4,
    minThreshold: 12,
    unitPrice: 890.00,
    currency: 'USD',
    location: 'Warehouse 04 East (Aisle 15-D)',
    status: 'low',
    supplierId: 'VEND-NETWORKS-09',
  }
];

// Mock customer enquiries
export let ENQUIRIES_DB: CustomerEnquiry[] = [
  {
    id: 'ENQ-9042',
    ticketNumber: 'Ticket #9042',
    customerName: 'Acmo Corp / Operations Division',
    customerEmail: 'ops@acmocorp.internal',
    subject: 'Damaged shipment received in Warehouse 04 (Transceiver modules)',
    message: 'We received 20x SKU-8892-NEO transceiver units damaged during transit via freight carrier. Need immediate restock replacement or $1,250 refund credit committed to our net-30 ledger.',
    urgency: 'HIGH',
    status: 'PENDING',
    timestamp: '2026-10-03 14:18:12 UTC',
  },
  {
    id: 'ENQ-9048',
    ticketNumber: 'Ticket #9048',
    customerName: 'Helios Cloud Infrastructure',
    customerEmail: 'procurement@helioscloud.io',
    subject: 'Quotation request for 40x Dual-Port 200GbE NICs',
    message: 'Looking to expand cluster rack 9. Requesting wholesale enterprise quotation with standard SLA delivery to Singapore DC.',
    urgency: 'MEDIUM',
    status: 'PENDING',
    timestamp: '2026-10-03 13:45:00 UTC',
  },
  {
    id: 'ENQ-9051',
    ticketNumber: 'Ticket #9051',
    customerName: 'Cyberdyne Systems',
    customerEmail: 'billing@cyberdyne.net',
    subject: 'Invoice clarification for Q3 server maintenance contracts',
    message: 'Please provide itemized invoice breakdown for our scheduled maintenance window on September 28.',
    urgency: 'LOW',
    status: 'PENDING',
    timestamp: '2026-10-03 12:10:20 UTC',
  }
];

// Mock initial approval requests
export let APPROVALS_DB: ApprovalRequest[] = [
  {
    id: 'appr-01',
    requestId: '#REQ-8841-B',
    missionId: 'MS-8902-RESTOCK',
    agentId: 'AGT-02',
    agentName: 'INVENTORY AGENT',
    title: 'CREATE SUPPLIER PURCHASE ORDER',
    description: 'Critical inventory threshold breach: SKU-8892-NEO stock at 2 units (Min: 10) and SKU-1044-CORE stock at 0 units. Automated vendor requisition drafted to prevent fulfillment outage across East Coast distribution hubs.',
    prompt: 'Check inventory, find low-stock products and prepare a restock order.',
    amount: 18500, // or ₹18,500 / $34,800 equiv
    amountFormatted: '₹18,500 ($34,800.00 USD)',
    autonomousLimit: 14000,
    varianceAmount: 4500,
    currency: 'USD',
    riskLevel: 'CRITICAL',
    policyRule: 'RULE_POL_093',
    enclaveHash: '0x9f4c882a46c3b21',
    status: 'PENDING',
    timestamp: '14:22:07 UTC (3m ago)',
    reasoningSteps: [
      'Queried Warehouse 04 East via SAP Connector. Retrieved 1,420 SKUs telemetry matrix.',
      'Identified critical depletion on SKU-8892-NEO (2 units remaining; safe min: 10) and SKU-1044-CORE (0 units; stockout breach).',
      'Calculated safety buffer restock: 50 units for transceiver module and 20 units for processor using wholesale SLA terms with Vendor-77.',
      'Staged purchase requisition draft #PO-8841-B in sandbox enclave for dry-run validation.',
      'TRIPWIRE ENGAGED: Calculated total PO value of ₹18,500 ($34,800 USD) exceeds autonomous agent purchase threshold (₹14,000 max). Sovereign biometric signature mandatory.'
    ],
    boundTool: 'netsuite_erp.draft_po (Scope: ledger:write)',
    toolPayload: {
      vendor_id: 'VEND-LOGISTICS-77',
      po_number: 'PO-8841-B',
      line_items: [
        { sku: 'SKU-8892-NEO', qty: 50, price: 250.00 },
        { sku: 'SKU-1044-CORE', qty: 20, price: 300.00 }
      ],
      total_amount: 18500.00,
      currency: 'USD'
    },
    lineItems: [
      {
        sku: 'SKU-8892-NEO',
        description: 'High-Bandwidth Transceiver Module 100G',
        quantity: 50,
        unitPrice: 250.00,
        extendedAmount: 12500.00
      },
      {
        sku: 'SKU-1044-CORE',
        description: 'Optic Switch Processor (Rev 4)',
        quantity: 20,
        unitPrice: 300.00,
        extendedAmount: 6000.00
      }
    ]
  },
  {
    id: 'appr-02',
    requestId: '#REQ-8839-F',
    missionId: 'MS-8901-PAYOUT',
    agentId: 'AGT-03',
    agentName: 'FINANCE AGENT',
    title: 'DISPATCH WIRE TRANSFER // HIGH VALUE PAYOUT',
    description: 'Automated supplier scheduled payment for Tier-1 Cloud Infrastructure contracts exceeding autonomous limit.',
    prompt: 'Execute scheduled monthly cloud infrastructure provider disbursement.',
    amount: 38500,
    amountFormatted: '₹3,12,000 ($38,500.00 USD)',
    autonomousLimit: 25000,
    varianceAmount: 13500,
    currency: 'USD',
    riskLevel: 'CRITICAL',
    policyRule: 'RULE_POL_044',
    enclaveHash: '0x9f4ce0082a994c',
    status: 'PENDING',
    timestamp: '14:15:30 UTC (10m ago)',
    reasoningSteps: [
      'Verified contract SLA terms against hash in HashiCorp Vault.',
      'Generated SWIFT payment payload for routing code CHASUS33.',
      'TRIPWIRE ENGAGED: Disbursal sum of $38,500 exceeds $25,000 ceiling. Halting for dual-sig confirmation.'
    ],
    boundTool: 'swift_highway.wire_transfer (Scope: wire:execute)',
    toolPayload: {
      beneficiary: 'Cloud Provider Infrastructure Inc',
      amount: 38500.00,
      routing: 'CHASUS33',
      account: 'ACC-9941-88'
    }
  },
  {
    id: 'appr-03',
    requestId: '#REQ-8835-C',
    missionId: 'MS-8899-SUPPORT',
    agentId: 'AGT-01',
    agentName: 'CUSTOMER AGENT',
    title: 'EXECUTE DIRECT REFUND CREDIT',
    description: 'Customer satisfaction refund credit for Ticket #9042 damaged parcel.',
    prompt: 'Authorize $15.00 partial shipping concession for damaged packaging.',
    amount: 15,
    amountFormatted: '₹1,250 ($15.00 USD)',
    autonomousLimit: 50,
    varianceAmount: 0,
    currency: 'USD',
    riskLevel: 'MODERATE',
    policyRule: 'RULE_POL_012',
    enclaveHash: '0x44a100223910c',
    status: 'APPROVED',
    timestamp: '14:10:02 UTC',
    approvedBy: 'ADM-01',
    approvedAt: '14:10:45 UTC',
    reasoningSteps: [
      'Customer sentiment verified > 95%.',
      'Value within Level 1 micro-policy ceiling.',
      'Credit committed to Stripe balance.'
    ],
    boundTool: 'stripe.refunds.create (Scope: refunds:write)',
    toolPayload: {
      customer: 'Acmo Corp',
      amount: 15.00
    }
  }
];

export let AUDIT_LOGS_DB: AuditLogEntry[] = [
  {
    id: 'LOG-1001',
    timestamp: '14:22:08.012 UTC',
    agentId: 'AGT-02',
    action: 'POLICY_INTERRUPT',
    target: 'Gatehouse Supervisor Node',
    status: 'GATED',
    latencyMs: 12,
    hash: '0x9f4c882a...b21',
    details: 'Rule POL-093 tripped: amount ($34,800.00) exceeds autonomous ceiling ($25,000.00)'
  },
  {
    id: 'LOG-1002',
    timestamp: '14:20:44.112 UTC',
    agentId: 'AGT-02',
    action: 'TOOL_RPC: query_stock_levels',
    target: 'SAP S/4HANA Connector',
    status: '200 OK',
    latencyMs: 18,
    hash: '0x44a10992...e11',
    details: 'Queried stock for WH_04_EAST. 1,420 SKUs scanned, 2 depleted anomalies flagged.'
  },
  {
    id: 'LOG-1003',
    timestamp: '14:18:12.420 UTC',
    agentId: 'AGT-01',
    action: 'TOOL_RPC: generate_resolution_macro',
    target: 'Zendesk Enterprise Bridge',
    status: '200 OK',
    latencyMs: 420,
    hash: '0x88f12a01...99c',
    details: 'Drafted resolution response for Ticket #9042 with 98.4% satisfaction confidence.'
  },
  {
    id: 'LOG-1004',
    timestamp: '14:15:00.812 UTC',
    agentId: 'AGT-03',
    action: 'KEY_REQUEST: request_ephemeral_token',
    target: 'HashiCorp Vault',
    status: 'AUDITED',
    latencyMs: 9,
    hash: '0x22c4a919...01e',
    details: 'Issued 300s TTL token for ADM-01 role via AES-256-GCM enclave tunnel.'
  },
  {
    id: 'LOG-1005',
    timestamp: '14:02:11.200 UTC',
    agentId: 'AGT-02',
    action: 'CACHE_SYNC: fetch_reorder_point',
    target: 'Oracle ERP Cloud',
    status: '200 OK',
    latencyMs: 12,
    hash: '0x12c988aa...fa3',
    details: 'Sync Batch #441 committed 1.4KB payload for Warehouse 04 reorder calculations.'
  }
];

export const AGENT_REGISTRY: AgentSpec[] = [
  {
    id: 'agt-01',
    code: 'AGT-01',
    name: 'CUSTOMER AGENT',
    status: 'ONLINE',
    statusBadge: 'ONLINE',
    description: 'Handles customer enquiries and prepares context-aware customer responses autonomously.',
    assignedTools: ['Zendesk Enterprise', 'Intercom API', 'Slack Ingress', 'Vector Base (Faiss)'],
    tasksExec: 142,
    latencyMs: 18,
    vramAlloc: '420 MB',
    lastInference: {
      summary: 'Drafted refund resolution for Ticket #9042 — customer satisfaction confidence 98.4%.',
      timeAgo: '42s AGO',
      confidence: '98.4%'
    },
    gatingPolicy: 'GATING: MICRO-POLICY',
    enclave: 'gVisor Sandbox (#SB-880)',
    model: 'gemini-3.8-flash'
  },
  {
    id: 'agt-02',
    code: 'AGT-02',
    name: 'INVENTORY AGENT',
    status: 'SYNC ACTIVE',
    statusBadge: 'SYNC ACTIVE',
    description: 'Checks inventory levels, autonomously detects low stock, and dispatches restock purchase orders.',
    assignedTools: ['SAP S/4HANA', 'Oracle ERP Cloud', 'Warehouse IoT', 'WMS Egress'],
    tasksExec: 89,
    latencyMs: 8,
    vramAlloc: '610 MB',
    lastInference: {
      summary: 'Triggered reorder calculation for SKU_8892 (Stock: 2 units, Threshold: 10 units) in Warehouse 04.',
      timeAgo: '3m AGO',
      confidence: '99.9%'
    },
    gatingPolicy: 'GATING: AUTO-PO <$10K',
    enclave: 'gVisor Sandbox (#SB-882)',
    model: 'gemini-3.8-flash'
  },
  {
    id: 'agt-03',
    code: 'AGT-03',
    name: 'FINANCE AGENT',
    status: 'GATE HALTED',
    statusBadge: 'GATE HALTED',
    description: 'Prepares invoices and orchestrates capital requests requiring deterministic dual-sig approval.',
    assignedTools: ['NetSuite CLI v2', 'Stripe Financial', 'SWIFT Highway', 'Audit Vault'],
    tasksExec: 37,
    latencyMs: 19,
    vramAlloc: '540 MB',
    lastInference: {
      summary: 'Drafted PO #8841-B Wire ($34,800.00) — Halted at Gatehouse biometric perimeter awaiting Sovereign Sig.',
      timeAgo: '1m AGO',
      confidence: '100%'
    },
    gatingPolicy: 'GATING: BIOMETRIC >$25K',
    enclave: 'gVisor Sandbox (#SB-883)',
    model: 'gemini-3.8-flash'
  }
];

// TOOL 1: get_inventory
export function tool_get_inventory(params?: { warehouse_id?: string; category?: string }) {
  let items = [...INVENTORY_DB];
  if (params?.category && params.category !== 'ALL') {
    items = items.filter(i => i.category.toLowerCase().includes(params.category!.toLowerCase()));
  }
  return {
    status: 200,
    timestamp: new Date().toISOString(),
    facility_id: params?.warehouse_id || 'WH_04_EAST',
    items_scanned: 1420,
    total_returned: items.length,
    inventory: items
  };
}

// TOOL 2: identify_low_stock
export function tool_identify_low_stock(params?: { buffer_percentage?: number }) {
  const buffer = params?.buffer_percentage ?? 0.20;
  const flagged = INVENTORY_DB.filter(item => item.stock <= (item.minThreshold * (1 + buffer)));
  
  return {
    status: 200,
    timestamp: new Date().toISOString(),
    total_flagged: flagged.length,
    flagged_skus: flagged.map(f => f.sku),
    anomalies: flagged.map(item => ({
      sku: item.sku,
      name: item.name,
      stock: item.stock,
      min_threshold: item.minThreshold,
      deficit: Math.max(0, item.minThreshold - item.stock),
      recommended_reorder_qty: Math.max(item.minThreshold * 2, 20),
      urgency: item.stock === 0 ? 'CRITICAL_DEPLETED' : 'ELEVATED_DEPLETION',
      supplier_id: item.supplierId,
      unit_price: item.unitPrice
    }))
  };
}

// TOOL 3: prepare_restock_order
export function tool_prepare_restock_order(params: {
  vendor_id?: string;
  line_items?: Array<{ sku: string; quantity: number }>;
}) {
  const defaultItems = [
    { sku: 'SKU-8892-NEO', quantity: 50 },
    { sku: 'SKU-1044-CORE', quantity: 20 }
  ];

  const itemsToOrder = params?.line_items && params.line_items.length > 0 ? params.line_items : defaultItems;
  
  let calculatedTotal = 0;
  const detailedLines = itemsToOrder.map(req => {
    const item = INVENTORY_DB.find(i => i.sku === req.sku);
    const unitPrice = item ? item.unitPrice : 250.00;
    const ext = unitPrice * req.quantity;
    calculatedTotal += ext;
    return {
      sku: req.sku,
      description: item ? item.name : 'Component Restock Requisition',
      quantity: req.quantity,
      unit_price: unitPrice,
      extended_amount: ext
    };
  });

  const poNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}-B`;
  const autonomousThreshold = 14000; // ₹14,000 / $10,000 limit
  const requiresApproval = calculatedTotal > autonomousThreshold;

  const result = {
    po_number: poNumber,
    vendor_id: params?.vendor_id || 'VEND-LOGISTICS-77',
    facility_id: 'WH_04_EAST',
    line_items: detailedLines,
    total_amount: calculatedTotal,
    currency: 'USD',
    autonomous_limit: autonomousThreshold,
    variance: requiresApproval ? calculatedTotal - autonomousThreshold : 0,
    status: requiresApproval ? 'DRAFT_PENDING_SIG' : 'COMMITTED_AUTO',
    biometric_gating_tripwire: requiresApproval,
    reason: requiresApproval ? 'EXCEEDS_AUTONOMOUS_LIMIT_25K' : 'WITHIN_POLICY_LIMITS',
    enclave_hash: '0x' + Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')
  };

  return result;
}

// TOOL 4: get_customer_enquiries
export function tool_get_customer_enquiries(params?: { urgency?: string; status?: string }) {
  let list = [...ENQUIRIES_DB];
  if (params?.urgency) {
    list = list.filter(e => e.urgency === params.urgency);
  }
  if (params?.status) {
    list = list.filter(e => e.status === params.status);
  }
  return {
    status: 200,
    timestamp: new Date().toISOString(),
    count: list.length,
    enquiries: list
  };
}

// TOOL 5: draft_customer_reply
export function tool_draft_customer_reply(params: {
  ticket_id: string;
  proposed_resolution: string;
  refund_amount?: number;
}) {
  const enquiry = ENQUIRIES_DB.find(e => e.id === params.ticket_id || e.ticketNumber.includes(params.ticket_id));
  const refund = params.refund_amount ?? 0;
  const requiresApproval = refund > 500;

  return {
    status: 200,
    ticket_id: params.ticket_id,
    customer: enquiry ? enquiry.customerName : 'Client',
    drafted_response: `Dear Customer,\n\nRegarding your enquiry, we have reviewed your ticket. ${params.proposed_resolution}\n${refund > 0 ? `A refund credit in the amount of $${refund.toFixed(2)} has been staged to your ledger account.` : ''}\n\nSincerely,\nGATEHOUSE Tactical Operations Core`,
    satisfaction_confidence: 0.984,
    refund_amount: refund,
    biometric_gating_tripwire: requiresApproval,
    reason: requiresApproval ? 'REFUND_EXCEEDS_500_LIMIT' : 'PRE_APPROVED_MICRO_POLICY'
  };
}

// TOOL 6: create_invoice
export function tool_create_invoice(params: {
  customer_name: string;
  line_items: Array<{ description: string; amount: number }>;
  currency?: string;
  due_date?: string;
}) {
  const total = params.line_items.reduce((acc, curr) => acc + curr.amount, 0);
  const requiresApproval = total > 25000;
  const invNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

  return {
    invoice_number: invNumber,
    customer_name: params.customer_name,
    date: new Date().toISOString().split('T')[0],
    due_date: params.due_date || 'Net-30',
    line_items: params.line_items,
    total_amount: total,
    currency: params.currency || 'USD',
    status: requiresApproval ? 'LOCKED_AWAITING_APPROVAL' : 'ISSUED',
    biometric_gating_tripwire: requiresApproval,
    reason: requiresApproval ? 'INVOICE_EXCEEDS_25K_DUAL_SIG' : 'STANDARD_ISSUANCE'
  };
}
