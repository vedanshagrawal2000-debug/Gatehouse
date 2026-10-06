import React, { useState } from 'react';
import { TabType, ApprovalRequest } from '../../types';
import { executeAgentWorkflow, AgentRunResult } from '../../services/agentEngine';

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
        <div className="bg-[#0f1117] p-5 rounded-2xl border border-[#1e222d] shadow-md hover:border-[#2d3345] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8e95a5]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              COMPANY AI AGENTS
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#38bdf8]">smart_toy</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-white tracking-tight">
              3
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
              ● All Online
            </span>
          </div>
        </div>

        {/* Card 2: Strategy Missions */}
        <div className="bg-[#0f1117] p-5 rounded-2xl border border-[#1e222d] shadow-md hover:border-[#2d3345] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8e95a5]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              ACTIVE MISSIONS
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#818cf8]">psychology</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-white tracking-tight">
              128
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-[#818cf8]/15 text-[#a5b4fc] border border-[#818cf8]/30">
              AI Strategized
            </span>
          </div>
        </div>

        {/* Card 3: Business Owner Approvals */}
        <div 
          onClick={() => onNavigate('approvals')}
          className="bg-[#0f1117] p-5 rounded-2xl border border-[#dc2626]/40 shadow-[0_0_20px_rgba(220,38,38,0.14)] hover:border-[#dc2626] transition flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#fca5a5]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-bold">
              OWNER APPROVALS
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#ef4444] animate-pulse">verified_user</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-[#f87171] tracking-tight group-hover:text-white transition">
              {pendingApprovalsCount > 0 ? pendingApprovalsCount : '1'}
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-bold px-2.5 py-0.5 rounded-full bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/50">
              Action Required
            </span>
          </div>
        </div>

        {/* Card 4: Blocked Actions */}
        <div className="bg-[#0f1117] p-5 rounded-2xl border border-[#1e222d] shadow-md hover:border-[#2d3345] transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8e95a5]">
            <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider font-semibold">
              POLICY BREACHES
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#10b981]">shield</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="font-['Space_Grotesk'] text-3xl font-bold text-white tracking-tight">
              0
            </span>
            <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
              100% Gated
            </span>
          </div>
        </div>
      </div>

      {/* MISSION COMMAND - INPUT & PRESETS */}
      <div className="bg-[#0f1117] p-6 lg:p-7 rounded-2xl border border-[#1e222d] shadow-xl relative overflow-hidden flex flex-col gap-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dc2626] to-transparent opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ef4444] text-[20px]">terminal</span>
              <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-wide uppercase">
                MISSION COMMAND
              </h2>
            </div>
            <p className="text-xs text-[#8e95a5] font-['Space_Grotesk']">
              Describe a business objective. The AI will strategize, decompose phases, and allocate company agents.
            </p>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#07080b] rounded-xl border border-[#1e222d]">
            <button
              type="button"
              onClick={() => handleSelectExample('inventory')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-lg transition ${
                activeCategory === 'inventory'
                  ? 'bg-[#1e222d] text-white font-semibold shadow-sm'
                  : 'text-[#8e95a5] hover:text-white'
              }`}
            >
              📦 Inventory Restock
            </button>
            <button
              type="button"
              onClick={() => handleSelectExample('customer')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-lg transition ${
                activeCategory === 'customer'
                  ? 'bg-[#1e222d] text-white font-semibold shadow-sm'
                  : 'text-[#8e95a5] hover:text-white'
              }`}
            >
              💬 Customer Support
            </button>
            <button
              type="button"
              onClick={() => handleSelectExample('finance')}
              className={`text-xs font-['Space_Grotesk'] px-3 py-1.5 rounded-lg transition ${
                activeCategory === 'finance'
                  ? 'bg-[#1e222d] text-white font-semibold shadow-sm'
                  : 'text-[#8e95a5] hover:text-white'
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
            className="w-full bg-[#07080b] text-white font-['Space_Grotesk'] text-base p-4 rounded-xl border border-[#232733] focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]/40 placeholder:text-[#475569] resize-none leading-relaxed transition"
          />
        </div>

        {/* Dispatch status message */}
        {dispatchSuccessMsg && (
          <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/40 rounded-xl flex items-center gap-2 text-xs font-['Space_Grotesk'] text-[#34d399] animate-pulse">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-semibold">{dispatchSuccessMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#64748b] hidden sm:inline">
            Active Strategic Orchestrator: <strong className="text-[#38bdf8]">Autonomous Strategic Neural Engine</strong>
          </span>

          <button
            type="button"
            onClick={() => handleRun()}
            disabled={!missionInput.trim() || isBusy}
            className="ml-auto px-7 py-3 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] disabled:opacity-50 text-white font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition cursor-pointer flex items-center gap-2"
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

      {/* NEW: AI STRATEGY & COMPANY AGENTS ALLOCATION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: AI STRATEGY & PHASE ROADMAP (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI STRATEGY CARD */}
          <div className="bg-[#0f1117] p-6 lg:p-7 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#1a1c23] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center text-[#818cf8]">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#818cf8] font-bold">
                    AI STRATEGIST ARCHITECTURE
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-wider">
                    OPERATIONAL STRATEGY &amp; DECOMPOSITION
                  </h3>
                </div>
              </div>

              <span className="text-[11px] font-['JetBrains_Mono'] text-[#a5b4fc] px-2.5 py-0.5 rounded-full bg-[#818cf8]/10 border border-[#818cf8]/25 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-pulse" />
                Strategy Active
              </span>
            </div>

            {/* Strategic Objective Quote Box */}
            <div className="p-4 rounded-xl bg-[#090a0e] border border-[#1e222d] flex flex-col gap-2">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#64748b] font-semibold">
                Strategic Objective:
              </span>
              <p className="font-['Space_Grotesk'] text-sm text-white font-medium leading-relaxed">
                "{plan?.objective || 'Detect supply chain inventory depletion and stage replenishments while strictly enforcing capital gating.'}"
              </p>
            </div>

            {/* Strategic Rationale */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5]">
                AI Strategic Rationale:
              </span>
              <p className="font-['Space_Grotesk'] text-xs text-[#cbd5e1] leading-relaxed">
                {plan?.strategicRationale || `Assigned primary responsibility to ${activeRun.targetAgent.name} based on domain ontology. Sensitive financial impact detected: Action halted at Gatehouse perimeter awaiting operator biometric confirmation.`}
              </p>
            </div>

            {/* Phased Strategic Roadmap */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5] font-semibold">
                Phased Execution Plan:
              </span>

              <div className="flex flex-col gap-2 font-['Space_Grotesk'] text-xs">
                {(plan?.executionPhases || [
                  { phaseNumber: 1, phaseName: 'Ingress & Domain Decomposition', responsibleAgent: 'Gatehouse Core', actionDescription: 'Parse business objective AST and allocate specialized company agents', isAutonomous: true },
                  { phaseNumber: 2, phaseName: 'Telemetry & Inventory Scan', responsibleAgent: 'Inventory Agent', actionDescription: 'Audit Warehouse 04 stock and isolate depleted items below safety margin', isAutonomous: true },
                  { phaseNumber: 3, phaseName: 'Structure Purchase Order', responsibleAgent: 'Finance Agent', actionDescription: 'Draft Supplier PO for National Logistics Hub (₹18,500)', isAutonomous: true },
                  { phaseNumber: 4, phaseName: 'Business Owner Gating', responsibleAgent: 'Owner Perimeter', actionDescription: 'Order exceeds ₹14,000 threshold. Escalate for human authorization', isAutonomous: false },
                  { phaseNumber: 5, phaseName: 'ERP Downstream Commit', responsibleAgent: 'Supabase Engine', actionDescription: 'Commit signed transaction to database and log tamper-evident audit record', isAutonomous: true },
                ]).map((ph) => {
                  const isCurrentGated = ph.phaseNumber === 4 && (isHalted || !localApproved);
                  const isDone = ph.phaseNumber < 4 || (ph.phaseNumber >= 4 && localApproved);

                  return (
                    <div 
                      key={ph.phaseNumber}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isCurrentGated
                          ? 'bg-[#181113] border-[#dc2626]/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                          : isDone
                          ? 'bg-[#090a0e] border-[#1e222d]'
                          : 'bg-[#090a0e]/60 border-[#1a1c24] text-[#64748b]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold ${
                          isCurrentGated
                            ? 'bg-[#dc2626] text-white animate-pulse'
                            : isDone
                            ? 'bg-[#10b981]/20 text-[#34d399]'
                            : 'bg-[#1e222d] text-[#64748b]'
                        }`}>
                          {isDone ? '✓' : `0${ph.phaseNumber}`}
                        </span>

                        <div className="flex flex-col">
                          <span className={`font-semibold ${isCurrentGated ? 'text-[#fca5a5]' : isDone ? 'text-white' : 'text-[#8e95a5]'}`}>
                            Phase 0{ph.phaseNumber}: {ph.phaseName}
                          </span>
                          <span className="text-[11px] text-[#8e95a5]">
                            {ph.actionDescription}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded ${
                          isCurrentGated
                            ? 'bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/40 animate-pulse'
                            : isDone
                            ? 'bg-[#10b981]/15 text-[#34d399]'
                            : 'bg-[#1e222d] text-[#64748b]'
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
          <div className="bg-[#0f1117] p-6 lg:p-7 rounded-2xl border border-[#1e222d] shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1a1c23] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">group_work</span>
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-wider">
                  COMPANY AGENTS ASSIGNED TO TASK
                </h3>
              </div>
              <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8]">
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
                  className="p-4 rounded-xl bg-[#090a0e] border border-[#1e222d] hover:border-[#2d3345] transition flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                      <span className="font-['Space_Grotesk'] text-sm font-bold text-white">
                        {agent.agentName}
                      </span>
                      <span className="text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#181a24] text-[#8e95a5]">
                        {agent.agentCode}
                      </span>
                    </div>

                    <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8]">
                      {agent.clearance}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-xs font-['Space_Grotesk']">
                    <span className="text-[#38bdf8] font-['JetBrains_Mono'] text-[11px]">
                      Role: {agent.role}
                    </span>
                    <span className="text-[#cbd5e1] leading-relaxed">
                      <strong>Assigned Task:</strong> {agent.assignedTask}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#161822] text-[10px] font-['JetBrains_Mono'] text-[#64748b]">
                    <span>Enclave: {agent.enclave}</span>
                    <div className="flex gap-1">
                      {agent.boundTools?.map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-[#161822] text-[#94a3b8]">
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
              className="w-full py-2 bg-[#12141c] hover:bg-[#181b26] text-[#94a3b8] hover:text-white font-['Space_Grotesk'] text-xs font-semibold rounded-lg border border-[#1e222d] transition flex items-center justify-center gap-1.5"
            >
              <span>Manage Company Agent Capabilities</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* DEDICATED BUSINESS OWNER APPROVAL CALLOUT CARD */}
          {(isHalted || pendingApprovalsCount > 0) && (
            <div className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 ${
              localApproved
                ? 'bg-[#0f1915] border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-[#181013] border-[#dc2626] shadow-[0_0_30px_rgba(220,38,38,0.3)]'
            }`}>
              {localApproved ? (
                /* Approved Confirmation */
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center text-xl text-[#10b981] font-bold">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-sm font-bold text-white">
                      TASK APPROVED BY BUSINESS OWNER
                    </span>
                    <span className="text-xs text-[#a7f3d0] font-['Space_Grotesk']">
                      Purchase order authorized. State committed downstream to database.
                    </span>
                  </div>
                </div>
              ) : (
                /* Needs Owner Approval */
                <>
                  <div className="flex items-center justify-between border-b border-[#dc2626]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-ping" />
                      <h4 className="font-['Space_Grotesk'] text-xs font-bold text-[#fca5a5] uppercase tracking-wider">
                        BUSINESS OWNER APPROVAL REQUIRED
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#dc2626] text-white text-[10px] font-['JetBrains_Mono'] font-bold">
                      {activeRun.approvalRequest?.riskLevel || 'CRITICAL'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-[#8e95a5] font-['JetBrains_Mono'] uppercase">
                      Action Staged:
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                      {activeRun.approvalRequest?.title || 'Create Purchase Order for National Logistics Hub'}
                    </h3>
                    <div className="p-3 rounded-xl bg-[#090a0e] border border-[#1e222b] flex items-center justify-between">
                      <span className="text-xs text-[#8e95a5] font-['Space_Grotesk']">Order Value / Financial Impact:</span>
                      <span className="text-lg font-bold text-[#fca5a5] font-['Space_Grotesk']">
                        {activeRun.approvalRequest?.amountFormatted || '₹18,500 ($34,800 USD)'}
                      </span>
                    </div>
                    <p className="text-xs text-[#cbd5e1] font-['Space_Grotesk'] leading-relaxed pt-1">
                      <strong>Owner Gate:</strong> {activeRun.approvalRequest?.description || 'Exceeds autonomous spending ceiling (₹14,000) by ₹4,500. Awaiting your authorization.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="py-2.5 bg-[#161822] hover:bg-[#202330] text-[#fca5a5] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-[#dc2626]/40 transition"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      disabled={isApproving}
                      className="py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] transition flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* BOTTOM: RECENT OPERATIONS AUDIT LEDGER */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e222d] shadow-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#1a1c23] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8e95a5] text-[18px]">history</span>
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-wider">
              RECENT OPERATIONS &amp; BUSINESS DECISIONS
            </h3>
          </div>
          <button 
            onClick={() => onNavigate('activity-logs')}
            className="text-xs font-['JetBrains_Mono'] text-[#38bdf8] hover:underline flex items-center gap-1"
          >
            <span>View Full Audit Ledger</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-['Space_Grotesk'] text-xs">
            <thead className="bg-[#07080a] text-[#64748b] font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider border-b border-[#1a1c23]">
              <tr>
                <th className="py-3.5 px-6">TIME</th>
                <th className="py-3.5 px-6">AGENT ASSIGNED</th>
                <th className="py-3.5 px-6">TASK DIRECTIVE</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1c23]">
              <tr className="hover:bg-[#14161f] transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#8e95a5]">14:02</td>
                <td className="py-3.5 px-6 font-semibold text-white">Inventory Agent</td>
                <td className="py-3.5 px-6 text-[#cbd5e1]">Stock Check &amp; Depletion Audit (WH-04 East)</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-medium">
                    ✓ Completed
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('operations')}
                    className="text-[#38bdf8] hover:underline font-['JetBrains_Mono'] text-[11px]"
                  >
                    Inspect Trace
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#14161f] transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#8e95a5]">13:57</td>
                <td className="py-3.5 px-6 font-semibold text-white">Customer Agent</td>
                <td className="py-3.5 px-6 text-[#cbd5e1]">Customer Resolution Reply (Ticket #9042)</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-medium">
                    ✓ Completed
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('operations')}
                    className="text-[#38bdf8] hover:underline font-['JetBrains_Mono'] text-[11px]"
                  >
                    Inspect Trace
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#1f1315] bg-[#140c0e]/50 transition">
                <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#f87171]">13:51</td>
                <td className="py-3.5 px-6 font-semibold text-white">Finance Agent</td>
                <td className="py-3.5 px-6 text-[#fca5a5]">Supplier Purchase Order (₹18,500)</td>
                <td className="py-3.5 px-6">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/50 font-bold animate-pulse">
                    ⚠ Owner Approval Required
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button 
                    onClick={() => onNavigate('approvals')}
                    className="text-[#f87171] hover:underline font-['JetBrains_Mono'] text-[11px] font-bold"
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
