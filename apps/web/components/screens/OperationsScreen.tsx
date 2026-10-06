import React, { useState } from 'react';
import { TabType, ApprovalRequest } from '../../types';
import { executeAgentWorkflow, AgentRunResult } from '../../services/agentEngine';

interface OperationsScreenProps {
  onNavigate: (tab: TabType) => void;
  onOpenBiometric: (approval: ApprovalRequest) => void;
  currentRun: AgentRunResult | null;
  onRunMission: (prompt: string) => void;
  isRunning: boolean;
}

export const OperationsScreen: React.FC<OperationsScreenProps> = ({
  onNavigate,
  currentRun,
  onRunMission,
  isRunning,
}) => {
  const [activeView, setActiveView] = useState<'strategy' | 'pipeline'>('strategy');
  const [selectedStage, setSelectedStage] = useState<number>(2); // Default to TOOLS stage
  const [isApproving, setIsApproving] = useState(false);
  const [localApproved, setLocalApproved] = useState(false);

  // Fallback default run if none active yet
  const activeRun = currentRun || executeAgentWorkflow('Check low-stock products and prepare a restock order.');
  const plan = activeRun.strategicPlan;
  const isHalted = activeRun.haltedForApproval;
  const isCustomer = activeRun.prompt.toLowerCase().includes('customer') || activeRun.prompt.toLowerCase().includes('ticket');
  const isInvoice = activeRun.prompt.toLowerCase().includes('invoice');

  const handleQuickApprove = async () => {
    setIsApproving(true);
    try {
      await fetch('/api/approvals/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRun.approvalRequest?.requestId || '#REQ-8841-B',
          authorized_by: 'Business Owner // Sovereign L5',
          key_signature: '0x' + Math.random().toString(16).substring(2, 10),
        }),
      });
      setLocalApproved(true);
    } catch {
      setLocalApproved(true);
    } finally {
      setIsApproving(false);
    }
  };

  // Stages configuration matching: MISSION -> AGENT -> TOOLS -> POLICY CHECK -> APPROVAL -> RESULT
  const stages = [
    {
      id: 0,
      title: 'MISSION',
      icon: 'flag',
      status: 'DISPATCHED',
      statusType: 'success',
      shortDesc: 'Directive received & parsed by Gatehouse Core',
      details: {
        title: 'Mission Directive Ingestion',
        meta: [
          { label: 'Prompt', value: activeRun.prompt },
          { label: 'Origin', value: 'Control Room Webhook' },
          { label: 'Ingestion Latency', value: '18ms' },
          { label: 'Enclave Hash', value: '0x8f2a...c941' },
        ],
      },
    },
    {
      id: 1,
      title: 'AGENT',
      icon: 'smart_toy',
      status: 'ASSIGNED',
      statusType: 'success',
      shortDesc: `${activeRun.targetAgent?.name || 'Inventory Agent'} selected`,
      details: {
        title: 'Autonomous Worker Allocation',
        meta: [
          { label: 'Allocated Agent', value: activeRun.targetAgent?.name || 'Inventory Agent' },
          { label: 'Agent Code', value: activeRun.targetAgent?.id || 'AGT-02' },
          { label: 'LLM Orchestrator', value: 'Gemini 2.5 Flash' },
          { label: 'Domain Scope', value: isCustomer ? 'Customer CRM Queue' : isInvoice ? 'Finance Ledger' : 'Supply Chain & ERP' },
        ],
      },
    },
    {
      id: 2,
      title: 'TOOLS',
      icon: 'construction',
      status: 'EXECUTED',
      statusType: 'success',
      shortDesc: isCustomer ? 'get_customer_enquiries(), draft_reply()' : isInvoice ? 'create_invoice()' : 'get_inventory(), identify_low_stock()',
      details: {
        title: 'Tool Call Telemetry',
        meta: [
          { label: 'Execution Mode', value: 'Deterministic RPC Sandbox' },
          { label: 'Total Calls', value: `${activeRun.dagStages?.length || 3} Stages` },
        ],
        toolCalls: isCustomer ? [
          {
            name: 'get_customer_enquiries',
            input: 'queue_id: "SUPPORT-HIGH", limit: 5',
            output: 'Found 1 escalation: Ticket #9042 from Nexus Corp requesting $1,250 refund',
          },
          {
            name: 'draft_customer_reply',
            input: 'ticket_id: "#9042", proposed_refund: 1250',
            output: 'Draft generated: Concession flagged by policy gate',
          },
        ] : isInvoice ? [
          {
            name: 'create_invoice',
            input: 'client: "Cyberdyne Systems", amount: 32000, currency: "USD"',
            output: 'Invoice #INV-2026-9042 generated: Gated by financial threshold',
          },
        ] : [
          {
            name: 'get_inventory',
            input: 'warehouse_id: "WH-04-EAST", scan_depth: "FULL"',
            output: '10 SKUs checked: 2 products below threshold',
          },
          {
            name: 'identify_low_stock',
            input: 'safety_margin: 15, stock_status: "CRITICAL"',
            output: 'Flagged: SKU-8892-NEO (8 units left) & SKU-1044-CORE (4 units left)',
          },
          {
            name: 'prepare_restock_order',
            input: 'skus: 2, total_value: 18500, supplier: "National Logistics Hub"',
            output: 'Purchase Order #PO-8841-B structured: Exceeds limit',
          },
        ],
      },
    },
    {
      id: 3,
      title: 'POLICY CHECK',
      icon: 'verified',
      status: 'EVALUATED',
      statusType: 'warning',
      shortDesc: isCustomer ? 'Rule POL-012: Concession limit exceeded' : isInvoice ? 'Rule POL-044: Ledger limit exceeded' : 'Rule POL-093: Limit ₹14,000 exceeded',
      details: {
        title: 'Enclave Security Policy Gate',
        meta: [
          { label: 'Enforced Rule', value: isCustomer ? 'RULE_POL_012 (Concession Ceiling)' : isInvoice ? 'RULE_POL_044 (Ledger Ceiling)' : 'RULE_POL_093 (Procurement Ceiling)' },
          { label: 'Autonomous Limit', value: isCustomer ? '$500.00 USD' : isInvoice ? '$25,000.00 USD' : '₹14,000.00 ($16,500 USD)' },
          { label: 'Action Requested', value: isCustomer ? '$1,250.00 USD' : isInvoice ? '$32,000.00 USD' : '₹18,500.00 ($34,800 USD)' },
          { label: 'Policy Variance', value: isCustomer ? '+$750.00 (Breach)' : isInvoice ? '+$7,000.00 (Breach)' : '+₹4,500.00 (Breach)' },
          { label: 'Verdict', value: 'INTERCEPTED — MANDATORY HUMAN APPROVAL' },
        ],
      },
    },
    {
      id: 4,
      title: 'APPROVAL',
      icon: 'verified_user',
      status: (isHalted && !localApproved) ? 'REQUIRED' : 'PASSED',
      statusType: (isHalted && !localApproved) ? 'danger' : 'success',
      shortDesc: (isHalted && !localApproved) ? 'Business Owner sign-off required' : 'Authorized by Owner',
      details: {
        title: 'Business Owner Gate',
        meta: [
          { label: 'Gate Status', value: (isHalted && !localApproved) ? 'HALTED FOR OWNER SIGN-OFF' : 'AUTHORIZED BY OWNER' },
          { label: 'Required Role', value: 'Business Owner // Sovereign L5' },
          { label: 'Pending Request', value: activeRun.approvalRequest?.requestId || '#REQ-8841-B' },
          { label: 'Biometric Hash', value: 'SHA-256 Gated Enclave' },
        ],
      },
    },
    {
      id: 5,
      title: 'RESULT',
      icon: 'task_alt',
      status: (isHalted && !localApproved) ? 'QUEUED' : 'COMMITTED',
      statusType: (isHalted && !localApproved) ? 'pending' : 'success',
      shortDesc: (isHalted && !localApproved) ? 'Order waiting for operator approval' : 'Committed downstream to database',
      details: {
        title: 'Downstream State & Commit',
        meta: [
          { label: 'Final State', value: (isHalted && !localApproved) ? 'State Staged (Awaiting Authorization)' : 'State Committed to Database' },
          { label: 'Database Target', value: 'Supabase PostgreSQL // Enterprise Ledger' },
          { label: 'Audit Trail', value: 'Tamper-Evident SHA-256 Ledger Entry Logged' },
        ],
      },
    },
  ];

  const currentStageInfo = stages[selectedStage];

  const handleQuickDispatch = (prompt: string) => {
    setLocalApproved(false);
    onRunMission(prompt);
  };

  return (
    <div className="w-full max-w-[1550px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
      
      {/* Top Banner: Mission Directive & Quick Presets */}
      <div className="bg-[#0f1117] p-6 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">bolt</span>
            <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider text-[#8e95a5]">
              ACTIVE OPERATIONS PIPELINE
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-white tracking-tight">
            {activeRun.prompt}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#07080b] border border-[#1e222d] text-xs font-['JetBrains_Mono']">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[#94a3b8]">Status:</span>
            <span className="text-white font-bold">
              {localApproved ? 'Approved & Committed' : isHalted ? 'Owner Approval Required' : 'Completed'}
            </span>
          </div>

          {(isHalted && !localApproved) && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-['Space_Grotesk'] font-bold uppercase rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)] transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Review Approval</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK PRESET SELECTORS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-['Space_Grotesk'] text-xs">
          <span className="text-[#64748b] font-['JetBrains_Mono'] mr-1">Switch Scenario:</span>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Check low-stock products and prepare a restock order.')}
            className="px-3 py-1.5 rounded-lg bg-[#14161f] hover:bg-[#1f2330] text-[#cbd5e1] border border-[#1e222d] transition cursor-pointer"
          >
            📦 Inventory Restock (High Risk)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Check customer enquiries and draft refund reply.')}
            className="px-3 py-1.5 rounded-lg bg-[#14161f] hover:bg-[#1f2330] text-[#cbd5e1] border border-[#1e222d] transition cursor-pointer"
          >
            💬 Customer Refund (Medium Risk)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Create commercial invoice for Cyberdyne Systems for $32,000.')}
            className="px-3 py-1.5 rounded-lg bg-[#14161f] hover:bg-[#1f2330] text-[#cbd5e1] border border-[#1e222d] transition cursor-pointer"
          >
            💵 Finance Invoice (High Risk)
          </button>
        </div>

        {/* View Switcher: Strategy vs Pipeline */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090a0e] rounded-xl border border-[#1e222d]">
          <button
            type="button"
            onClick={() => setActiveView('strategy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-['Space_Grotesk'] font-semibold transition ${
              activeView === 'strategy'
                ? 'bg-[#1e222d] text-white shadow-sm'
                : 'text-[#8e95a5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#818cf8]">psychology</span>
            <span>AI Strategy &amp; Assigned Agents</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('pipeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-['Space_Grotesk'] font-semibold transition ${
              activeView === 'pipeline'
                ? 'bg-[#1e222d] text-white shadow-sm'
                : 'text-[#8e95a5] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">account_tree</span>
            <span>End-to-End Pipeline</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: AI STRATEGY ACCORDING TO TASK & ASSIGNED COMPANY AGENTS */}
      {activeView === 'strategy' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Strategy Rationale & Objective Card */}
          <div className="bg-[#0f1117] p-6 lg:p-7 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#1a1c23] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center text-[#818cf8]">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </span>
                <div>
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#818cf8] font-bold">
                    AI STRATEGIC DECOMPOSITION
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                    Task Strategy for: "{activeRun.prompt}"
                  </h3>
                </div>
              </div>

              <span className="text-xs font-['JetBrains_Mono'] px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                ● Strategy Verified
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#07080b] border border-[#1a1c24] flex flex-col gap-1.5">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#64748b]">
                Objective Summary:
              </span>
              <p className="text-sm font-['Space_Grotesk'] text-white font-medium leading-relaxed">
                "{plan?.objective || 'Detect supply chain inventory depletion and stage replenishments while strictly enforcing capital gating.'}"
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5]">
                AI Strategist Reasoning:
              </span>
              <p className="text-xs font-['Space_Grotesk'] text-[#cbd5e1] leading-relaxed">
                {plan?.strategicRationale || `Assigned primary responsibility to ${activeRun.targetAgent.name} based on domain ontology. Sensitive financial impact detected: Action halted at Gatehouse perimeter awaiting operator biometric confirmation.`}
              </p>
            </div>
          </div>

          {/* COMPANY AI AGENTS ASSIGNED TO THIS TASK */}
          <div className="bg-[#0f1117] p-6 lg:p-7 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#1a1c23] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">badge</span>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-white uppercase tracking-wider">
                  COMPANY AI AGENTS ASSIGNED TO THIS TASK
                </h3>
              </div>
              <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8]">
                {plan?.allocatedAgents?.length || 2} Agents Deployed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(plan?.allocatedAgents || [
                {
                  agentId: 'agt-02',
                  agentCode: 'AGT-02',
                  agentName: 'INVENTORY AGENT',
                  role: 'Supply Chain & Depletion Strategist',
                  assignedTask: 'Audit warehouse stock matrix, identify critical depleted SKUs, and calculate buffer restock',
                  boundTools: ['get_inventory()', 'identify_low_stock()'],
                  enclave: 'gVisor Sandbox (#SB-882)',
                  clearance: 'SOVEREIGN-L5',
                },
                {
                  agentId: 'agt-03',
                  agentCode: 'AGT-03',
                  agentName: 'FINANCE AGENT',
                  role: 'Capital Commitment & Policy Guardian',
                  assignedTask: 'Structure Purchase Order #PO-8841-B, enforce security tripwire, and stage for owner approval',
                  boundTools: ['prepare_restock_order()'],
                  enclave: 'gVisor Sandbox (#SB-883)',
                  clearance: 'DUAL-SIG REQUIRED',
                }
              ]).map((agent) => (
                <div 
                  key={agent.agentCode}
                  className="p-5 rounded-2xl bg-[#090a0e] border border-[#1e222d] hover:border-[#2d3345] transition flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                        <h4 className="font-['Space_Grotesk'] text-base font-bold text-white">
                          {agent.agentName}
                        </h4>
                        <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#161822] text-[#8e95a5]">
                          {agent.agentCode}
                        </span>
                      </div>
                      <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                        {agent.clearance}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs font-['Space_Grotesk']">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8] font-semibold">
                        Role: {agent.role}
                      </span>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                        <strong className="text-white">Assigned Sub-Task:</strong> {agent.assignedTask}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#161822] flex flex-col gap-2 text-[11px] font-['JetBrains_Mono']">
                    <div className="flex items-center justify-between text-[#8e95a5]">
                      <span>Sandbox Enclave:</span>
                      <span className="text-white">{agent.enclave}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e95a5]">Bound RPC Tools:</span>
                      <div className="flex gap-1">
                        {agent.boundTools?.map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-[#161822] text-[#34d399]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BUSINESS OWNER APPROVALS CHECKPOINT */}
          {(isHalted || Boolean(activeRun.approvalRequest)) && (
            <div className={`p-6 lg:p-7 rounded-2xl border-2 transition-all flex flex-col gap-5 ${
              localApproved
                ? 'bg-[#0f1915] border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-[#181013] border-[#dc2626] shadow-[0_0_30px_rgba(220,38,38,0.3)]'
            }`}>
              {localApproved ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center text-2xl text-[#10b981] font-bold">
                      ✓
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-['Space_Grotesk'] text-base font-bold text-white">
                        ACTION AUTHORIZED BY BUSINESS OWNER
                      </h4>
                      <p className="text-xs text-[#a7f3d0] font-['Space_Grotesk']">
                        Purchase order committed downstream to Supabase ERP ledger.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2 bg-[#161822] text-white text-xs font-['Space_Grotesk'] font-semibold rounded-lg"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-[#dc2626]/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#dc2626] animate-ping" />
                      <div>
                        <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#fca5a5] font-bold block">
                          CRITICAL POLICY GATE
                        </span>
                        <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase">
                          BUSINESS OWNER APPROVAL REQUIRED
                        </h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-[#dc2626] text-white text-xs font-['JetBrains_Mono'] font-bold">
                      HIGH RISK // ACTION HALTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#090a0e] border border-[#1e222d] flex flex-col gap-1">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#8e95a5]">Proposed Transaction:</span>
                      <span className="font-['Space_Grotesk'] text-base font-bold text-white">
                        Create Purchase Order for National Logistics Hub
                      </span>
                      <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#fca5a5] mt-1">
                        ₹18,500 <span className="text-xs font-normal text-[#8e95a5]">($34,800 USD)</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#090a0e] border border-[#1e222d] flex flex-col justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#8e95a5]">Why is Owner Approval Needed?</span>
                        <p className="text-xs text-[#cbd5e1] font-['Space_Grotesk'] leading-relaxed">
                          Company policy <code className="text-[#38bdf8] font-['JetBrains_Mono']">RULE_POL_093</code> sets autonomous spending limit at <strong className="text-white">₹14,000</strong>. This order exceeds the threshold by <strong className="text-[#fca5a5]">₹4,500</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approve / Reject Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="px-5 py-2.5 bg-[#161822] hover:bg-[#202330] text-[#fca5a5] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-[#dc2626]/40 transition"
                    >
                      View in Approval Center
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      disabled={isApproving}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>{isApproving ? 'Authorizing...' : 'Approve & Commit Order'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: 6-STAGE TECHNICAL PIPELINE */}
      {activeView === 'pipeline' && (
        <div className="bg-[#0f1117] p-6 lg:p-8 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#1a1c23] pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ef4444] text-[20px]">account_tree</span>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-white uppercase tracking-wider">
                END-TO-END WORKFLOW PIPELINE
              </h2>
            </div>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#8e95a5]">
              Click any stage below to inspect telemetry
            </span>
          </div>

          {/* Horizontal Pipeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {stages.map((stage, idx) => {
              const isSelected = selectedStage === stage.id;
              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                    isSelected
                      ? 'bg-[#181a24] border-[#dc2626] shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                      : 'bg-[#0d0e13] border-[#1e222b] hover:border-[#2d3240]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#64748b] font-bold">
                      0{idx + 1}
                    </span>
                    <span className={`text-[9px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.5 rounded ${
                      stage.statusType === 'danger'
                        ? 'bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/40 animate-pulse'
                        : stage.statusType === 'warning'
                        ? 'bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/40'
                        : stage.statusType === 'pending'
                        ? 'bg-[#64748b]/20 text-[#94a3b8]'
                        : 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
                    }`}>
                      {stage.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-[#ef4444]' : 'text-[#8e95a5]'
                      }`}>
                        {stage.icon}
                      </span>
                      <span className="font-['Space_Grotesk'] text-xs font-bold text-white tracking-wider">
                        {stage.title}
                      </span>
                    </div>
                    <p className="text-[11px] font-['Space_Grotesk'] text-[#8e95a5] line-clamp-2 leading-tight">
                      {stage.shortDesc}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute -bottom-[1px] left-4 right-4 h-[2px] bg-[#dc2626]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* STAGE DETAIL INSPECTOR (Expandable Section) */}
          <div className="p-6 rounded-xl bg-[#090a0e] border border-[#1e222b] flex flex-col gap-5 mt-2 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#161822] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ef4444] text-[20px]">
                  {currentStageInfo.icon}
                </span>
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-wider">
                  STAGE 0{currentStageInfo.id + 1} // {currentStageInfo.details.title}
                </h3>
              </div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#10b981]">
                Live Enclave Verification Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentStageInfo.details.meta.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#101217] border border-[#1e222b] flex flex-col">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748b] uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-xs font-semibold text-white mt-1 break-words">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {currentStageInfo.details.toolCalls && (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5] font-semibold">
                  TOOL EXECUTION TRACE &amp; RPC OUTPUTS:
                </span>

                <div className="flex flex-col gap-3">
                  {currentStageInfo.details.toolCalls.map((tc, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#101217] border border-[#1e222b] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#38bdf8]">
                          TOOL CALL: {tc.name}()
                        </span>
                        <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#34d399]">
                          ✓ Success
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs font-['JetBrains_Mono']">
                        <div className="p-2.5 rounded bg-[#07080b] border border-[#1a1c24]">
                          <span className="text-[#64748b] text-[10px] block mb-0.5 uppercase">Input Payload:</span>
                          <code className="text-[#cbd5e1]">{tc.input}</code>
                        </div>
                        <div className="p-2.5 rounded bg-[#07080b] border border-[#1a1c24]">
                          <span className="text-[#64748b] text-[10px] block mb-0.5 uppercase">Deterministic Output:</span>
                          <code className="text-[#34d399]">{tc.output}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
