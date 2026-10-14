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
    message: 'We received damaged transceiver units during transit via freight carrier. Need immediate restock replacement or $1,250 refund credit committed to our net-30 ledger.',
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

// Central exchange rate configuration (1 USD = 83.5 INR)
export const USD_INR_RATE = 83.5;

export function convertInrToUsd(inrAmount: number): number {
  return Math.round((inrAmount / USD_INR_RATE) * 100) / 100;
}

export function formatINR(amount: number): string {
  const intPart = Math.round(amount);
  const s = intPart.toString();
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.substring(s.length - 3);
  let remaining = s.substring(0, s.length - 3);
  const groups: string[] = [];
  while (remaining.length > 2) {
    groups.unshift(remaining.substring(remaining.length - 2));
    remaining = remaining.substring(0, remaining.length - 2);
  }
  if (remaining.length > 0) groups.unshift(remaining);
  return `₹${groups.join(',')},${last3}`;
}

export function formatDualCurrency(inrAmount: number): string {
  const usdAmount = convertInrToUsd(inrAmount);
  return `${formatINR(inrAmount)} ($${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)`;
}

export interface BusinessTransactionScenario {
  id: string;
  supplier: string;
  supplierCode: string;
  supplierAddress: string;
  hubRegion: string;
  category: string;
  policyRule: string;
  autonomousLimit: number;
  shippingFee: number;
  lineItems: Array<{
    sku: string;
    description: string;
    currentStock: number;
    minThreshold: number;
    quantity: number;
    unitPrice: number;
    extendedAmount: number;
  }>;
}

export const TRANSACTION_SCENARIOS: BusinessTransactionScenario[] = [
  // SCENARIO 01 (SCENARIO A)
  {
    id: 'SCEN-01',
    supplier: 'National Logistics Hub',
    supplierCode: 'VEND-NLH-7701',
    supplierAddress: 'Hub 04, East Logistics Corridor, Sector 18, Gurugram, HR',
    hubRegion: 'Northern Logistics Corridor (WH-04 East), Gurugram',
    category: 'Procurement & Hardware Replenishment',
    policyRule: 'RULE_POL_093',
    autonomousLimit: 14000,
    shippingFee: 800,
    lineItems: [
      { sku: 'SKU-8892-NEO', description: 'High-Bandwidth Transceiver Module 100G', currentStock: 2, minThreshold: 10, quantity: 50, unitPrice: 180, extendedAmount: 9000 },
      { sku: 'SKU-1044-CORE', description: 'Optic Switch Processor (Rev 4)', currentStock: 0, minThreshold: 5, quantity: 20, unitPrice: 300, extendedAmount: 6000 },
    ],
  },
  // SCENARIO 02 (SCENARIO B)
  {
    id: 'SCEN-02',
    supplier: 'Apex Industrial Supplies',
    supplierCode: 'VEND-APX-4412',
    supplierAddress: 'Apex Industrial Estate, Block C, Peenya Industrial Area, Bengaluru, KA',
    hubRegion: 'Southern Tech Hub (BLR-02), Peenya, Bengaluru',
    category: 'Network Infrastructure & Optics',
    policyRule: 'RULE_POL_104',
    autonomousLimit: 20000,
    shippingFee: 950,
    lineItems: [
      { sku: 'SKU-4410-NET', description: 'Industrial Gigabit Network Controller', currentStock: 3, minThreshold: 15, quantity: 25, unitPrice: 560, extendedAmount: 14000 },
      { sku: 'SKU-2291-FBR', description: 'Single-Mode Fiber SFP+ Module', currentStock: 5, minThreshold: 25, quantity: 40, unitPrice: 210, extendedAmount: 8400 },
    ],
  },
  // SCENARIO 03 (SCENARIO C)
  {
    id: 'SCEN-03',
    supplier: 'Metro Components India',
    supplierCode: 'VEND-MCI-3309',
    supplierAddress: 'MIDC Electronic Zone, Mahape, Navi Mumbai, MH',
    hubRegion: 'Western Gateway (BOM-01), Mahape, Navi Mumbai',
    category: 'Sensor Arrays & Edge Gateways',
    policyRule: 'RULE_POL_078',
    autonomousLimit: 25000,
    shippingFee: 1200,
    lineItems: [
      { sku: 'SKU-5582-SNS', description: 'Precision Thermal & Humidity Sensor Module', currentStock: 8, minThreshold: 40, quantity: 80, unitPrice: 240, extendedAmount: 19200 },
      { sku: 'SKU-3301-GTW', description: 'Tactical Edge IoT Gateway Unit', currentStock: 1, minThreshold: 8, quantity: 15, unitPrice: 720, extendedAmount: 10800 },
    ],
  },
  // SCENARIO 04
  {
    id: 'SCEN-04',
    supplier: 'Bharat Telematics Ltd',
    supplierCode: 'VEND-BTL-9921',
    supplierAddress: 'Export Promotion Industrial Park, Whitefield, Bengaluru, KA',
    hubRegion: 'Whitefield Technology Corridor (BLR-03), Bengaluru',
    category: 'Wireless Telemetry & Antennae',
    policyRule: 'RULE_POL_112',
    autonomousLimit: 22000,
    shippingFee: 850,
    lineItems: [
      { sku: 'SKU-7712-MOD', description: 'Industrial LTE-M Cellular Modem', currentStock: 4, minThreshold: 20, quantity: 30, unitPrice: 650, extendedAmount: 19500 },
      { sku: 'SKU-1109-ANT', description: 'High-Gain Omnidirectional Helical Antenna', currentStock: 12, minThreshold: 50, quantity: 60, unitPrice: 150, extendedAmount: 9000 },
    ],
  },
  // SCENARIO 05
  {
    id: 'SCEN-05',
    supplier: 'Delta Power Electronics',
    supplierCode: 'VEND-DPE-1029',
    supplierAddress: 'Okhla Industrial Cluster, Phase III, New Delhi, DL',
    hubRegion: 'Capital Distribution Hub (DEL-01), New Delhi',
    category: 'Power Distribution & Backup',
    policyRule: 'RULE_POL_088',
    autonomousLimit: 26000,
    shippingFee: 900,
    lineItems: [
      { sku: 'SKU-9904-PWR', description: 'Redundant DIN-Rail Power Supply Unit 48V', currentStock: 2, minThreshold: 12, quantity: 20, unitPrice: 820, extendedAmount: 16400 },
      { sku: 'SKU-6623-ISO', description: 'Galvanic DC-DC Optical Isolator Pack', currentStock: 6, minThreshold: 30, quantity: 45, unitPrice: 310, extendedAmount: 13950 },
    ],
  },
  // SCENARIO 06
  {
    id: 'SCEN-06',
    supplier: 'Horizon Optoelectronics',
    supplierCode: 'VEND-HOE-5510',
    supplierAddress: 'Plot 88, Electronic City Phase 1, Hosur Road, Bengaluru, KA',
    hubRegion: 'Electronic City Optics Yard (BLR-01), Bengaluru',
    category: 'Dense Multiplexers & Passive Optics',
    policyRule: 'RULE_POL_135',
    autonomousLimit: 21000,
    shippingFee: 780,
    lineItems: [
      { sku: 'SKU-6620-WDM', description: 'Dense Wavelength Division Multiplexer (DWDM)', currentStock: 7, minThreshold: 35, quantity: 35, unitPrice: 420, extendedAmount: 14700 },
      { sku: 'SKU-8819-SPL', description: 'Planar Lightwave Circuit Optical Splitter 1x16', currentStock: 14, minThreshold: 70, quantity: 70, unitPrice: 160, extendedAmount: 11200 },
    ],
  },
  // SCENARIO 07
  {
    id: 'SCEN-07',
    supplier: 'Zenith Micro Devices',
    supplierCode: 'VEND-ZMD-8834',
    supplierAddress: 'Cyber Towers, HITEC City Phase 2, Hyderabad, TS',
    hubRegion: 'HITEC City Semiconductor Hub (HYD-02), Hyderabad',
    category: 'Embedded Compute & Relays',
    policyRule: 'RULE_POL_142',
    autonomousLimit: 24000,
    shippingFee: 920,
    lineItems: [
      { sku: 'SKU-8821-MCU', description: 'Ultra-Low Power ARM Cortex MCU Board', currentStock: 15, minThreshold: 60, quantity: 100, unitPrice: 140, extendedAmount: 14000 },
      { sku: 'SKU-3112-CLK', description: 'Temperature-Compensated Crystal Oscillator', currentStock: 10, minThreshold: 40, quantity: 50, unitPrice: 190, extendedAmount: 9500 },
    ],
  },
  // SCENARIO 08
  {
    id: 'SCEN-08',
    supplier: 'Alpha Quantum Logistics',
    supplierCode: 'VEND-AQL-7123',
    supplierAddress: 'Sector 62, Noida Electronic City, Uttar Pradesh',
    hubRegion: 'NCR Thermal & Enclosure Depot (NDLS-04), Noida',
    category: 'Thermal & Enclosure Packaging',
    policyRule: 'RULE_POL_156',
    autonomousLimit: 24000,
    shippingFee: 1050,
    lineItems: [
      { sku: 'SKU-2201-ENC', description: 'IP67 Ruggedized Industrial DIN Enclosure', currentStock: 3, minThreshold: 18, quantity: 18, unitPrice: 1150, extendedAmount: 20700 },
      { sku: 'SKU-9932-FAN', description: 'High-CFM Dual Ball-Bearing Cooling Array', currentStock: 8, minThreshold: 36, quantity: 36, unitPrice: 220, extendedAmount: 7920 },
    ],
  },
  // SCENARIO 09
  {
    id: 'SCEN-09',
    supplier: 'Delta Fiber Networks',
    supplierCode: 'VEND-DFN-6641',
    supplierAddress: 'Salt Lake Sector V, Electronic Complex, Kolkata, WB',
    hubRegion: 'Eastern Interconnect Depot (CCU-01), Salt Lake, Kolkata',
    category: 'Interconnect Cabling & Attenuators',
    policyRule: 'RULE_POL_167',
    autonomousLimit: 19000,
    shippingFee: 690,
    lineItems: [
      { sku: 'SKU-7740-CAB', description: 'Armored Tactical Fiber Patch Cable 10m Duplex', currentStock: 18, minThreshold: 120, quantity: 120, unitPrice: 140, extendedAmount: 16800 },
      { sku: 'SKU-3321-ATT', description: 'Variable Optical Inline Attenuator LC/UPC', currentStock: 11, minThreshold: 50, quantity: 50, unitPrice: 190, extendedAmount: 9500 },
    ],
  },
  // SCENARIO 10
  {
    id: 'SCEN-10',
    supplier: 'Titan Switchgear Industries',
    supplierCode: 'VEND-TSI-9018',
    supplierAddress: 'GIDC Industrial Estate, Makarpura, Vadodara, Gujarat',
    hubRegion: 'Gujarat Industrial Switchgear Yard (BDQ-02), Vadodara',
    category: 'High-Voltage Protection & Switchgear',
    policyRule: 'RULE_POL_179',
    autonomousLimit: 30000,
    shippingFee: 1350,
    lineItems: [
      { sku: 'SKU-1188-BRK', description: 'Industrial Motor Circuit Breaker 63A', currentStock: 2, minThreshold: 16, quantity: 16, unitPrice: 1250, extendedAmount: 20000 },
      { sku: 'SKU-4429-SPD', description: 'Type-2 Modular Surge Protection Device', currentStock: 5, minThreshold: 30, quantity: 30, unitPrice: 480, extendedAmount: 14400 },
    ],
  },
];

let clientScenarioIdx = 0;
let clientPoCounter = 8840;
let clientReqCounter = 8841;
let clientTxnCounter = 9100;
let clientInvCounter = 7700;

export function generateClientTransactionApproval(
  missionId: string,
  userPrompt: string,
  agentCode: string = 'AGT-02',
  agentName: string = 'INVENTORY AGENT'
): ApprovalRequest {
  const scenario = TRANSACTION_SCENARIOS[clientScenarioIdx % TRANSACTION_SCENARIOS.length];
  clientScenarioIdx += 1;
  clientPoCounter += 1;
  clientReqCounter += 1;
  clientTxnCounter += 1;
  clientInvCounter += 1;

  const suffixLetter = String.fromCharCode(65 + (clientPoCounter % 26));
  const poNumber = `PO-${clientPoCounter}-${suffixLetter}`;
  const reqId = `#REQ-${clientReqCounter}-${suffixLetter}`;
  const txnId = `TXN-2026-${clientTxnCounter}`;
  const invNumber = `INV-2026-${clientInvCounter}`;
  const apprId = `appr-${Date.now()}-${clientPoCounter}`;

  let subtotal = 0;
  const lineItems = scenario.lineItems.map(it => {
    const ext = it.quantity * it.unitPrice;
    subtotal += ext;
    return {
      sku: it.sku,
      description: it.description,
      currentStock: it.currentStock,
      minThreshold: it.minThreshold,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      extendedAmount: ext,
    };
  });

  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const shipping = scenario.shippingFee;
  const total = subtotal + gst + shipping;
  const autonomousLimit = scenario.autonomousLimit;
  const varianceAmount = Math.round((total - autonomousLimit) * 100) / 100;

  const totalFormatted = formatDualCurrency(total);
  const subtotalFormatted = formatINR(subtotal);
  const gstFormatted = formatINR(gst);
  const shippingFormatted = formatINR(shipping);
  const limitFormatted = formatINR(autonomousLimit);
  const varianceFormatted = formatINR(varianceAmount);

  const breachesList = lineItems.map(
    it => `${it.sku} stock at ${it.currentStock} units (Min: ${it.minThreshold})`
  );
  const breachesText = breachesList.join(' and ');
  const description = `Critical inventory threshold breach: ${breachesText}. Automated vendor requisition drafted with approved supplier ${scenario.supplier} (${scenario.hubRegion}) to prevent fulfillment outage.`;

  const reasoningSteps = [
    `Queried ${scenario.hubRegion} telemetry matrix. Flagged threshold breaches: ${breachesList.join('; ')}.`,
    `Structured purchase requisition for ${scenario.supplier} (${scenario.supplierCode}) totaling Subtotal: ${subtotalFormatted} + GST (18%): ${gstFormatted} + Shipping: ${shippingFormatted}.`,
    `Calculated gross transaction value: ${totalFormatted} (PO: ${poNumber}, Invoice Ref: ${invNumber}).`,
    `TRIPWIRE ENGAGED: Policy ${scenario.policyRule} triggered. Total PO value ${formatINR(total)} exceeds autonomous spending threshold (${limitFormatted}) by ${varianceFormatted}. Sovereign biometric signature mandatory.`,
  ];

  const toolPayload = {
    po_number: poNumber,
    invoice_number: invNumber,
    transaction_id: txnId,
    vendor_id: scenario.supplierCode,
    supplier: scenario.supplier,
    hub_region: scenario.hubRegion,
    subtotal,
    gst,
    shipping,
    total_amount: total,
    currency: 'INR',
    autonomous_limit: autonomousLimit,
    variance: varianceAmount,
    line_items: lineItems,
    biometric_gating_tripwire: true,
  };

  return {
    id: apprId,
    requestId: reqId,
    missionId,
    agentId: agentCode,
    agentName,
    senderEmail: `${agentCode.toLowerCase()}.operations@enclave.internal`,
    recipientEmail: 'business.owner@company.internal',
    subject: `ACTION REQUIRED: Authorize Supplier Purchase Order #${poNumber} (${formatINR(total)})`,
    category: scenario.category,
    isStarred: true,
    isRead: false,
    title: `CREATE SUPPLIER PURCHASE ORDER // ${scenario.supplier.toUpperCase()}`,
    description,
    prompt: userPrompt,
    amount: total,
    amountFormatted: totalFormatted,
    autonomousLimit,
    varianceAmount,
    currency: 'INR',
    riskLevel: 'CRITICAL',
    policyRule: scenario.policyRule,
    enclaveHash: '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    status: 'PENDING',
    timestamp: 'Just now',
    reasoningSteps,
    boundTool: `netsuite_erp.draft_po (Vendor: ${scenario.supplierCode})`,
    toolPayload,
    lineItems,
    supplier: scenario.supplier,
    supplierCode: scenario.supplierCode,
    supplierAddress: scenario.supplierAddress,
    hubRegion: scenario.hubRegion,
    poNumber,
    invoiceNumber: invNumber,
    transactionId: txnId,
    subtotal,
    gst,
    shipping,
    total,
    subtotalFormatted,
    gstFormatted,
    shippingFormatted,
    limitFormatted,
    varianceFormatted,
  };
}

export function buildSeedApprovals(count: number = 6): ApprovalRequest[] {
  const seedList: ApprovalRequest[] = [];
  for (let idx = 0; idx < Math.min(count, TRANSACTION_SCENARIOS.length); idx++) {
    const scen = TRANSACTION_SCENARIOS[idx];
    const poNum = `PO-${8841 + idx}-${String.fromCharCode(65 + idx)}`;
    const reqId = `#REQ-${8841 + idx}-${String.fromCharCode(65 + idx)}`;
    const txnId = `TXN-2026-${9101 + idx}`;
    const invNum = `INV-2026-${7701 + idx}`;
    const apprId = `appr-0${idx + 1}`;

    let subtotal = 0;
    const lineItems = scen.lineItems.map(it => {
      const ext = it.quantity * it.unitPrice;
      subtotal += ext;
      return {
        sku: it.sku,
        description: it.description,
        currentStock: it.currentStock,
        minThreshold: it.minThreshold,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        extendedAmount: ext,
      };
    });

    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = scen.shippingFee;
    const total = subtotal + gst + shipping;
    const autonomousLimit = scen.autonomousLimit;
    const varianceAmount = Math.round((total - autonomousLimit) * 100) / 100;

    const totalFormatted = formatDualCurrency(total);
    const subtotalFormatted = formatINR(subtotal);
    const gstFormatted = formatINR(gst);
    const shippingFormatted = formatINR(shipping);
    const limitFormatted = formatINR(autonomousLimit);
    const varianceFormatted = formatINR(varianceAmount);

    const breachesList = lineItems.map(
      it => `${it.sku} stock at ${it.currentStock} units (Min: ${it.minThreshold})`
    );
    const breachesText = breachesList.join(' and ');
    const description = `Critical inventory threshold breach: ${breachesText}. Automated vendor requisition drafted with approved supplier ${scen.supplier} (${scen.hubRegion}) to prevent fulfillment outage.`;

    const reasoningSteps = [
      `Queried ${scen.hubRegion} telemetry matrix. Flagged threshold breaches: ${breachesList.join('; ')}.`,
      `Structured purchase requisition for ${scen.supplier} (${scen.supplierCode}) totaling Subtotal: ${subtotalFormatted} + GST (18%): ${gstFormatted} + Shipping: ${shippingFormatted}.`,
      `Calculated gross transaction value: ${totalFormatted} (PO: ${poNum}, Invoice Ref: ${invNum}).`,
      `TRIPWIRE ENGAGED: Policy ${scen.policyRule} triggered. Total PO value of ${formatINR(total)} exceeds autonomous spending threshold (${limitFormatted}) by ${varianceFormatted}. Sovereign biometric signature mandatory.`,
    ];

    const toolPayload = {
      po_number: poNum,
      invoice_number: invNum,
      transaction_id: txnId,
      vendor_id: scen.supplierCode,
      supplier: scen.supplier,
      hub_region: scen.hubRegion,
      subtotal,
      gst,
      shipping,
      total_amount: total,
      currency: 'INR',
      autonomous_limit: autonomousLimit,
      variance: varianceAmount,
      line_items: lineItems,
      biometric_gating_tripwire: true,
    };

    seedList.push({
      id: apprId,
      requestId: reqId,
      missionId: `MS-${8902 + idx}-RESTOCK`,
      agentId: 'AGT-02',
      agentName: 'INVENTORY AGENT',
      senderEmail: 'inventory.operations@enclave.internal',
      recipientEmail: 'business.owner@company.internal',
      subject: `ACTION REQUIRED: Authorize Supplier Purchase Order #${poNum} (${formatINR(total)})`,
      category: scen.category,
      isStarred: idx < 2,
      isRead: false,
      title: `CREATE SUPPLIER PURCHASE ORDER // ${scen.supplier.toUpperCase()}`,
      description,
      prompt: 'Check low-stock products and prepare a restock order.',
      amount: total,
      amountFormatted: totalFormatted,
      autonomousLimit,
      varianceAmount,
      currency: 'INR',
      riskLevel: 'CRITICAL',
      policyRule: scen.policyRule,
      enclaveHash: '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'PENDING',
      timestamp: `${14 - idx}:22:${15 + idx * 3} UTC (${idx * 3 + 2}m ago)`,
      reasoningSteps,
      boundTool: `netsuite_erp.draft_po (Vendor: ${scen.supplierCode})`,
      toolPayload,
      lineItems,
      supplier: scen.supplier,
      supplierCode: scen.supplierCode,
      supplierAddress: scen.supplierAddress,
      hubRegion: scen.hubRegion,
      poNumber: poNum,
      invoiceNumber: invNum,
      transactionId: txnId,
      subtotal,
      gst,
      shipping,
      total,
      subtotalFormatted,
      gstFormatted,
      shippingFormatted,
      limitFormatted,
      varianceFormatted,
    });
  }

  return seedList;
}

// Initial Approval Requests in Business Database
export let APPROVALS_DB: ApprovalRequest[] = buildSeedApprovals(6);

// Initial Audit Logs in System
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
    details: 'Rule POL-093 tripped: amount exceeds autonomous spending ceiling ($14,000.00)'
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
    details: 'Queried stock for WH_04_EAST. 1,420 SKUs scanned, threshold breach anomalies flagged.'
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
    timestamp: '14:15:30.881 UTC',
    agentId: 'AGT-03',
    action: 'POLICY_INTERRUPT',
    target: 'Gatehouse Supervisor Node',
    status: 'GATED',
    latencyMs: 14,
    hash: '0x9f4ce008...94c',
    details: 'Rule POL-044 tripped: disbursement exceeds autonomous ceiling ($25,000.00)'
  },
  {
    id: 'LOG-1005',
    timestamp: '14:10:45.190 UTC',
    agentId: 'AGT-01',
    action: 'BIOMETRIC_SIGN_CONFIRM',
    target: 'Enclave State Commit',
    status: '200 OK',
    latencyMs: 250,
    hash: '0x44a10022...10c',
    details: 'Operator authorized refund concession for Ticket #9042.'
  }
];

// Active Agents Configuration
export const AGENTS_CONFIG: AgentSpec[] = [
  {
    id: 'agt-01',
    code: 'AGT-01',
    name: 'CUSTOMER AGENT',
    status: 'ONLINE',
    statusBadge: 'ONLINE',
    description: 'Ingests inbound customer tickets, checks CRM databases, and drafts empathetic responses under governed rules.',
    assignedTools: ['Zendesk Bridge v2', 'CRM Context Hook', 'Stripe Refunds API', 'Slack Notifier'],
    tasksExec: 142,
    latencyMs: 28,
    vramAlloc: '380 MB',
    lastInference: {
      summary: 'Drafted dispute concession for Ticket #9042 — Policy check passed.',
      timeAgo: '4m AGO',
      confidence: '98.8%'
    },
    gatingPolicy: 'GATING: AUTO-REFUND <$500',
    enclave: 'gVisor Sandbox (#SB-881)',
    model: 'gemini-3.8-flash'
  },
  {
    id: 'agt-02',
    code: 'AGT-02',
    name: 'INVENTORY AGENT',
    status: 'ONLINE',
    statusBadge: 'ONLINE',
    description: 'Monitors inventory telemetry across warehouses, flags depleted SKUs, and drafts vendor restock purchase orders.',
    assignedTools: ['SAP S/4HANA Connector', 'NetSuite Inventory v4', 'Barcode/RFID Pipeline', 'Procurement DB'],
    tasksExec: 89,
    latencyMs: 34,
    vramAlloc: '420 MB',
    lastInference: {
      summary: 'Flagged SKU depletion in Warehouse 04 East — Restock PO structured.',
      timeAgo: '3m AGO',
      confidence: '99.9%'
    },
    gatingPolicy: 'GATING: AUTO-PO <$14K',
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
      summary: 'Drafted Supplier Wire Transfer — Halted at Gatehouse biometric perimeter awaiting Sovereign Sig.',
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
export function tool_identify_low_stock(threshold?: number) {
  const anomalies = INVENTORY_DB.filter(item => {
    if (threshold !== undefined) return item.stock <= threshold;
    return item.stock <= item.minThreshold;
  });

  return {
    status: 200,
    timestamp: new Date().toISOString(),
    total_anomalies: anomalies.length,
    critical_breaches: anomalies.filter(a => a.stock === 0).length,
    anomalies: anomalies.map(a => ({
      sku: a.sku,
      name: a.name,
      stock: a.stock,
      minThreshold: a.minThreshold,
      deficit: a.minThreshold - a.stock,
      location: a.location,
      action_recommended: a.stock === 0 ? 'EMERGENCY_REQUISITION' : 'SCHEDULED_RESTOCK'
    }))
  };
}

// TOOL 3: prepare_restock_order
export function tool_prepare_restock_order(items?: Array<{ sku: string; quantity: number }>) {
  const defaultItems = [
    { sku: 'SKU-8892-NEO', quantity: 50 },
    { sku: 'SKU-1044-CORE', quantity: 20 }
  ];

  const targetItems = items || defaultItems;
  let subtotal = 0;

  const itemDetails = targetItems.map(t => {
    const inv = INVENTORY_DB.find(i => i.sku === t.sku);
    const unitPrice = inv ? inv.unitPrice : 200.00;
    const lineTotal = unitPrice * t.quantity;
    subtotal += lineTotal;
    return {
      sku: t.sku,
      name: inv ? inv.name : 'Component',
      quantity: t.quantity,
      unitPrice,
      total: lineTotal
    };
  });

  const autonomousCeiling = 14000.00;
  const tripsThreshold = subtotal > autonomousCeiling;

  return {
    status: 200,
    timestamp: new Date().toISOString(),
    order_id: `PO-${Date.now().toString().slice(-6)}`,
    vendor: {
      id: 'VEND-NLH-7701',
      name: 'National Logistics Hub',
      hub: 'Northern Logistics Corridor (WH-04 East), Gurugram',
      sla_days: 2
    },
    items: itemDetails,
    subtotal,
    currency: 'INR',
    autonomous_limit: autonomousCeiling,
    delta: tripsThreshold ? subtotal - autonomousCeiling : 0,
    biometric_gating_tripwire: tripsThreshold,
    gating_reason: tripsThreshold
      ? `Requisition value (${formatINR(subtotal)}) exceeds autonomous spending ceiling (${formatINR(autonomousCeiling)}). Mandating human sign-off.`
      : null
  };
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
    total_enquiries: list.length,
    enquiries: list
  };
}

// TOOL 5: draft_customer_reply
export function tool_draft_customer_reply(params: {
  ticket_id: string;
  proposed_resolution: string;
  refund_amount?: number;
}) {
  const refund = params.refund_amount || 0;
  const autonomousLimit = 500.00;
  const tripsThreshold = refund > autonomousLimit;

  return {
    status: 200,
    timestamp: new Date().toISOString(),
    ticket_id: params.ticket_id,
    resolution_draft: params.proposed_resolution,
    refund_amount: refund,
    currency: 'USD',
    autonomous_limit: autonomousLimit,
    delta: tripsThreshold ? refund - autonomousLimit : 0,
    biometric_gating_tripwire: tripsThreshold,
    gating_reason: tripsThreshold
      ? `Refund concession ($${refund.toFixed(2)}) exceeds autonomous threshold ($${autonomousLimit.toFixed(2)}). Escalate to business owner.`
      : null
  };
}

// TOOL 6: create_invoice
export function tool_create_invoice(params: {
  customer_name: string;
  line_items: Array<{ description: string; amount: number }>;
}) {
  const subtotal = params.line_items.reduce((acc, curr) => acc + curr.amount, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;
  const autonomousCeiling = 25000.00;
  const tripsThreshold = total > autonomousCeiling;

  return {
    status: 200,
    timestamp: new Date().toISOString(),
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    customer: params.customer_name,
    line_items: params.line_items,
    subtotal,
    tax,
    total,
    currency: 'USD',
    autonomous_limit: autonomousCeiling,
    delta: tripsThreshold ? total - autonomousCeiling : 0,
    biometric_gating_tripwire: tripsThreshold,
    gating_reason: tripsThreshold
      ? `Invoice value ($${total.toFixed(2)}) exceeds autonomous billing ceiling ($${autonomousCeiling.toFixed(2)}). Mandatory owner sign-off.`
      : null
  };
}
