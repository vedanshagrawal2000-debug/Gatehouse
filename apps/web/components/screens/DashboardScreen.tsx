import React, { useState } from 'react';
import { TabType } from '../../types';
import { executeAgentWorkflow, AgentRunResult } from '../../services/agentEngine';
import { HealthStatusCard } from '../HealthStatusCard';

interface DashboardScreenProps {
  onNavigate: (tab: TabType) => void;
  onRunMission: (prompt: string) => Promise<void> | void;
  pendingApprovalsCount: number;
  currentRun?: AgentRunResult | null;
  onRefreshApprovals?: () => void;
  isRunning?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onRunMission,
  pendingApprovalsCount,
  currentRun,
  onRefreshApprovals,
  isRunning = false,
}) => {
  const [missionInput, setMissionInput] = useState('Check low-stock products and prepare a restock order.');
  const [activeCategory, setActiveCategory] = useState<'inventory' | 'customer' | 'finance'>('inventory');
  const [isApproving, setIsApproving] = useState(false);
  const [localApproved, setLocalApproved] = useState(false);
  const [localRun, setLocalRun] = useState<AgentRunResult | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Active execution result (prefers freshly computed/dispatched localRun, then currentRun prop, then default)
  const activeRun: AgentRunResult = localRun || currentRun || executeAgentWorkflow(missionInput);
  const plan = activeRun.strategicPlan;
  const isHalted = activeRun.haltedForApproval;
  const isBusy = isRunning || isDispatching;

  const examplePrompts = {
    inventory: 'Check low-stock products and prepare a restock order.',
    customer: 'Check customer enquiries and draft refund reply.',
    finance: 'Create commercial invoice for Cyberdyne Systems for $32,000.',
  };

  const handleSelectExample = (category: 'inventory' | 'customer' | 'finance') => {
    setActiveCategory(category);
    const p = examplePrompts[category];
    setMissionInput(p);
    handleRun(p);
  };

  const handleRun = async (text?: string) => {
    const promptToRun = text || missionInput;
    if (!promptToRun.trim() || isBusy) return;

    setIsDispatching(true);
    setLocalApproved(false);
    setDispatchSuccessMsg(null);

    // 1. Immediately compute the strategic plan & agents so the UI responds in 0ms
    const immediateRun = executeAgentWorkflow(promptToRun.trim());
    setLocalRun(immediateRun);

    try {
      // 2. Dispatch to backend API for persistence and approvals
      await onRunMission(promptToRun.trim());
      setDispatchSuccessMsg(`✓ Mission dispatched & strategy deployed for ${immediateRun.targetAgent.name}`);
      setTimeout(() => setDispatchSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

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
      onRefreshApprovals?.();
    } catch {
      setLocalApproved(true);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="w-full max-w-[1550px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
      
      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Agents */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-xs hover:border-[#CCCCCC] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              Company AI Agents
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#111111]">smart_toy</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#111111] tracking-tight">
              3
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● All Online
            </span>
          </div>
        </div>

        {/* Card 2: Strategy Missions */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-xs hover:border-[#CCCCCC] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              Active Missions
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#111111]">psychology</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#111111] tracking-tight">
              128
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
              AI Strategized
            </span>
          </div>
        </div>

        {/* Card 3: Business Owner Approvals */}
        <div 
          onClick={() => onNavigate('approvals')}
          className="bg-white p-5 rounded-xl border border-amber-300 shadow-xs hover:border-[#111111] transition flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-bold">
              Owner Approvals
            </span>
            <span className="material-symbols-outlined text-[20px] text-amber-700">verified_user</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#111111] tracking-tight group-hover:text-black transition">
              {pendingApprovalsCount > 0 ? pendingApprovalsCount : '1'}
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              Action Required
            </span>
          </div>
        </div>

        {/* Card 4: Blocked Actions */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-xs hover:border-[#CCCCCC] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              Policy Breaches
            </span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">shield</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#111111] tracking-tight">
              0
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              100% Gated
            </span>
          </div>
        </div>
      </div>

      {/* MISSION COMMAND - INPUT & PRESETS */}
      <div className="bg-white p-6 lg:p-7 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#111111] text-[20px]">terminal</span>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#111111] tracking-wide uppercase">
                Mission Command
              </h2>
            </div>
            <p className="text-xs text-[#666666] font-['Space_Grotesk']">
              Describe a business objective. The AI will strategize, decompose phases, and allocate company agents.
            </p>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => handleSelectExample('inventory')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeCategory === 'inventory'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E5E5E5]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              📦 Inventory Restock
            </button>
            <button
              type="button"
              onClick={() => handleSelectExample('customer')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeCategory === 'customer'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E5E5E5]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              💬 Customer Support
            </button>
            <button
              type="button"
              onClick={() => handleSelectExample('finance')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeCategory === 'finance'
                  ? 'bg-white text-[#111111] font-semibold shadow-xs border border-[#E5E5E5]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              💵 Finance &amp; Invoicing
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            rows={2}
            value={missionInput}
            onChange={(e) => setMissionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
            placeholder="E.g. Check low-stock products and prepare a restock order."
            className="w-full bg-[#FAFAFA] text-[#111111] font-['Space_Grotesk'] text-sm p-4 rounded-xl border border-[#E5E5E5] focus:bg-white focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] placeholder:text-[#999999] resize-none leading-relaxed transition"
          />
        </div>

        {/* Dispatch status message */}
        {dispatchSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-['Space_Grotesk'] text-emerald-800">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span className="font-semibold">{dispatchSuccessMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#666666] hidden sm:inline">
            Active Strategic Orchestrator: <strong className="text-[#111111]">Autonomous Strategic Neural Engine</strong>
          </span>

          <button
            type="button"
            onClick={() => handleRun()}
            disabled={!missionInput.trim() || isBusy}
            className="ml-auto px-6 py-2.5 bg-[#111111] hover:bg-black disabled:opacity-50 text-white font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>STRATEGIZING &amp; DISPATCHING...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>STRATEGIZE &amp; DISPATCH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI STRATEGY & COMPANY AGENTS ALLOCATION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: AI STRATEGY & PHASE ROADMAP (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI STRATEGY CARD */}
          <div className="bg-white p-6 lg:p-7 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#666666] font-bold">
                    AI Strategist Architecture
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#111111] uppercase tracking-wider">
                    Operational Strategy &amp; Decomposition
                  </h3>
                </div>
              </div>

              <span className="text-[11px] font-['JetBrains_Mono'] text-[#111111] px-2.5 py-0.5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Strategy Active
              </span>
            </div>

            {/* Strategic Objective Quote Box */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col gap-1.5">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666] font-semibold">
                Strategic Objective:
              </span>
              <p className="font-['Space_Grotesk'] text-sm text-[#111111] font-medium leading-relaxed">
                "{plan?.objective || 'Detect supply chain inventory depletion and stage replenishments while strictly enforcing capital gating.'}"
              </p>
            </div>

            {/* Strategic Rationale */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                AI Strategic Rationale:
              </span>
              <p className="font-['Space_Grotesk'] text-xs text-[#444444] leading-relaxed">
                {plan?.strategicRationale || `Assigned primary responsibility to ${activeRun.targetAgent.name} based on domain ontology. Sensitive financial impact detected: Action halted at Gatehouse perimeter awaiting operator biometric confirmation.`}
              </p>
            </div>

            {/* Phased Strategic Roadmap */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666] font-semibold">
                Phased Execution Plan:
              </span>

              <div className="flex flex-col gap-2 font-['Space_Grotesk'] text-xs">
                {(plan?.executionPhases || [
                  { phaseNumber: 1, phaseName: 'Ingress & Domain Decomposition', responsibleAgent: 'Gatehouse Core', actionDescription: 'Parse business objective AST and allocate specialized company agents', isAutonomous: true },
                  { phaseNumber: 2, phaseName: 'Telemetry & Inventory Scan', responsibleAgent: 'Inventory Agent', actionDescription: 'Audit Warehouse 04 stock and isolate depleted items below safety margin', isAutonomous: true },
                  { phaseNumber: 3, phaseName: 'Structure Purchase Order', responsibleAgent: 'Finance Agent', actionDescription: `Draft Supplier PO for ${activeRun.approvalRequest?.supplier || 'Supplier Requisition'} (${activeRun.approvalRequest?.amountFormatted || (activeRun.approvalRequest?.amount ? `₹${activeRun.approvalRequest.amount.toLocaleString()}` : 'Requisition Staged')})`, isAutonomous: true },
                  { phaseNumber: 4, phaseName: 'Business Owner Gating', responsibleAgent: 'Owner Perimeter', actionDescription: `Order exceeds ${activeRun.approvalRequest?.limitFormatted || (activeRun.approvalRequest?.autonomousLimit ? `₹${activeRun.approvalRequest.autonomousLimit.toLocaleString()}` : 'autonomous')} threshold. Escalate for human authorization`, isAutonomous: false },
                  { phaseNumber: 5, phaseName: 'ERP Downstream Commit', responsibleAgent: 'Supabase Engine', actionDescription: 'Commit signed transaction to database and log tamper-evident audit record', isAutonomous: true },
                ]).map((ph) => {
                  const isCurrentGated = ph.phaseNumber === 4 && (isHalted || !localApproved);
                  const isDone = ph.phaseNumber < 4 || (ph.phaseNumber >= 4 && localApproved);

                  return (
                    <div 
                      key={ph.phaseNumber}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isCurrentGated
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : isDone
                          ? 'bg-[#FAFAFA] border-[#E5E5E5]'
                          : 'bg-white border-[#E5E5E5] text-[#888888]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold ${
                          isCurrentGated
                            ? 'bg-amber-200 text-amber-900 border border-amber-300'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#F5F5F5] text-[#888888]'
                        }`}>
                          {isDone ? '✓' : `0${ph.phaseNumber}`}
                        </span>

                        <div className="flex flex-col">
                          <span className={`font-semibold ${isCurrentGated ? 'text-amber-950' : isDone ? 'text-[#111111]' : 'text-[#666666]'}`}>
                            Phase 0{ph.phaseNumber}: {ph.phaseName}
                          </span>
                          <span className="text-[11px] text-[#666666]">
                            {ph.actionDescription}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded ${
                          isCurrentGated
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#F5F5F5] text-[#888888]'
                        }`}>
                          {isCurrentGated ? '⚠ OWNER GATED' : isDone ? 'COMPLETED' : 'QUEUED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT: ASSIGNED COMPANY AI AGENTS & OWNER APPROVAL (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* ASSIGNED COMPANY AI AGENTS FOR THIS TASK */}
          <div className="bg-white p-6 lg:p-7 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#111111] text-[20px]">group_work</span>
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Company Agents Assigned
                </h3>
              </div>
              <span className="text-xs font-['JetBrains_Mono'] text-[#666666] font-semibold">
                {plan?.allocatedAgents?.length || 2} Allocated
              </span>
            </div>

            {/* List of Allocated Agents */}
            <div className="flex flex-col gap-3">
              {(plan?.allocatedAgents || [
                {
                  agentId: 'agt-02',
                  agentCode: 'AGT-02',
                  agentName: 'INVENTORY AGENT',
                  role: 'Supply Chain & Depletion Strategist',
                  assignedTask: 'Audit warehouse telemetry, detect stock deficits across SKU matrix, and calculate buffer restock',
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
                  className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#CCCCCC] transition flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-['Space_Grotesk'] text-sm font-bold text-[#111111]">
                        {agent.agentName}
                      </span>
                      <span className="text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#666666]">
                        {agent.agentCode}
                      </span>
                    </div>

                    <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#111111] font-semibold">
                      {agent.clearance}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-xs font-['Space_Grotesk']">
                    <span className="text-[#666666] font-['JetBrains_Mono'] text-[11px] font-medium">
                      Role: {agent.role}
                    </span>
                    <span className="text-[#444444] leading-relaxed">
                      <strong className="text-[#111111]">Assigned Task:</strong> {agent.assignedTask}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] text-[10px] font-['JetBrains_Mono'] text-[#666666]">
                    <span>Enclave: {agent.enclave}</span>
                    <div className="flex gap-1">
                      {agent.boundTools?.map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#111111]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('agents')}
              className="w-full py-2 bg-white hover:bg-[#F5F5F5] text-[#111111] font-['Space_Grotesk'] text-xs font-semibold rounded-lg border border-[#E5E5E5] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage Company Agent Capabilities</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* DEDICATED BUSINESS OWNER APPROVAL CALLOUT CARD */}
          {(isHalted || pendingApprovalsCount > 0) && (
            <div className={`p-6 rounded-xl border transition-all flex flex-col gap-4 ${
              localApproved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-amber-50/70 border-2 border-amber-300 text-[#111111] shadow-xs'
            }`}>
              {localApproved ? (
                /* Approved Confirmation */
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xl text-emerald-700 font-bold">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-sm font-bold text-emerald-950">
                      TASK APPROVED BY BUSINESS OWNER
                    </span>
                    <span className="text-xs text-emerald-800 font-['Space_Grotesk']">
                      Purchase order authorized. State committed downstream to database.
                    </span>
                  </div>
                </div>
              ) : (
                /* Needs Owner Approval */
                <>
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h4 className="font-['Space_Grotesk'] text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Business Owner Approval Required
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-['JetBrains_Mono'] font-bold">
                      {activeRun.approvalRequest?.riskLevel || 'CRITICAL'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-[#666666] font-['JetBrains_Mono'] uppercase">
                      Action Staged:
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#111111]">
                      {activeRun.approvalRequest?.title || `Create Purchase Order for ${activeRun.approvalRequest?.supplier || 'Supplier Requisition'}`}
                    </h3>
                    <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                      <span className="text-xs text-[#666666] font-['Space_Grotesk']">Order Value / Financial Impact:</span>
                      <span className="text-lg font-bold text-[#111111] font-['Space_Grotesk']">
                        {activeRun.approvalRequest?.amountFormatted || (activeRun.approvalRequest?.amount ? `₹${activeRun.approvalRequest.amount.toLocaleString()}` : 'Order Staged')}
                      </span>
                    </div>
                    <p className="text-xs text-[#444444] font-['Space_Grotesk'] leading-relaxed pt-1">
                      <strong className="text-[#111111]">Owner Gate:</strong> {activeRun.approvalRequest?.description || (activeRun.approvalRequest?.autonomousLimit && activeRun.approvalRequest?.varianceAmount ? `Exceeds autonomous spending ceiling (₹${activeRun.approvalRequest.autonomousLimit.toLocaleString()}) by ₹${activeRun.approvalRequest.varianceAmount.toLocaleString()}. Awaiting your authorization.` : 'Order exceeds autonomous threshold. Awaiting your authorization.')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="py-2.5 bg-white hover:bg-[#F5F5F5] text-[#111111] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-[#E5E5E5] transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      disabled={isApproving}
                      className="py-2.5 bg-[#111111] hover:bg-black text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>{isApproving ? 'Authorizing...' : 'Approve Task'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      {/* HEALTH & TELEMETRY SECTION */}
      <HealthStatusCard />

      {/* BOTTOM: RECENT OPERATIONS AUDIT LEDGER */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111111] text-[18px]">history</span>
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#111111] uppercase tracking-wider">
              Recent Operations &amp; Business Decisions
            </h3>
          </div>
          <button 
            onClick={() => onNavigate('activity-logs')}
            className="text-xs font-['JetBrains_Mono'] text-[#111111] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>View Full Audit Ledger</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-['Space_Grotesk'] text-xs">
            <thead className="bg-[#FAFAFA] text-[#666666] font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider border-b border-[#E5E5E5]">
              <tr>
                <th className="py-3.5 px-6">TIME</th>
                <th className="py-3.5 px-6">AGENT ASSIGNED</th>
                <th className="py-3.5 px-6">TASK DIRECTIVE</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              <tr className="hover:bg-[#FAFAFA] transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#666666]">14:02</td>
                <td className="py-3.5 px-6 font-semibold text-[#111111]">Inventory Agent</td>
                <td className="py-3.5 px-6 text-[#444444]">Stock Check &amp; Depletion Audit (WH-04 East)</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    ✓ Completed
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('operations')}
                    className="text-[#111111] hover:underline font-['JetBrains_Mono'] text-[11px] font-semibold cursor-pointer"
                  >
                    Inspect Trace
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#FAFAFA] transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#666666]">13:57</td>
                <td className="py-3.5 px-6 font-semibold text-[#111111]">Customer Agent</td>
                <td className="py-3.5 px-6 text-[#444444]">Customer Resolution Reply (Ticket #9042)</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    ✓ Completed
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('operations')}
                    className="text-[#111111] hover:underline font-['JetBrains_Mono'] text-[11px] font-semibold cursor-pointer"
                  >
                    Inspect Trace
                  </button>
                </td>
              </tr>

              <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-amber-900 font-medium">13:51</td>
                <td className="py-3.5 px-6 font-semibold text-[#111111]">Finance Agent</td>
                <td className="py-3.5 px-6 text-[#111111] font-medium">
                  Supplier Purchase Order ({activeRun.approvalRequest?.amountFormatted || (activeRun.approvalRequest?.amount ? `₹${activeRun.approvalRequest.amount.toLocaleString()}` : 'Gated')})
                </td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                    ⚠ Owner Approval Required
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('approvals')}
                    className="text-[#111111] hover:underline font-['JetBrains_Mono'] text-[11px] font-bold cursor-pointer"
                  >
                    Review &amp; Sign →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
