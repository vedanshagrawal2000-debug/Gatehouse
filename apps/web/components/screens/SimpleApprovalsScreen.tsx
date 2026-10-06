import React, { useState } from 'react';
import { TabType, ApprovalRequest } from '../../types';

interface SimpleApprovalsScreenProps {
  onNavigate: (tab: TabType) => void;
  approvalsList: ApprovalRequest[];
  onRefreshApprovals: () => void;
}

export const SimpleApprovalsScreen: React.FC<SimpleApprovalsScreenProps> = ({
  onNavigate,
  approvalsList,
  onRefreshApprovals,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<{ id: string; status: 'APPROVED' | 'REJECTED'; message: string } | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'starred' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set(['appr-01']));
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['appr-03']));

  // Active email selection
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(
    approvalsList[0]?.id || ''
  );

  const activeApproval = approvalsList.find(a => a.id === selectedApprovalId) || approvalsList[0];

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set(prev).add(id));
  };

  const handleSelectEmail = (id: string) => {
    setSelectedApprovalId(id);
    markAsRead(id);
    setActionResult(null);
  };

  const handleApprove = async () => {
    if (!activeApproval) return;
    setIsProcessing(true);
    try {
      await fetch('/api/approvals/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeApproval.id || activeApproval.requestId,
          authorized_by: 'Business Owner // Sovereign L5',
          key_signature: '0x' + Math.random().toString(16).substring(2, 10),
        }),
      });

      activeApproval.status = 'APPROVED';
      activeApproval.approvedBy = 'Business Owner (You)';
      activeApproval.approvedAt = new Date().toLocaleTimeString();

      setActionResult({
        id: activeApproval.id,
        status: 'APPROVED',
        message: 'Task approved by Business Owner. Telemetry and state committed downstream to enterprise database.',
      });
      onRefreshApprovals();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!activeApproval) return;
    setIsProcessing(true);
    try {
      await fetch('/api/approvals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeApproval.id || activeApproval.requestId,
          reason: 'Rejected by Business Owner in Command Post',
        }),
      });

      activeApproval.status = 'REJECTED';
      setActionResult({
        id: activeApproval.id,
        status: 'REJECTED',
        message: 'Action rejected by Business Owner. Intent purged from sandbox enclave.',
      });
      onRefreshApprovals();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered emails list
  const filteredApprovals = approvalsList.filter(item => {
    // Filter tab
    if (filterTab === 'pending' && item.status !== 'PENDING') return false;
    if (filterTab === 'approved' && item.status !== 'APPROVED') return false;
    if (filterTab === 'rejected' && item.status !== 'REJECTED') return false;
    if (filterTab === 'starred' && !starredIds.has(item.id)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.agentName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.requestId?.toLowerCase().includes(q) ||
        item.policyRule?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const pendingCount = approvalsList.filter(a => a.status === 'PENDING').length;
  const isCurrentlyApproved = (actionResult?.id === activeApproval?.id && actionResult.status === 'APPROVED') || activeApproval?.status === 'APPROVED';
  const isCurrentlyRejected = (actionResult?.id === activeApproval?.id && actionResult.status === 'REJECTED') || activeApproval?.status === 'REJECTED';

  // Agent Avatar Colors
  const getAgentColor = (name: string) => {
    if (name?.toLowerCase().includes('finance')) return { bg: 'bg-[#ef4444]/20', text: 'text-[#fca5a5]', border: 'border-[#ef4444]/40', initials: 'FA' };
    if (name?.toLowerCase().includes('inventory')) return { bg: 'bg-[#38bdf8]/20', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]/40', initials: 'IA' };
    if (name?.toLowerCase().includes('customer')) return { bg: 'bg-[#10b981]/20', text: 'text-[#34d399]', border: 'border-[#10b981]/40', initials: 'CA' };
    return { bg: 'bg-[#818cf8]/20', text: 'text-[#a5b4fc]', border: 'border-[#818cf8]/40', initials: 'AI' };
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      
      {/* GMAIL-STYLE TOP SEARCH & ACTIONS BAR */}
      <div className="bg-[#0f1117] p-3 sm:p-4 rounded-2xl border border-[#1e222d] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Gmail-style Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center text-[#fca5a5]">
            <span className="material-symbols-outlined text-[20px]">mail</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-['Space_Grotesk'] text-base font-bold text-white tracking-wide">
                Approvals Inbox
              </h1>
              {pendingCount > 0 && (
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white animate-pulse">
                  {pendingCount} Action Required
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#8e95a5] font-['JetBrains_Mono']">
              Business Owner Direct Approval Feed
            </span>
          </div>
        </div>

        {/* Center: Gmail Search Input */}
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748b] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals (e.g. from:finance, >₹10000, PO-8841)..."
            className="w-full bg-[#07080a] text-xs font-['JetBrains_Mono'] text-white pl-9 pr-8 py-2 rounded-xl border border-[#1e222d] focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626]/30 placeholder:text-[#475569] transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-[#8e95a5] hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Gmail-style Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-['Space_Grotesk'] shrink-0">
          {[
            { id: 'all', label: '📥 All', count: approvalsList.length },
            { id: 'pending', label: '⚠ Needs Action', count: pendingCount },
            { id: 'starred', label: '⭐ Starred', count: starredIds.size },
            { id: 'approved', label: '✓ Approved' },
            { id: 'rejected', label: '✕ Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-[#dc2626] text-white font-bold shadow-[0_0_10px_rgba(220,38,38,0.35)]'
                  : 'bg-[#14161f] text-[#8e95a5] hover:text-white hover:bg-[#1a1c28]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.2 rounded-full ${
                  filterTab === tab.id ? 'bg-white text-[#dc2626]' : 'bg-[#1e222d] text-[#cbd5e1]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GMAIL TWO-PANE LAYOUT: INBOX LIST vs EMAIL READER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-[680px]">
        
        {/* LEFT COLUMN: GMAIL INBOX THREADS LIST (5 COLS) */}
        <div className="lg:col-span-5 bg-[#0f1117] rounded-2xl border border-[#1e222d] shadow-xl overflow-hidden flex flex-col h-full max-h-[800px]">
          {/* Inbox Toolbar */}
          <div className="p-3 border-b border-[#1a1c23] flex items-center justify-between bg-[#0a0b0e] text-xs font-['JetBrains_Mono'] text-[#64748b]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-[#8e95a5] cursor-pointer hover:text-white" onClick={onRefreshApprovals}>
                refresh
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#8e95a5]">
                {filteredApprovals.length} Approval Messages
              </span>
            </div>
            <span className="text-[10px] text-[#10b981]">
              Live Feed Active
            </span>
          </div>

          {/* Email List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#161822]">
            {filteredApprovals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3 text-[#8e95a5]">
                <span className="material-symbols-outlined text-[36px] text-[#475569]">inbox</span>
                <span className="text-sm font-['Space_Grotesk']">No approval messages in this view.</span>
              </div>
            ) : (
              filteredApprovals.map((item) => {
                const isSelected = item.id === activeApproval?.id;
                const isStarred = starredIds.has(item.id);
                const isUnread = !readIds.has(item.id) && item.status === 'PENDING';
                const avatar = getAgentColor(item.agentName || 'Agent');

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEmail(item.id)}
                    className={`p-4 transition cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-[#181a24] border-l-4 border-l-[#dc2626]'
                        : isUnread
                        ? 'bg-[#11131a] hover:bg-[#161822]'
                        : 'bg-[#0f1117] hover:bg-[#14161f] opacity-90'
                    }`}
                  >
                    {/* Star Icon */}
                    <button
                      type="button"
                      onClick={(e) => toggleStar(item.id, e)}
                      className="mt-0.5 text-[#64748b] hover:text-[#f59e0b] transition cursor-pointer shrink-0"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${
                        isStarred ? 'text-[#f59e0b] fill-current' : ''
                      }`}>
                        star
                      </span>
                    </button>

                    {/* Agent Circular Avatar */}
                    <div className={`w-8 h-8 rounded-full ${avatar.bg} ${avatar.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className={`font-['JetBrains_Mono'] text-[11px] font-bold ${avatar.text}`}>
                        {avatar.initials}
                      </span>
                    </div>

                    {/* Email Content Snippet */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-['Space_Grotesk'] truncate ${
                          isUnread ? 'font-bold text-white' : 'font-semibold text-[#cbd5e1]'
                        }`}>
                          {item.agentName || 'Company Agent'}
                        </span>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.2 rounded ${
                            item.status === 'PENDING'
                              ? 'bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/40'
                              : item.status === 'APPROVED'
                              ? 'bg-[#10b981]/15 text-[#34d399]'
                              : 'bg-[#dc2626]/30 text-[#f87171]'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748b]">
                            {item.timestamp?.split(' ')[0] || 'Today'}
                          </span>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <span className={`text-xs font-['Space_Grotesk'] truncate ${
                        isUnread ? 'font-bold text-white' : 'text-[#e2e8f0]'
                      }`}>
                        {item.subject || item.title}
                      </span>

                      {/* Snippet Preview */}
                      <p className="text-[11px] font-['Space_Grotesk'] text-[#8e95a5] line-clamp-1">
                        {item.description}
                      </p>

                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] font-['JetBrains_Mono']">
                        <span className="px-1.5 py-0.2 rounded bg-[#07080a] text-[#fca5a5] font-bold border border-[#1e222d]">
                          {item.amountFormatted || `₹${item.amount?.toLocaleString()}`}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#161822] text-[#8e95a5]">
                          {item.policyRule}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GMAIL EMAIL READER (7 COLS) */}
        <div className="lg:col-span-7 bg-[#0f1117] rounded-2xl border border-[#1e222d] shadow-xl overflow-hidden flex flex-col min-h-[680px]">
          {activeApproval ? (
            <>
              {/* Email Top Actions Toolbar */}
              <div className="p-4 border-b border-[#1a1c23] flex flex-wrap items-center justify-between gap-3 bg-[#0a0b0e]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-['JetBrains_Mono'] text-[#8e95a5]">
                    Ref: <strong className="text-white">{activeApproval.requestId || '#REQ-8841-B'}</strong>
                  </span>
                  <span className="text-[11px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#161822] text-[#38bdf8]">
                    {activeApproval.category || 'Executive Gating'}
                  </span>
                </div>

                {/* Direct Action Buttons in Email Toolbar */}
                <div className="flex items-center gap-2">
                  {isCurrentlyApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/20 border border-[#10b981]/50 text-[#34d399] font-['Space_Grotesk'] text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Approved by Owner</span>
                    </span>
                  ) : isCurrentlyRejected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dc2626]/20 border border-[#dc2626]/50 text-[#fca5a5] font-['Space_Grotesk'] text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Rejected by Owner</span>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-[#161822] hover:bg-[#202330] text-[#fca5a5] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-lg border border-[#dc2626]/40 transition cursor-pointer"
                      >
                        [ Reject ]
                      </button>

                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] disabled:opacity-50 text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>{isProcessing ? 'Authorizing...' : 'Approve & Execute'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto max-h-[720px]">
                
                {/* Subject Header */}
                <div className="flex flex-col gap-1 border-b border-[#1a1c23] pb-5">
                  <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {activeApproval.subject || activeApproval.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#8e95a5] mt-1">
                    <span>Inbox</span>
                    <span>/</span>
                    <span className="text-[#fca5a5]">High Priority Gating</span>
                  </div>
                </div>

                {/* Sender & Recipient Details Block (Gmail Style) */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#07080a] border border-[#1e222d]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center text-white font-bold font-['JetBrains_Mono'] text-sm shrink-0">
                      {activeApproval.agentName?.substring(0, 2) || 'AG'}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-sm font-bold text-white">
                          {activeApproval.agentName || 'Finance Agent'}
                        </span>
                        <span className="text-[11px] font-['JetBrains_Mono'] text-[#8e95a5]">
                          &lt;{activeApproval.senderEmail || `${activeApproval.agentId?.toLowerCase() || 'agent'}@enclave.internal`}&gt;
                        </span>
                      </div>
                      <span className="text-xs text-[#8e95a5] font-['Space_Grotesk']">
                        to <strong className="text-[#cbd5e1]">Business Owner</strong> &lt;{activeApproval.recipientEmail || 'owner@company.internal'}&gt;
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-['JetBrains_Mono'] text-[#64748b] shrink-0 hidden sm:block">
                    <span>{activeApproval.timestamp || 'Today, 2:22 PM'}</span>
                    <div className="text-[#10b981] mt-0.5">● Enclave Verified</div>
                  </div>
                </div>

                {/* Email Body: Corporate Decision Memo */}
                <div className="flex flex-col gap-5 text-sm font-['Space_Grotesk'] text-[#cbd5e1] leading-relaxed">
                  <p>
                    Dear Business Owner,
                  </p>
                  <p>
                    The company's autonomous AI strategic planner has deconstructed your recent directive and allocated tasks across our specialized company agents. During execution, a high-impact operation exceeded the autonomous governance ceiling and was automatically held awaiting your direct sign-off.
                  </p>

                  {/* Executive Financial Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#090a0e] border border-[#1e222d]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5]">
                        TRANSACTION VALUE
                      </span>
                      <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#fca5a5] mt-0.5">
                        {activeApproval.amountFormatted || `₹${activeApproval.amount?.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] text-[#64748b] font-['JetBrains_Mono']">
                        Supplier: National Logistics Hub
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5]">
                        AUTONOMOUS LIMIT
                      </span>
                      <span className="font-['Space_Grotesk'] text-xl font-bold text-white mt-0.5">
                        ₹{activeApproval.autonomousLimit?.toLocaleString() || '14,000'}
                      </span>
                      <span className="text-[10px] text-[#fca5a5] font-['JetBrains_Mono']">
                        Breach Delta: +₹{activeApproval.varianceAmount?.toLocaleString() || '4,500'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5]">
                        SECURITY POLICY
                      </span>
                      <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#38bdf8] mt-1">
                        {activeApproval.policyRule || 'RULE_POL_093'}
                      </span>
                      <span className="text-[10px] text-[#8e95a5]">
                        Risk Level: <strong>{activeApproval.riskLevel || 'CRITICAL'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Itemized Table (if available) */}
                  {activeApproval.lineItems && activeApproval.lineItems.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider text-[#8e95a5] font-semibold">
                        Itemized Purchase Order Requisition:
                      </span>
                      <div className="border border-[#1e222d] rounded-xl overflow-hidden bg-[#07080a]">
                        <table className="w-full text-left text-xs font-['Space_Grotesk']">
                          <thead className="bg-[#12141c] text-[#8e95a5] font-['JetBrains_Mono'] text-[10px] uppercase border-b border-[#1e222d]">
                            <tr>
                              <th className="py-2.5 px-4">SKU Code</th>
                              <th className="py-2.5 px-4">Description</th>
                              <th className="py-2.5 px-4 text-center">Qty</th>
                              <th className="py-2.5 px-4 text-right">Unit Price</th>
                              <th className="py-2.5 px-4 text-right">Extended</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e222d]">
                            {activeApproval.lineItems.map((li, idx) => (
                              <tr key={idx} className="hover:bg-[#14161f]">
                                <td className="py-2.5 px-4 font-['JetBrains_Mono'] text-[#38bdf8]">{li.sku}</td>
                                <td className="py-2.5 px-4 text-white">{li.description}</td>
                                <td className="py-2.5 px-4 text-center text-[#cbd5e1]">{li.quantity}</td>
                                <td className="py-2.5 px-4 text-right font-['JetBrains_Mono'] text-[#cbd5e1]">₹{li.unitPrice.toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right font-['JetBrains_Mono'] font-bold text-[#fca5a5]">₹{li.extendedAmount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* AI Assessment & Why Approval is Needed */}
                  <div className="p-4 rounded-xl bg-[#140e10] border border-[#dc2626]/30 flex flex-col gap-2">
                    <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider text-[#fca5a5] font-bold">
                      Why Your Approval is Required:
                    </span>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed">
                      {activeApproval.description}
                    </p>
                    <div className="flex flex-col gap-1 pt-1 text-xs text-[#8e95a5]">
                      {activeApproval.reasoningSteps?.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#fca5a5]">•</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formal Sign-off Signature */}
                  <div className="pt-4 border-t border-[#1a1c23] flex flex-col gap-1 text-xs text-[#8e95a5] font-['Space_Grotesk']">
                    <span>Respectfully submitted,</span>
                    <strong className="text-white">{activeApproval.agentName || 'Finance Agent'}</strong>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#64748b]">
                      Enclave ID: {activeApproval.enclaveHash || '0x9f4c882a46c3b21'} // Sovereign Dual-Signature Protocol
                    </span>
                  </div>

                  {/* Bottom Action Footer if Pending */}
                  {!isCurrentlyApproved && !isCurrentlyRejected && (
                    <div className="p-4 rounded-xl bg-[#0a0b0e] border border-[#1e222d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <span className="text-xs text-[#8e95a5]">
                        Executing this order will transmit purchase parameters directly to supplier ERP and disburse funds.
                      </span>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={isProcessing}
                          className="px-5 py-2.5 bg-[#161822] hover:bg-[#202330] text-[#fca5a5] font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-[#dc2626]/40 transition cursor-pointer"
                        >
                          Reject Request
                        </button>

                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="px-6 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] disabled:opacity-50 text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          <span>{isProcessing ? 'Authorizing...' : 'Approve & Execute Order'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmation Banner */}
                  {actionResult && (
                    <div className={`p-4 rounded-xl border font-['Space_Grotesk'] text-xs flex items-center gap-2 ${
                      actionResult.status === 'APPROVED'
                        ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#34d399]'
                        : 'bg-[#dc2626]/10 border-[#dc2626]/40 text-[#fca5a5]'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {actionResult.status === 'APPROVED' ? 'check_circle' : 'cancel'}
                      </span>
                      <span>{actionResult.message}</span>
                    </div>
                  )}

                </div>

              </div>
            </>
          ) : (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-[#8e95a5] my-auto">
              <span className="material-symbols-outlined text-[48px] text-[#333846]">mail_outline</span>
              <span className="font-['Space_Grotesk'] text-base text-white">Select an approval message</span>
              <p className="text-xs max-w-sm">
                Choose a pending request from the list on the left to review itemized details, policy rules, and authorize execution.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
