import React, { useState, useEffect } from 'react';
import { TabType, ApprovalRequest, Company, CompanyIsolatedData } from '../../types';
import { fetchCompanyData, chatWithGemini } from '../../services/companyService';

interface CommandCenterScreenProps {
  onNavigate: (tab: TabType) => void;
  onOpenBiometric: (approval: ApprovalRequest) => void;
  onDispatchPrompt: (prompt: string, companyId?: string) => void;
  activeCompanyId: string;
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onOpenCompanyConnector: () => void;
}

export const CommandCenterScreen: React.FC<CommandCenterScreenProps> = ({
  onNavigate,
  onOpenBiometric,
  onDispatchPrompt,
  activeCompanyId,
  companies,
  onSelectCompany,
  onOpenCompanyConnector,
}) => {
  const [prompt, setPrompt] = useState('');
  const [companyData, setCompanyData] = useState<CompanyIsolatedData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeminiStrategizing, setIsGeminiStrategizing] = useState(false);
  const [geminiResult, setGeminiResult] = useState<any | null>(null);

  const activeComp = companies.find(c => c.id === activeCompanyId) || companies[0];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingData(true);
      try {
        const data = await fetchCompanyData(activeCompanyId);
        if (isMounted && data) {
          setCompanyData(data);
        }
      } catch (e) {
        console.error('Failed to load company data:', e);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }
    loadData();
    setGeminiResult(null); // Reset preview on company switch
    return () => { isMounted = false; };
  }, [activeCompanyId]);

  const handleLaunch = () => {
    if (!prompt.trim()) return;
    onDispatchPrompt(prompt, activeCompanyId);
    onNavigate('live-operations');
  };

  const handleGeminiStrategize = async () => {
    if (!prompt.trim()) return;
    setIsGeminiStrategizing(true);
    try {
      const res = await chatWithGemini(prompt, activeCompanyId);
      if (res) {
        setGeminiResult(res);
      }
    } catch (err) {
      console.error('Gemini strategize error:', err);
    } finally {
      setIsGeminiStrategizing(false);
    }
  };

  const inventoryList = companyData?.inventory || [];
  const enquiriesList = companyData?.enquiries || [];
  const agentsList = companyData?.agents || [];
  const depletedCount = inventoryList.filter(i => i.status === 'depleted' || i.status === 'low').length;

  return (
    <div className="flex flex-col w-full text-[#e2e2e9] pb-16">
      <div className="max-w-[1720px] mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Header & Active Company HUD */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-xs text-[#ffb4ab]">
              <span className="inline-block w-2 h-2 bg-[#dc2626] rounded-full animate-ping"></span>
              <span>TACTICAL COMMAND CENTER // BUSINESS OPERATIONS STRATEGIST</span>
            </div>

            <h1 className="font-['Space_Grotesk'] text-3xl lg:text-4xl uppercase text-[#e2e2e9] font-bold tracking-tight flex items-center gap-3">
              <span>Autonomous Business Control Room</span>
            </h1>

            <p className="font-['Geist'] text-sm text-[#ac8884] max-w-3xl leading-relaxed">
              Submit natural-language operations directives. The Sovereign Gemini Agent Kernel inspects your company database in real time, formulates strategic multi-agent plans, and gates high-risk financial executions at the perimeter shield.
            </p>
          </div>

          {/* Connected Company Status Card */}
          <div className="bg-[#1a1b21] p-4 rounded-lg border border-[#282a2f] flex flex-col gap-2.5 min-w-[320px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#282a2f]">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#ac8884] uppercase font-bold">
                ACTIVE COMPANY DATABASE
              </span>
              <button
                onClick={onOpenCompanyConnector}
                className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">database</span>
                <span>SWITCH / CONNECT DB</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-sm font-bold text-[#e2e2e9]">
                {activeComp?.name || 'Apex Cybernetics Corp'}
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                {activeComp?.db_type?.toUpperCase() || 'MONGODB'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-['JetBrains_Mono'] text-[10px] text-[#ac8884]">
              <div className="bg-[#0c0e13] p-1.5 rounded text-center">
                <span className="block text-[#e2e2e9] font-bold text-xs">{agentsList.length}</span>
                <span>Agents</span>
              </div>
              <div className="bg-[#0c0e13] p-1.5 rounded text-center">
                <span className="block text-[#ffb95f] font-bold text-xs">{depletedCount}</span>
                <span>Low Stock</span>
              </div>
              <div className="bg-[#0c0e13] p-1.5 rounded text-center">
                <span className="block text-[#ffb4ab] font-bold text-xs">{enquiriesList.length}</span>
                <span>Tickets</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step Lifecycle Visual Pipeline Tracker */}
        <div className="bg-[#0c0e13] p-4 rounded-lg border border-[#282a2f] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#e2e2e9] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">timeline</span>
              <span>5-STEP AUTONOMOUS LIFECYCLE PIPELINE</span>
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] font-semibold">
              AIR-GAPPED TENANT ISOLATION GUARANTEED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 font-['JetBrains_Mono'] text-xs">
            <div className="p-2.5 rounded bg-[#1a1b21] border border-[#4edea3]/40 flex flex-col gap-1">
              <span className="text-[10px] text-[#4edea3] font-bold">01 // PLAN</span>
              <span className="text-xs text-[#e2e2e9] font-bold">Inspect Company DB</span>
              <span className="text-[10px] text-[#ac8884]">Real-time telemetry scan without data leak</span>
            </div>

            <div className="p-2.5 rounded bg-[#1a1b21] border border-[#4edea3]/40 flex flex-col gap-1">
              <span className="text-[10px] text-[#4edea3] font-bold">02 // STRATEGISE</span>
              <span className="text-xs text-[#e2e2e9] font-bold">Gemini AI Reasoning</span>
              <span className="text-[10px] text-[#ac8884]">Calculates risk, limits &amp; tripwire rules</span>
            </div>

            <div className="p-2.5 rounded bg-[#1a1b21] border border-[#4edea3]/40 flex flex-col gap-1">
              <span className="text-[10px] text-[#4edea3] font-bold">03 // ALLOCATE</span>
              <span className="text-xs text-[#e2e2e9] font-bold">Multi-Agent Dispatch</span>
              <span className="text-[10px] text-[#ac8884]">Commands company&apos;s specialized AI roster</span>
            </div>

            <div className="p-2.5 rounded bg-[#282a2f] border-2 border-[#dc2626]/80 flex flex-col gap-1 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
              <span className="text-[10px] text-[#ffb4ab] font-bold">04 // USER APPROVAL</span>
              <span className="text-xs text-[#ffb4ab] font-bold">Biometric Shield</span>
              <span className="text-[10px] text-[#ac8884]">User notified ONLY if sensitive rules trip</span>
            </div>

            <div className="p-2.5 rounded bg-[#1a1b21] border border-[#4edea3]/40 flex flex-col gap-1">
              <span className="text-[10px] text-[#4edea3] font-bold">05 // TASK COMPLETES</span>
              <span className="text-xs text-[#e2e2e9] font-bold">Downstream Commit</span>
              <span className="text-[10px] text-[#ac8884]">Company DB updated &amp; audit log signed</span>
            </div>
          </div>
        </div>

        {/* Big Interactive Terminal Dispatcher with Gemini API */}
        <div className="bg-[#1a1b21] p-6 rounded-lg border-2 border-[#dc2626]/60 shadow-[0_0_30px_rgba(220,38,38,0.25)] flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#282a2f] pb-3">
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-xs font-bold text-[#e2e2e9]">
              <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">terminal</span>
              <span>OPERATIONS DIRECTIVE &amp; GEMINI STRATEGY TERMINAL</span>
            </div>
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px]">
              <span className="text-[#ac8884]">TARGET:</span>
              <span className="text-[#4edea3] font-bold">{activeComp?.name}</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleLaunch();
                }
              }}
              placeholder={`e.g. Check ${activeComp?.name || 'company'} inventory in ${activeComp?.db_type?.toUpperCase() || 'MongoDB'}, detect depleted SKUs, resolve pending customer tickets, and prepare restock orders...`}
              className="w-full bg-[#0c0e13] text-[#e2e2e9] font-['JetBrains_Mono'] text-sm p-4 rounded border border-[#282a2f] focus:outline-none focus:border-[#dc2626] placeholder:text-[#ac8884] leading-relaxed resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-['JetBrains_Mono'] w-full sm:w-auto">
              <span className="text-[#ac8884] uppercase text-[9px] font-bold">QUICK DIRECTIVES:</span>
              <button
                onClick={() => setPrompt(`Check inventory levels for ${activeComp?.name}, find low-stock products and prepare restock order.`)}
                className="px-2.5 py-1 rounded bg-[#0c0e13] hover:bg-[#282a2f] border border-[#282a2f] text-[#e2e2e9] shrink-0 transition cursor-pointer"
              >
                Depletion Restock Order
              </button>
              <button
                onClick={() => setPrompt(`Review incoming customer tickets for ${activeComp?.name}, draft context-aware dispute replies and calculate refund concessions.`)}
                className="px-2.5 py-1 rounded bg-[#0c0e13] hover:bg-[#282a2f] border border-[#282a2f] text-[#e2e2e9] shrink-0 transition cursor-pointer"
              >
                Customer Ticket Dispute
              </button>
              <button
                onClick={() => setPrompt(`Audit outstanding receivables for ${activeComp?.name} and prepare corporate invoice with Net-30 settlement terms.`)}
                className="px-2.5 py-1 rounded bg-[#0c0e13] hover:bg-[#282a2f] border border-[#282a2f] text-[#e2e2e9] shrink-0 transition cursor-pointer"
              >
                Capital Invoice Requisition
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                disabled={isGeminiStrategizing || !prompt.trim()}
                onClick={handleGeminiStrategize}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1e2025] hover:bg-[#282a2f] disabled:opacity-50 text-[#4edea3] border border-[#4edea3]/40 font-['JetBrains_Mono'] text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>{isGeminiStrategizing ? 'AI STRATEGIZING...' : 'STRATEGIZE WITH GEMINI'}</span>
              </button>

              <button
                disabled={!prompt.trim()}
                onClick={handleLaunch}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#dc2626] hover:bg-[#bf0715] disabled:opacity-50 text-white font-['JetBrains_Mono'] text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                <span>LAUNCH ORCHESTRATION</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Strategic Preview (When Strategized) */}
          {geminiResult && (
            <div className="mt-4 p-4 rounded-lg bg-[#0c0e13] border-2 border-[#4edea3]/50 flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#282a2f] pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[18px]">verified</span>
                  <span className="font-['Space_Grotesk'] text-sm font-bold text-[#e2e2e9] uppercase">
                    GEMINI AI STRATEGIC DECOMPOSITION &amp; AGENT ALLOCATION
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] bg-[#00a572]/20 px-2 py-0.5 rounded">
                  DATABASE GROUNDED // ZERO LEAK
                </span>
              </div>

              <p className="font-['Geist'] text-xs text-[#e2e2e9] leading-relaxed">
                {geminiResult.ai_reply}
              </p>

              {geminiResult.structured_plan && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#282a2f]">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#ac8884] uppercase font-bold">
                    ALLOCATED SPECIALIST AGENTS:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {geminiResult.structured_plan.allocated_agents?.map((ag: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded bg-[#1a1b21] border border-[#282a2f] flex flex-col gap-1">
                        <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#4edea3]">
                          {ag.agentCode}: {ag.agentName}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb95f]">
                          {ag.role}
                        </span>
                        <p className="font-['Geist'] text-[11px] text-[#ac8884] leading-snug">
                          {ag.assignedTask}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={handleLaunch}
                  className="px-4 py-2 bg-[#dc2626] hover:bg-[#bf0715] text-white font-['JetBrains_Mono'] text-xs font-bold uppercase rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>EXECUTE THIS STRATEGIC PLAN IN LIVE OPS</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real Company Database HUD: Isolated Inventory + Customer Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Inventory Snapshot for Active Company */}
          <div className="bg-[#1a1b21] p-5 rounded-lg border border-[#282a2f] shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#282a2f] pb-3">
              <div className="flex items-center gap-2 font-['Space_Grotesk'] text-base uppercase text-[#e2e2e9] font-bold">
                <span className="material-symbols-outlined text-[20px] text-[#4edea3]">inventory_2</span>
                <span>{activeComp?.name} // Inventory Telemetry</span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] bg-[#00a572]/20 px-2 py-0.5 rounded font-bold">
                {activeComp?.db_type?.toUpperCase()} ISOLATED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-['JetBrains_Mono'] text-xs">
                <thead className="bg-[#0c0e13] text-[#ac8884] text-[10px] uppercase border-b border-[#282a2f]">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">NAME</th>
                    <th className="py-2.5 px-3 text-right">STOCK</th>
                    <th className="py-2.5 px-3 text-right">MIN</th>
                    <th className="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282a2f]/50">
                  {inventoryList.map(item => (
                    <tr key={item.sku} className="hover:bg-[#1e2025]">
                      <td className="py-2.5 px-3 font-bold text-[#e2e2e9]">{item.sku}</td>
                      <td className="py-2.5 px-3 text-[#e6bdb8] truncate max-w-[180px]">{item.name}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        item.stock === 0 ? 'text-[#ffb4ab]' : item.stock <= item.minThreshold ? 'text-[#ffb95f]' : 'text-[#4edea3]'
                      }`}>
                        {item.stock}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#ac8884]">{item.minThreshold}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.status === 'depleted'
                            ? 'bg-[#93000a] text-white'
                            : item.status === 'low'
                            ? 'bg-[#a06500]/40 text-[#ffb95f]'
                            : 'bg-[#00a572]/20 text-[#4edea3]'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Enquiries Snapshot for Active Company */}
          <div className="bg-[#1a1b21] p-5 rounded-lg border border-[#282a2f] shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#282a2f] pb-3">
              <div className="flex items-center gap-2 font-['Space_Grotesk'] text-base uppercase text-[#e2e2e9] font-bold">
                <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">support_agent</span>
                <span>{activeComp?.name} // Customer Support Queue</span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                {enquiriesList.length} TICKETS
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {enquiriesList.map(enq => (
                <div key={enq.id} className="p-3 bg-[#0c0e13] rounded border border-[#282a2f] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
                    <span className="font-bold text-[#e2e2e9]">{enq.ticketNumber} // {enq.customerName}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                      enq.urgency === 'HIGH' || enq.urgency === 'CRITICAL' ? 'bg-[#dc2626]/20 text-[#ffb4ab]' : 'bg-[#282a2f] text-[#ac8884]'
                    }`}>
                      {enq.urgency}
                    </span>
                  </div>
                  <p className="font-['Geist'] text-xs text-[#e6bdb8] line-clamp-2">
                    {enq.message}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#282a2f]/50 text-[10px] font-['JetBrains_Mono']">
                    <span className="text-[#ac8884]">{enq.createdAt || enq.timestamp || 'Recent'}</span>
                    <button
                      onClick={() => {
                        const p = `Draft reply and refund resolution for ${enq.ticketNumber} from ${enq.customerName} in ${activeComp?.name}.`;
                        onDispatchPrompt(p, activeCompanyId);
                        onNavigate('live-operations');
                      }}
                      className="text-[#4edea3] hover:underline font-bold cursor-pointer"
                    >
                      DRAFT RESOLUTION →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
