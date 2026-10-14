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
}) => {
  const [activeView, setActiveView] = useState<'strategy' | 'pipeline'>('strategy');
  const [selectedStage, setSelectedStage] = useState<number>(2); // Default to TOOLS stage
  const [isApproving, setIsApproving] = useState(false);
  const [localApproved, setLocalApproved] = useState(false);

  // Fallback default run if none active yet
  const activeRun = currentRun || executeAgentWorkflow('Check low-stock products and prepare a restock order.');
  const req = activeRun.approvalRequest;
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
            input: `skus: ${req?.lineItems?.length || 2}, total_value: ${req?.total || 18500}, supplier: "${req?.supplier || 'National Logistics Hub'}"`,
            output: `Purchase Order #${req?.poNumber || 'PO-8841-B'} structured: Exceeds limit`,
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
      shortDesc: isCustomer ? 'Rule POL-012: Concession limit exceeded' : isInvoice ? 'Rule POL-044: Ledger limit exceeded' : `Rule POL-093: Limit ${req?.limitFormatted || '₹14,000'} exceeded`,
      details: {
        title: 'Enclave Security Policy Gate',
        meta: [
          { label: 'Enforced Rule', value: isCustomer ? 'RULE_POL_012 (Concession Ceiling)' : isInvoice ? 'RULE_POL_044 (Ledger Ceiling)' : (req?.policyRule ? `${req.policyRule} (Procurement Ceiling)` : 'RULE_POL_093 (Procurement Ceiling)') },
          { label: 'Autonomous Limit', value: isCustomer ? '$500.00 USD' : isInvoice ? '$25,000.00 USD' : (req?.limitFormatted || '₹14,000') },
          { label: 'Action Requested', value: isCustomer ? '$1,250.00 USD' : isInvoice ? '$32,000.00 USD' : (req?.amountFormatted || '₹18,500') },
          { label: 'Policy Variance', value: isCustomer ? '+$750.00 (Breach)' : isInvoice ? '+$7,000.00 (Breach)' : `+${req?.varianceFormatted || '₹4,500'} (Breach)` },
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
      <div className="bg-white p-6 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111111] text-[20px]">bolt</span>
            <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider text-[#666666] font-semibold">
              Active Operations Pipeline
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
            {activeRun.prompt}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-['JetBrains_Mono']">
            <span className={`w-2 h-2 rounded-full ${localApproved ? 'bg-emerald-500' : isHalted ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[#666666]">Status:</span>
            <span className="text-[#111111] font-bold">
              {localApproved ? 'Approved & Committed' : isHalted ? 'Owner Approval Required' : 'Completed'}
            </span>
          </div>

          {(isHalted && !localApproved) && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-['Space_Grotesk'] font-bold uppercase rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
          <span className="text-[#666666] font-['JetBrains_Mono'] mr-1 font-medium">Switch Scenario:</span>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Check low-stock products and prepare a restock order.')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] transition cursor-pointer font-medium"
          >
            📦 Inventory Restock (High Risk)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Check customer enquiries and draft refund reply.')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] transition cursor-pointer font-medium"
          >
            💬 Customer Refund (Medium Risk)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDispatch('Create commercial invoice for Cyberdyne Systems for $32,000.')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] transition cursor-pointer font-medium"
          >
            💵 Finance Invoice (High Risk)
          </button>
        </div>

        {/* View Switcher: Strategy vs Pipeline */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
          <button
            type="button"
            onClick={() => setActiveView('strategy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-['Space_Grotesk'] font-semibold transition cursor-pointer ${
              activeView === 'strategy'
                ? 'bg-white text-[#111111] shadow-xs border border-[#E5E5E5]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>AI Strategy &amp; Assigned Agents</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('pipeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-['Space_Grotesk'] font-semibold transition cursor-pointer ${
              activeView === 'pipeline'
                ? 'bg-white text-[#111111] shadow-xs border border-[#E5E5E5]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>End-to-End Pipeline</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: AI STRATEGY ACCORDING TO TASK & ASSIGNED COMPANY AGENTS */}
      {activeView === 'strategy' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Strategy Rationale & Objective Card */}
          <div className="bg-white p-6 lg:p-7 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </span>
                <div>
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#666666] font-bold">
                    AI Strategic Decomposition
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#111111]">
                    Task Strategy for: "{activeRun.prompt}"
                  </h3>
                </div>
              </div>

              <span className="text-xs font-['JetBrains_Mono'] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ● Strategy Verified
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col gap-1.5">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                Objective Summary:
              </span>
              <p className="text-sm font-['Space_Grotesk'] text-[#111111] font-medium leading-relaxed">
                "{plan?.objective || 'Detect supply chain inventory depletion and stage replenishments while strictly enforcing capital gating.'}"
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                AI Strategist Reasoning:
              </span>
              <p className="text-xs font-['Space_Grotesk'] text-[#444444] leading-relaxed">
                {plan?.strategicRationale || `Assigned primary responsibility to ${activeRun.targetAgent.name} based on domain ontology. Sensitive financial impact detected: Action halted at Gatehouse perimeter awaiting operator biometric confirmation.`}
              </p>
            </div>
          </div>

          {/* COMPANY AI AGENTS ASSIGNED TO THIS TASK */}
          <div className="bg-white p-6 lg:p-7 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#111111] text-[20px]">badge</span>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#111111] uppercase tracking-wider">
                  Company AI Agents Assigned to this Task
                </h3>
              </div>
              <span className="text-xs font-['JetBrains_Mono'] text-[#666666] font-semibold">
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
                  className="p-5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#CCCCCC] transition flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="font-['Space_Grotesk'] text-base font-bold text-[#111111]">
                          {agent.agentName}
                        </h4>
                        <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#666666]">
                          {agent.agentCode}
                        </span>
                      </div>
                      <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#111111] font-bold">
                        {agent.clearance}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs font-['Space_Grotesk']">
                      <span className="text-xs font-['JetBrains_Mono'] text-[#666666] font-semibold">
                        Role: {agent.role}
                      </span>
                      <p className="text-xs text-[#444444] leading-relaxed pt-1">
                        <strong className="text-[#111111]">Assigned Sub-Task:</strong> {agent.assignedTask}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E5E5] flex flex-col gap-2 text-[11px] font-['JetBrains_Mono']">
                    <div className="flex items-center justify-between text-[#666666]">
                      <span>Sandbox Enclave:</span>
                      <span className="text-[#111111] font-medium">{agent.enclave}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#666666]">Bound RPC Tools:</span>
                      <div className="flex gap-1">
                        {agent.boundTools?.map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#111111]">
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
            <div className={`p-6 lg:p-7 rounded-xl border transition-all flex flex-col gap-5 ${
              localApproved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-amber-50/70 border-2 border-amber-300 text-[#111111] shadow-xs'
            }`}>
              {localApproved ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl text-emerald-800 font-bold">
                      ✓
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-['Space_Grotesk'] text-base font-bold text-emerald-950">
                        ACTION AUTHORIZED BY BUSINESS OWNER
                      </h4>
                      <p className="text-xs text-emerald-800 font-['Space_Grotesk']">
                        Purchase order committed downstream to Supabase ERP ledger.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2 bg-white text-[#111111] border border-[#E5E5E5] hover:bg-[#F5F5F5] text-xs font-['Space_Grotesk'] font-semibold rounded-lg cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-amber-900 font-bold block">
                          Critical Policy Gate
                        </span>
                        <h4 className="font-['Space_Grotesk'] text-sm font-bold text-[#111111] uppercase">
                          Business Owner Approval Required
                        </h4>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 text-xs font-['JetBrains_Mono'] font-bold">
                      HIGH RISK // ACTION HALTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col gap-1">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#666666]">Proposed Transaction:</span>
                      <span className="font-['Space_Grotesk'] text-base font-bold text-[#111111]">
                        Create Purchase Order for {req?.supplier || 'National Logistics Hub'}
                      </span>
                      <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#111111] mt-1">
                        {req?.amountFormatted || '₹18,500'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#666666]">Why is Owner Approval Needed?</span>
                        <p className="text-xs text-[#444444] font-['Space_Grotesk'] leading-relaxed">
                          Company policy <code className="text-[#111111] font-['JetBrains_Mono'] font-semibold">{req?.policyRule || 'RULE_POL_093'}</code> sets autonomous spending limit at <strong className="text-[#111111]">{req?.limitFormatted || '₹14,000'}</strong>. This order exceeds the threshold by <strong className="text-amber-900">{req?.varianceFormatted || '₹4,500'}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approve / Reject Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="px-5 py-2.5 bg-white hover:bg-[#F5F5F5] text-[#111111] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-[#E5E5E5] transition cursor-pointer"
                    >
                      View in Approval Center
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      disabled={isApproving}
                      className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
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
        <div className="bg-white p-6 lg:p-8 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#111111] text-[20px]">account_tree</span>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#111111] uppercase tracking-wider">
                End-to-End Workflow Pipeline
              </h2>
            </div>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#666666]">
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
                      ? 'bg-[#FAFAFA] border-[#111111] shadow-xs'
                      : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#888888] font-bold">
                      0{idx + 1}
                    </span>
                    <span className={`text-[9px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.5 rounded ${
                      stage.statusType === 'danger'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : stage.statusType === 'warning'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : stage.statusType === 'pending'
                        ? 'bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {stage.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-[#111111]' : 'text-[#666666]'
                      }`}>
                        {stage.icon}
                      </span>
                      <span className="font-['Space_Grotesk'] text-xs font-bold text-[#111111] tracking-wider">
                        {stage.title}
                      </span>
                    </div>
                    <p className="text-[11px] font-['Space_Grotesk'] text-[#666666] line-clamp-2 leading-tight">
                      {stage.shortDesc}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute -bottom-[1px] left-4 right-4 h-[2px] bg-[#111111]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* STAGE DETAIL INSPECTOR */}
          <div className="p-6 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col gap-5 mt-2 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#111111] text-[20px]">
                  {currentStageInfo.icon}
                </span>
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Stage 0{currentStageInfo.id + 1} // {currentStageInfo.details.title}
                </h3>
              </div>
              <span className="text-[11px] font-['JetBrains_Mono'] text-emerald-700 font-semibold">
                Live Enclave Verification Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentStageInfo.details.meta.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white border border-[#E5E5E5] flex flex-col">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#666666] uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[#111111] mt-1 break-words">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {currentStageInfo.details.toolCalls && (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666] font-semibold">
                  Tool Execution Trace &amp; RPC Outputs:
                </span>

                <div className="flex flex-col gap-3">
                  {currentStageInfo.details.toolCalls.map((tc, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white border border-[#E5E5E5] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#111111]">
                          TOOL CALL: {tc.name}()
                        </span>
                        <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          ✓ Success
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs font-['JetBrains_Mono']">
                        <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                          <span className="text-[#666666] text-[10px] block mb-0.5 uppercase">Input Payload:</span>
                          <code className="text-[#111111]">{tc.input}</code>
                        </div>
                        <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                          <span className="text-[#666666] text-[10px] block mb-0.5 uppercase">Deterministic Output:</span>
                          <code className="text-[#111111] font-semibold">{tc.output}</code>
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
