import { ExecutionEvent, ApprovalRequest, AuditLogEntry, StrategicPlan, AllocatedAgent, ExecutionPhase } from '../types';
import {
  tool_get_inventory,
  tool_identify_low_stock,
  tool_prepare_restock_order,
  tool_get_customer_enquiries,
  tool_draft_customer_reply,
  tool_create_invoice,
  APPROVALS_DB,
  AUDIT_LOGS_DB
} from './businessTools';

export interface AgentRunResult {
  missionId: string;
  pid: number;
  prompt: string;
  targetAgent: {
    id: string;
    code: string;
    name: string;
    enclave: string;
  };
  dagStages: Array<{
    step: string;
    title: string;
    subtitle: string;
    status: 'DONE' | 'HALTED_AUTH' | 'RUNNING' | 'FAILED';
    timing: string;
    metric: string;
  }>;
  events: ExecutionEvent[];
  rawKernelLogs: string[];
  haltedForApproval: boolean;
  approvalRequest?: ApprovalRequest;
  strategicPlan?: StrategicPlan;
  finalOutput?: any;
  elapsedTimeMs: number;
}

export function executeAgentWorkflow(userPrompt: string): AgentRunResult {
  const startTime = Date.now();
  const promptLower = userPrompt.toLowerCase();
  
  // Categorize task domains
  const isCustomer = promptLower.includes('customer') || promptLower.includes('enquiry') || promptLower.includes('ticket') || promptLower.includes('reply') || promptLower.includes('refund');
  const isInvoice = promptLower.includes('invoice') || promptLower.includes('billing') || promptLower.includes('wire') || promptLower.includes('payout') || promptLower.includes('tax');
  const isSecurity = promptLower.includes('security') || promptLower.includes('access') || promptLower.includes('audit') || promptLower.includes('token') || promptLower.includes('breach');
  const isMarketing = promptLower.includes('marketing') || promptLower.includes('sales') || promptLower.includes('lead') || promptLower.includes('campaign');
  
  const missionSuffix = isCustomer ? 'SUPPORT' : isInvoice ? 'FINANCE' : isSecurity ? 'SECURITY' : isMarketing ? 'GROWTH' : 'RESTOCK';
  const missionId = `MS-${Math.floor(1000 + Math.random() * 9000)}-${missionSuffix}`;
  const pid = Math.floor(90000 + Math.random() * 9999);

  // Dynamic Company AI Agent assignment
  const targetAgent = isCustomer
    ? { id: 'agt-01', code: 'AGT-01', name: 'CUSTOMER AGENT', enclave: 'gVisor Sandbox (#SB-880)' }
    : isInvoice
    ? { id: 'agt-03', code: 'AGT-03', name: 'FINANCE AGENT', enclave: 'gVisor Sandbox (#SB-883)' }
    : isSecurity
    ? { id: 'agt-04', code: 'AGT-04', name: 'CYBERSECURITY SENTINEL', enclave: 'gVisor Sandbox (#SB-884)' }
    : isMarketing
    ? { id: 'agt-05', code: 'AGT-05', name: 'GROWTH STRATEGIST', enclave: 'gVisor Sandbox (#SB-885)' }
    : { id: 'agt-02', code: 'AGT-02', name: 'INVENTORY AGENT', enclave: 'gVisor Sandbox (#SB-882)' };

  const events: ExecutionEvent[] = [];
  const rawKernelLogs: string[] = [];

  const timeStr = () => new Date().toISOString().substring(11, 23);

  // 1. INGRESS EVENT
  rawKernelLogs.push(`[${timeStr()}] [IPC-SOCKET] Handshake established with ${targetAgent.enclave}`);
  events.push({
    id: 'ev-01',
    stepNumber: 1,
    title: 'Business objective parsed',
    timestamp: timeStr(),
    status: 'DONE',
    source: 'Strategic AI Ingress',
    badge: 'INGRESS_OK',
    payloadInput: {
      prompt: userPrompt,
      urgency: 'HIGH',
      requester: 'Business Owner // Sovereign L5',
      channel: 'COMMAND_CENTER'
    }
  });

  // 2. REASONING / AGENT SELECTION
  rawKernelLogs.push(`[${timeStr()}] [AI-CORE] Strategist decomposed objective into multi-agent work allocation`);
  events.push({
    id: 'ev-02',
    stepNumber: 2,
    title: `${targetAgent.name} allocated`,
    timestamp: timeStr(),
    status: 'DONE',
    source: 'Autonomous AI Core / Enclave Sandbox',
    reasoningTrace: `Target domain parsed as ${
      isCustomer ? 'customer communication and dispute resolution' :
      isInvoice ? 'accounts receivable and financial ledger ops' :
      isSecurity ? 'cybersecurity threat prevention and access token audit' :
      isMarketing ? 'lead acquisition and marketing pipeline generation' :
      'warehouse replenishment and stock reconciliation'
    }. Routing sub-tasks to specialized company agents with boundary isolation.`
  });

  let haltedForApproval = false;
  let newApproval: ApprovalRequest | undefined;
  let finalOutput: any;

  if (isCustomer) {
    // Customer flow
    rawKernelLogs.push(`[${timeStr()}] [TOOL-RPC] Calling get_customer_enquiries()`);
    const enquiries = tool_get_customer_enquiries();
    events.push({
      id: 'ev-03',
      stepNumber: 3,
      title: 'Customer enquiries retrieved',
      timestamp: timeStr(),
      status: 'DONE',
      payloadInput: { urgency: 'HIGH' },
      payloadOutput: enquiries
    });

    rawKernelLogs.push(`[${timeStr()}] [TOOL-RPC] Calling draft_customer_reply() for Ticket #9042`);
    const reply = tool_draft_customer_reply({
      ticket_id: 'Ticket #9042',
      proposed_resolution: 'We have dispatched priority courier replacement units for SKU-8892-NEO and credited $1,250 concession to your corporate ledger account.',
      refund_amount: 1250
    });

    events.push({
      id: 'ev-04',
      stepNumber: 4,
      title: 'Customer reply drafted & reviewed',
      timestamp: timeStr(),
      status: 'DONE',
      payloadOutput: reply
    });

    if (reply.biometric_gating_tripwire) {
      haltedForApproval = true;
      rawKernelLogs.push(`[${timeStr()}] [POLICY-ENGINE] Rule POL-012 tripped: refund ($1,250) > auto limit ($500)`);
      rawKernelLogs.push(`[${timeStr()}] [PERIMETER] Emitted interrupt signal to Gatehouse supervisor node`);
      
      const reqId = `#REQ-${Math.floor(8000 + Math.random() * 999)}-C`;
      newApproval = {
        id: `appr-${Date.now()}`,
        requestId: reqId,
        missionId,
        agentId: targetAgent.code,
        agentName: targetAgent.name,
        senderEmail: 'customer.agent@enclave.internal',
        recipientEmail: 'business.owner@company.internal',
        subject: `ACTION REQUIRED: Customer Concession & Refund Authorization (#${reqId}) - $1,250.00`,
        category: 'Customer Concession',
        isStarred: true,
        isRead: false,
        title: 'EXECUTE CUSTOMER REFUND & RESOLUTION',
        description: 'Customer satisfaction concession for damaged optical transceiver units on enterprise contract. Exceeds autonomous support limit of $500.00.',
        prompt: userPrompt,
        amount: 1250,
        amountFormatted: '$1,250.00 USD (₹1,04,000)',
        autonomousLimit: 500,
        varianceAmount: 750,
        currency: 'USD',
        riskLevel: 'ELEVATED',
        policyRule: 'RULE_POL_012',
        enclaveHash: '0x' + Math.random().toString(16).substring(2, 14),
        status: 'PENDING',
        timestamp: 'Just now',
        reasoningSteps: [
          'Scanned incoming customer escalation queue (Ticket #9042).',
          'Assessed customer value score (Tier 1 enterprise contract with Nexus Corp).',
          'Drafted empathetic apology & expedited replacement dispatch.',
          'TRIPWIRE ENGAGED: Refund value $1,250 exceeds autonomous support budget ($500). Escalated to Business Owner for authorization.'
        ],
        boundTool: 'zendesk_support.issue_refund',
        toolPayload: reply
      };
      if (newApproval) APPROVALS_DB.unshift(newApproval);
    }
    finalOutput = reply;

  } else if (isInvoice) {
    // Finance flow
    rawKernelLogs.push(`[${timeStr()}] [TOOL-RPC] Calling create_invoice()`);
    const invoice = tool_create_invoice({
      customer_name: 'Cyberdyne Systems Corp',
      line_items: [
        { description: 'High-Performance Cluster Maintenance Q3', amount: 18000.00 },
        { description: 'Optic Switch Redundant Line Replacement', amount: 14000.00 }
      ]
    });

    events.push({
      id: 'ev-03',
      stepNumber: 3,
      title: 'Invoice parameters calculated',
      timestamp: timeStr(),
      status: 'DONE',
      payloadInput: { customer: 'Cyberdyne Systems', items: 2 },
      payloadOutput: invoice
    });

    if (invoice.biometric_gating_tripwire) {
      haltedForApproval = true;
      rawKernelLogs.push(`[${timeStr()}] [POLICY-ENGINE] Rule POL-044 tripped: amount ($34,800) > threshold ($25,000)`);
      rawKernelLogs.push(`[${timeStr()}] [PERIMETER] Emitted interrupt signal to Gatehouse supervisor node`);
      
      const reqId = `#REQ-${Math.floor(8000 + Math.random() * 999)}-F`;
      newApproval = {
        id: `appr-${Date.now()}`,
        requestId: reqId,
        missionId,
        agentId: targetAgent.code,
        agentName: targetAgent.name,
        senderEmail: 'finance.controller@enclave.internal',
        recipientEmail: 'business.owner@company.internal',
        subject: `ACTION REQUIRED: Commercial Invoice Sign-off (${invoice.invoice_number}) - $34,800.00`,
        category: 'Treasury & Invoicing',
        isStarred: true,
        isRead: false,
        title: 'DISPATCH COMMERCIAL INVOICE // TIER-1 CLIENT',
        description: 'Verified milestone billing for Cyberdyne Systems Corp. Total invoice value exceeds the $25,000 autonomous disbursement threshold.',
        prompt: userPrompt,
        amount: 34800,
        amountFormatted: '$34,800.00 USD (₹28,80,000)',
        autonomousLimit: 25000,
        varianceAmount: 9800,
        currency: 'USD',
        riskLevel: 'CRITICAL',
        policyRule: 'RULE_POL_044',
        enclaveHash: '0x' + Math.random().toString(16).substring(2, 14),
        status: 'PENDING',
        timestamp: 'Just now',
        reasoningSteps: [
          'Audited contracted work milestones against verified timesheets.',
          'Calculated itemized charges ($32,000 subtotal + $2,800 applicable tax).',
          'Generated Stripe Billing invoice payload with net-30 terms.',
          'TRIPWIRE ENGAGED: Invoice amount $34,800 > $25,000 threshold. Halting for Business Owner sovereign sign-off.'
        ],
        boundTool: 'stripe_billing.issue_invoice',
        toolPayload: invoice,
        lineItems: [
          { sku: 'SRV-MAINT-Q3', description: 'High-Performance Cluster Maintenance Q3', quantity: 1, unitPrice: 18000.00, extendedAmount: 18000.00 },
          { sku: 'HW-REPLACE-OPT', description: 'Optic Switch Redundant Line Replacement', quantity: 1, unitPrice: 14000.00, extendedAmount: 14000.00 }
        ]
      };
      if (newApproval) APPROVALS_DB.unshift(newApproval);
    }
    finalOutput = invoice;

  } else {
    // Default Supply Chain / Restock flow
    rawKernelLogs.push(`[${timeStr()}] [TOOL-RPC] Calling get_inventory() on Warehouse 04 East`);
    const inv: any = tool_get_inventory();
    events.push({
      id: 'ev-03',
      stepNumber: 3,
      title: 'Inventory queried across depots',
      timestamp: timeStr(),
      status: 'DONE',
      payloadInput: { facility: 'WH_04_EAST', mode: 'FULL_SCAN' },
      payloadOutput: { total_skus: inv.items_scanned || inv.inventory?.length || 4, items: inv.inventory || inv }
    });

    rawKernelLogs.push(`[${timeStr()}] [ANOMALY-DETECTION] 2 SKUs breached minimum safety thresholds`);
    const lowStockResult = tool_identify_low_stock();
    events.push({
      id: 'ev-04',
      stepNumber: 4,
      title: 'Low-stock products identified',
      timestamp: timeStr(),
      status: 'DONE',
      badge: 'ANOMALY HEURISTIC MATCH',
      anomalyData: lowStockResult.anomalies
    });

    rawKernelLogs.push(`[${timeStr()}] [TOOL-RPC] Structuring purchase order with vendor National Logistics Hub`);
    const poResult = tool_prepare_restock_order({
      vendor_id: 'VEND-LOGISTICS-77',
      line_items: [
        { sku: 'SKU-8892-NEO', quantity: 50 },
        { sku: 'SKU-1044-CORE', quantity: 20 }
      ]
    });

    events.push({
      id: 'ev-05',
      stepNumber: 5,
      title: 'Restock order prepared',
      timestamp: timeStr(),
      status: 'DONE',
      source: 'netsuite_erp.draft_purchase_order()',
      payloadInput: {
        vendor_id: 'VEND-LOGISTICS-77',
        po_number: poResult.po_number,
        line_items: poResult.line_items.map(l => ({ sku: l.sku, qty: l.quantity, price: l.unit_price })),
        total_amount: 18500.00,
        currency: 'INR'
      },
      payloadOutput: {
        po_id: poResult.po_number,
        status: 'DRAFT_PENDING_SIG',
        biometric_gating_tripwire: true,
        reason: 'EXCEEDS_AUTONOMOUS_LIMIT_14K',
        delta: '+4500.00 INR'
      }
    });

    haltedForApproval = true;
    rawKernelLogs.push(`[${timeStr()}] [POLICY-ENGINE] Rule POL-093 tripped: amount (₹18,500) > ceiling (₹14,000)`);
    rawKernelLogs.push(`[${timeStr()}] [PERIMETER] Emitted interrupt signal to Gatehouse supervisor node`);
    rawKernelLogs.push(`[${timeStr()}] [WATCHDOG] Holding container thread pending cryptographic signature...`);

    const reqId = '#REQ-8841-B';
    newApproval = {
      id: `appr-${Date.now()}`,
      requestId: reqId,
      missionId,
      agentId: 'AGT-02',
      agentName: 'INVENTORY AGENT',
      senderEmail: 'inventory.agent@enclave.internal',
      recipientEmail: 'business.owner@company.internal',
      subject: `ACTION REQUIRED: Authorize Supplier Purchase Order #PO-8841-B (₹18,500)`,
      category: 'Procurement & Logistics',
      isStarred: true,
      isRead: false,
      title: 'CREATE SUPPLIER PURCHASE ORDER // RESTOCK',
      description: 'Critical inventory threshold breach: SKU-8892-NEO stock at 2 units (Min: 10) and SKU-1044-CORE stock at 0 units. Automated vendor requisition drafted to prevent fulfillment outage across East Coast distribution hubs.',
      prompt: userPrompt,
      amount: 18500,
      amountFormatted: '₹18,500 ($34,800.00 USD)',
      autonomousLimit: 14000,
      varianceAmount: 4500,
      currency: 'INR',
      riskLevel: 'CRITICAL',
      policyRule: 'RULE_POL_093',
      enclaveHash: '0x9f4c882a46c3b21',
      status: 'PENDING',
      timestamp: 'Just now',
      reasoningSteps: [
        'Queried Warehouse 04 East via SAP Connector. Retrieved 1,420 SKUs telemetry matrix.',
        'Flagged 2 critical depletion events: SKU-8892-NEO (2 left, min 10) and SKU-1044-CORE (0 left, min 8).',
        'Calculated EOQ replenishment buffer with approved tier-1 supplier VEND-LOGISTICS-77.',
        'TRIPWIRE ENGAGED: Order total ₹18,500 exceeds autonomous ceiling (₹14,000). Action gated awaiting Business Owner authorization.'
      ],
      boundTool: 'netsuite_erp.draft_po (Scope: ledger:write)',
      toolPayload: {
        po_number: poResult.po_number,
        vendor: 'National Logistics Hub',
        total: 18500.00
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
    };
    if (newApproval) APPROVALS_DB.unshift(newApproval);
    finalOutput = poResult;
  }

  // Record immutable audit entry
  const auditEntry: AuditLogEntry = {
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: `${timeStr()} UTC`,
    agentId: targetAgent.code,
    action: haltedForApproval ? 'POLICY_INTERRUPT' : 'TOOL_RPC_EXECUTE',
    target: haltedForApproval ? 'Gatehouse Supervisor Node' : 'Enclave Destination',
    status: haltedForApproval ? 'GATED' : '200 OK',
    latencyMs: Math.floor(Date.now() - startTime),
    hash: newApproval ? newApproval.enclaveHash : '0x' + Math.random().toString(16).substring(2, 14),
    details: haltedForApproval
      ? `Perimeter halt triggered. Gated action held awaiting Business Owner authorization.`
      : `Workflow executed within autonomous policy bounds.`
  };
  AUDIT_LOGS_DB.unshift(auditEntry);

  const dagStages = [
    {
      step: '01 // INGRESS',
      title: 'BUSINESS OBJECTIVE',
      subtitle: 'Parsed Owner Prompt',
      status: 'DONE' as const,
      timing: 'T+0.00s',
      metric: '200 OK'
    },
    {
      step: '02 // KERNEL',
      title: 'STRATEGIST DECOMPOSITION',
      subtitle: `${targetAgent.name} Allocation`,
      status: 'DONE' as const,
      timing: '+0.12s',
      metric: 'TOKENS: 412'
    },
    {
      step: '03 // TOOLING',
      title: 'TOOL SELECTION',
      subtitle: isCustomer ? 'Zendesk & CRM' : isInvoice ? 'NetSuite & Stripe' : 'SAP_S4HANA & WMS',
      status: 'DONE' as const,
      timing: '+0.28s',
      metric: 'RPC BIND: 2'
    },
    {
      step: '04 // DISPATCH',
      title: 'EXECUTION',
      subtitle: isCustomer ? 'Drafted Support Macro' : isInvoice ? 'Staged Invoice Ledger' : 'Queried Stock; Draft PO',
      status: 'DONE' as const,
      timing: '+0.54s',
      metric: isCustomer ? 'CONF: 98.4%' : isInvoice ? 'LEDGER: STAGED' : 'SKUS: 2 FLAGGED'
    },
    {
      step: '05 // RESULT GATE',
      title: 'RESULT & APPROVAL',
      subtitle: haltedForApproval ? 'LIMIT EXCEEDED > CEILING' : 'COMMITTED TO SOURCE',
      status: (haltedForApproval ? 'HALTED_AUTH' : 'DONE') as 'DONE' | 'HALTED_AUTH',
      timing: '+0.82s',
      metric: haltedForApproval ? 'SHIELD LOCKED' : 'COMMIT: 200 OK'
    }
  ];

  // Dynamic Multi-Agent Strategic Plan
  const strategicPlan: StrategicPlan = {
    objective: isCustomer
      ? 'Resolve client dispute and calculate customer concession while enforcing support thresholds.'
      : isInvoice
      ? 'Compile verified commercial billing document and enforce sovereign dual-sig limits.'
      : isSecurity
      ? 'Audit infrastructure logs and isolate unauthorized access attempts.'
      : isMarketing
      ? 'Generate target account outreach strategy and allocate marketing campaign budget.'
      : 'Detect supply chain inventory depletion and stage replenishments while strictly enforcing capital gating.',
    strategicRationale: `Assigned primary responsibility to ${targetAgent.name} based on domain ontology. ${
      haltedForApproval
        ? 'Sensitive financial impact detected: Action halted at Gatehouse perimeter awaiting Business Owner confirmation.'
        : 'Routine operation: All steps scheduled for autonomous non-disruptive execution.'
    }`,
    allocatedAgents: [
      {
        agentId: targetAgent.id,
        agentCode: targetAgent.code,
        agentName: targetAgent.name,
        role: isCustomer
          ? 'Customer Dispute & Communications Officer'
          : isInvoice
          ? 'Financial Risk & Ledger Controller'
          : isSecurity
          ? 'Security Sentinel & Compliance Auditor'
          : isMarketing
          ? 'Lead Generation & Growth Specialist'
          : 'Supply Chain & Depletion Strategist',
        assignedTask: isCustomer
          ? 'Analyze incoming ticket sentiment, correlate contractual SLA terms, and stage client resolution'
          : isInvoice
          ? 'Reconcile billable ledger transactions, compute rate cards, and draft receivables commitment'
          : isSecurity
          ? 'Scan access logs, detect anomaly signatures, and draft policy quarantine'
          : isMarketing
          ? 'Qualify inbound accounts, calculate acquisition spend, and stage ad budget'
          : 'Audit warehouse telemetry, detect stock deficits across SKU matrix, and calculate buffer restock',
        boundTools: isCustomer
          ? ['Zendesk Enterprise', 'Intercom API', 'Slack Ingress']
          : isInvoice
          ? ['NetSuite CLI v2', 'Stripe Financial', 'SWIFT Highway']
          : ['SAP S/4HANA', 'Oracle ERP Cloud', 'Warehouse IoT', 'WMS Egress'],
        enclave: targetAgent.enclave,
        clearance: 'SOVEREIGN-L5',
      },
      ...(haltedForApproval
        ? [
            {
              agentId: 'agt-03',
              agentCode: 'AGT-03',
              agentName: 'FINANCE AGENT',
              role: 'Capital Commitment & Policy Guardian',
              assignedTask: 'Enforce security tripwire policy and stage transaction for Business Owner authorization',
              boundTools: ['NetSuite ERP', 'HashiCorp Vault', 'Stripe Financial'],
              enclave: 'gVisor Sandbox (#SB-883)',
              clearance: 'DUAL-SIG REQUIRED',
            },
          ]
        : []),
    ],
    executionPhases: [
      {
        phaseNumber: 1,
        phaseName: 'Semantic Ingress & Role Allocation',
        responsibleAgent: 'Gatehouse Strategic Core',
        actionDescription: `Deconstruct business prompt AST, allocate roles, and establish secure IPC sockets with ${targetAgent.name}`,
        isAutonomous: true,
      },
      {
        phaseNumber: 2,
        phaseName: 'Sandboxed Telemetry & Tool Execution',
        responsibleAgent: targetAgent.name,
        actionDescription: isCustomer
          ? 'Query Zendesk tickets and extract defect telemetry'
          : isInvoice
          ? 'Compile itemized project timesheets and calculate invoice totals'
          : 'Execute read-only stock audit on facility WH_04_EAST via SAP connector',
        isAutonomous: true,
      },
      {
        phaseNumber: 3,
        phaseName: 'Deterministic Synthesis & Solution Staging',
        responsibleAgent: targetAgent.name,
        actionDescription: isCustomer
          ? 'Draft customer reply and evaluate refund concession'
          : isInvoice
          ? 'Stage outbound invoice document with Net-30 sovereign settlement terms'
          : 'Heuristic depletion scan and staging of replenishment purchase order in dry-run sandbox',
        isAutonomous: true,
      },
      {
        phaseNumber: 4,
        phaseName: 'Business Owner Gatekeeper',
        responsibleAgent: 'Owner Approval Perimeter',
        actionDescription: haltedForApproval
          ? `Gated for human sign-off: Action value exceeds autonomous ceiling by +${newApproval?.varianceAmount}`
          : 'All steps verified within policy thresholds. Pass-through enabled.',
        isAutonomous: !haltedForApproval,
        tripwireCondition: haltedForApproval ? newApproval?.policyRule : undefined,
      },
      {
        phaseNumber: 5,
        phaseName: 'Downstream Commit & Ledger Egress',
        responsibleAgent: 'Enterprise Database Egress',
        actionDescription: 'Commit verified state downstream to enterprise database and append SHA-256 telemetry ledger entry',
        isAutonomous: true,
      },
    ],
    approvalGatingRequired: haltedForApproval,
    gatingReason: newApproval ? `Action value exceeds pre-authorized ceiling: ${newApproval.description}` : undefined,
  };

  return {
    missionId,
    pid,
    prompt: userPrompt,
    targetAgent,
    dagStages,
    events,
    rawKernelLogs,
    haltedForApproval,
    approvalRequest: newApproval,
    strategicPlan,
    finalOutput,
    elapsedTimeMs: Date.now() - startTime
  };
}
