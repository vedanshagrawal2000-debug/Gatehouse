import React, { useState } from 'react';
import { TabType } from '../../types';

interface AgentsScreenProps {
  onNavigate: (tab: TabType) => void;
  onRunMission?: (prompt: string) => void;
}

interface AgentData {
  code: string;
  name: string;
  status: string;
  role: string;
  description: string;
  tasksCompleted: number;
  successRate: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tools: Array<{ name: string; desc: string; type: string }>;
  defaultPrompt: string;
  autonomousLimit: string;
  policyRule: string;
  recentMissions: Array<{ time: string; mission: string; status: string }>;
}

export const AgentsScreen: React.FC<AgentsScreenProps> = ({
  onNavigate,
  onRunMission,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'tools' | 'permissions' | 'activity'>('overview');

  const agents: AgentData[] = [
    {
      code: 'AGT-02',
      name: 'INVENTORY AGENT',
      status: 'Online',
      role: 'Supply Chain & Warehouse Optimization',
      description: 'Continuously monitors inventory levels across distribution centers, flags depleted SKUs against safety stock thresholds, and structures replenishment purchase orders.',
      tasksCompleted: 89,
      successRate: '99.4%',
      riskLevel: 'HIGH',
      tools: [
        { name: 'get_inventory', desc: 'Queries real-time product stock, safety floors, and depot locations.', type: 'Read-only' },
        { name: 'identify_low_stock', desc: 'Analyzes SKU depletion metrics to isolate products requiring restock.', type: 'Compute' },
        { name: 'prepare_restock_order', desc: 'Structures purchase order payloads; triggers human gate if > ₹14,000.', type: 'Sensitive' },
      ],
      defaultPrompt: 'Check low-stock products and prepare a restock order.',
      autonomousLimit: '₹14,000 ($16,500 USD)',
      policyRule: 'RULE_POL_093 (Tier-3 Procurement Gating)',
      recentMissions: [
        { time: '14:02 Today', mission: 'Audited WH-04 East stock levels', status: 'Completed' },
        { time: '10:14 Today', mission: 'Generated Supplier PO #PO-8841-B', status: 'Pending Approval' },
        { time: 'Yesterday', mission: 'Threshold optimization for microchips', status: 'Completed' },
      ],
    },
    {
      code: 'AGT-01',
      name: 'CUSTOMER AGENT',
      status: 'Online',
      role: 'Customer Support & Dispute Resolution',
      description: 'Ingests inbound customer tickets, checks CRM databases for transaction and warranty context, drafts empathetic responses, and proposes refunds under governed rules.',
      tasksCompleted: 142,
      successRate: '98.8%',
      riskLevel: 'MEDIUM',
      tools: [
        { name: 'get_customer_enquiries', desc: 'Pulls open customer support tickets from Zendesk queue.', type: 'Read-only' },
        { name: 'draft_customer_reply', desc: 'Generates policy-compliant reply with automated refund proposals.', type: 'Sensitive' },
      ],
      defaultPrompt: 'Check customer enquiries and draft refund reply.',
      autonomousLimit: '₹5,000 ($600 USD)',
      policyRule: 'RULE_POL_012 (Customer Concession Limits)',
      recentMissions: [
        { time: '13:57 Today', mission: 'Drafted reply for ticket #9042', status: 'Completed' },
        { time: '11:30 Today', mission: 'Priority escalations scan', status: 'Completed' },
        { time: 'Yesterday', mission: 'Refund authorization for invoice dispute', status: 'Approved' },
      ],
    },
    {
      code: 'AGT-03',
      name: 'FINANCE AGENT',
      status: 'Online',
      role: 'Financial Operations & Invoicing',
      description: 'Audits accounts receivable, verifies client milestones against contracted timesheets, and prepares formal commercial invoices and ledger balance entries.',
      tasksCompleted: 37,
      successRate: '100%',
      riskLevel: 'HIGH',
      tools: [
        { name: 'create_invoice', desc: 'Generates commercial invoice documents in ERP and updates ledger.', type: 'Sensitive' },
      ],
      defaultPrompt: 'Create commercial invoice for Cyberdyne Systems for $32,000.',
      autonomousLimit: '₹25,000 ($30,000 USD)',
      policyRule: 'RULE_POL_044 (Ledger Disbursement Governance)',
      recentMissions: [
        { time: '13:51 Today', mission: 'Drafted Invoice #INV-2026-9042', status: 'Pending Approval' },
        { time: 'Yesterday', mission: 'Reconciliation of stripe payout batches', status: 'Completed' },
        { time: '2 days ago', mission: 'Quarterly tax ledger pre-audit', status: 'Completed' },
      ],
    },
  ];

  const handleAssign = (prompt: string) => {
    onRunMission?.(prompt);
    onNavigate('operations');
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1c23] pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[22px]">smart_toy</span>
            <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
              AI AGENTS DIRECTORY
            </h1>
          </div>
          <p className="font-['Space_Grotesk'] text-xs sm:text-sm text-[#8e95a5]">
            Specialized autonomous workers deployed in company sandboxes with fail-safe human gating.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#101217] border border-[#1e222b] flex items-center gap-2 font-['JetBrains_Mono'] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[#94a3b8]">3 Online</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#101217] border border-[#1e222b] flex items-center gap-2 font-['JetBrains_Mono'] text-xs">
            <span className="text-[#38bdf8]">268 Tasks</span>
          </div>
        </div>
      </div>

      {/* 3 AGENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.code}
            className="bg-[#101217] rounded-2xl border border-[#1e222b] hover:border-[#383d4f] transition flex flex-col justify-between shadow-xl overflow-hidden group"
          >
            {/* Card Header */}
            <div className="p-6 border-b border-[#1a1c23] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-xs text-[#8e95a5] px-2 py-0.5 rounded bg-[#181a24] border border-[#272b38]">
                  {agent.code}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded-full ${
                    agent.riskLevel === 'HIGH'
                      ? 'bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/40'
                      : 'bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/40'
                  }`}>
                    RISK: {agent.riskLevel}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white group-hover:text-[#38bdf8] transition tracking-tight">
                  {agent.name}
                </h2>
                <span className="text-xs font-['JetBrains_Mono'] text-[#38bdf8]">
                  {agent.role}
                </span>
              </div>

              <p className="font-['Space_Grotesk'] text-xs text-[#8e95a5] leading-relaxed line-clamp-3">
                {agent.description}
              </p>
            </div>

            {/* Card Stats & Tools */}
            <div className="p-6 flex flex-col gap-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0a0b0e] border border-[#1a1c23] font-['JetBrains_Mono'] text-xs">
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase">Tasks Run</span>
                  <span className="font-bold text-white text-sm">{agent.tasksCompleted}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase">Success</span>
                  <span className="font-bold text-[#10b981] text-sm">{agent.successRate}</span>
                </div>
              </div>

              {/* Tools Available */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#64748b]">
                  Tools Available:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.map((t) => (
                    <span
                      key={t.name}
                      className="text-[11px] font-['JetBrains_Mono'] px-2.5 py-1 rounded-md bg-[#161822] text-[#cbd5e1] border border-[#232738]"
                    >
                      {t.name}()
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions: View Agent & Assign Mission */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setDetailTab('overview');
                  }}
                  className="w-full py-2.5 bg-[#161822] hover:bg-[#202331] text-[#cbd5e1] hover:text-white font-['Space_Grotesk'] text-xs font-semibold rounded-lg border border-[#232738] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAssign(agent.defaultPrompt)}
                  className="w-full py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-['Space_Grotesk'] text-xs font-bold rounded-lg shadow-[0_0_12px_rgba(220,38,38,0.35)] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Assign</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* AGENT DETAIL MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101217] w-full max-w-2xl rounded-2xl border border-[#2d3240] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1a1c23] flex items-center justify-between bg-[#0a0b0e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#181a24] border border-[#272b38] flex items-center justify-center text-[#38bdf8]">
                  <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                      {selectedAgent.name}
                    </h3>
                    <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#34d399]">
                      Online
                    </span>
                  </div>
                  <span className="text-xs text-[#8e95a5] font-['JetBrains_Mono']">
                    {selectedAgent.code} // {selectedAgent.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="w-8 h-8 rounded-lg bg-[#181a24] text-[#8e95a5] hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-[#1a1c23] bg-[#0c0e13] px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'tools', label: 'Tools & RPCs' },
                { id: 'permissions', label: 'Permission Level' },
                { id: 'activity', label: 'Recent Activity' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-['Space_Grotesk'] font-semibold transition border-b-2 ${
                    detailTab === tab.id
                      ? 'border-[#dc2626] text-white'
                      : 'border-transparent text-[#64748b] hover:text-[#94a3b8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content Body */}
            <div className="p-6 flex flex-col gap-4 font-['Space_Grotesk'] text-xs text-[#cbd5e1] max-h-[60vh] overflow-y-auto">
              
              {detailTab === 'overview' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#64748b] block mb-1">
                      Agent Purpose &amp; Domain
                    </span>
                    <p className="text-sm text-white leading-relaxed">
                      {selectedAgent.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-[#07080b] border border-[#1a1c23]">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748b] block">LLM BACKBONE</span>
                      <span className="font-bold text-white text-sm font-['JetBrains_Mono']">Gemini 2.5 Flash</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#07080b] border border-[#1a1c23]">
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748b] block">ENCLAVE ISOLATION</span>
                      <span className="font-bold text-[#10b981] text-sm font-['JetBrains_Mono']">Deterministic Sandbox</span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'tools' && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#64748b]">
                    Connected RPC Tools
                  </span>
                  {selectedAgent.tools.map((t) => (
                    <div key={t.name} className="p-3 rounded-lg bg-[#07080b] border border-[#1a1c23] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-['JetBrains_Mono'] font-bold text-white text-sm">
                          {t.name}()
                        </span>
                        <span className={`text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded ${
                          t.type === 'Sensitive' ? 'bg-[#dc2626]/20 text-[#fca5a5]' : 'bg-[#38bdf8]/15 text-[#38bdf8]'
                        }`}>
                          {t.type}
                        </span>
                      </div>
                      <span className="text-[#8e95a5] text-xs">
                        {t.desc}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'permissions' && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#140f11] border border-[#dc2626]/30 flex flex-col gap-2">
                    <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#fca5a5] font-bold">
                      Autonomous Financial Ceiling
                    </span>
                    <span className="font-['Space_Grotesk'] text-2xl font-bold text-white">
                      {selectedAgent.autonomousLimit}
                    </span>
                    <span className="text-xs text-[#8e95a5]">
                      Any transaction or order exceeding this ceiling requires mandatory human biometric sign-off.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#07080b] border border-[#1a1c23] flex flex-col gap-1">
                    <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748b]">ENFORCED POLICY RULE</span>
                    <span className="font-['JetBrains_Mono'] text-white font-semibold">{selectedAgent.policyRule}</span>
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-['JetBrains_Mono'] uppercase text-[#64748b]">
                    Recent Directives
                  </span>
                  {selectedAgent.recentMissions.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#07080b] border border-[#1a1c23] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{m.mission}</span>
                        <span className="text-[10px] text-[#64748b] font-['JetBrains_Mono']">{m.time}</span>
                      </div>
                      <span className={`text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded ${
                        m.status === 'Completed' ? 'bg-[#10b981]/15 text-[#34d399]' : 'bg-[#dc2626]/20 text-[#fca5a5]'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1a1c23] bg-[#0a0b0e] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-[#181a24] hover:bg-[#202330] text-[#cbd5e1] font-['Space_Grotesk'] text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = selectedAgent.defaultPrompt;
                  setSelectedAgent(null);
                  handleAssign(p);
                }}
                className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-['Space_Grotesk'] text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(220,38,38,0.4)]"
              >
                <span>Dispatch Mission</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
