import React, { useState } from 'react';
import { TabType, ApprovalRequest } from '../../types';

interface SimpleApprovalsScreenProps {
  onNavigate: (tab: TabType) => void;
  approvalsList: ApprovalRequest[];
  onRefreshApprovals: () => void;
}

export const SimpleApprovalsScreen: React.FC<SimpleApprovalsScreenProps> = ({
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
        message: `Order approved for ${activeApproval.supplier || 'supplier'} (${activeApproval.amountFormatted || `₹${activeApproval.amount?.toLocaleString()}`}). Telemetry and state committed downstream to enterprise database.`,
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
        message: `Requisition for ${activeApproval.supplier || 'supplier'} (${activeApproval.amountFormatted || `₹${activeApproval.amount?.toLocaleString()}`}) rejected by Business Owner. Intent purged from sandbox enclave. Zero funds disbursed.`,
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

  // Agent Avatar Colors - Clean Monochrome Enterprise
  const getAgentColor = (name: string) => {
    if (name?.toLowerCase().includes('finance')) return { bg: 'bg-[#F5F5F5]', text: 'text-[#111111]', border: 'border-[#E5E5E5]', initials: 'FA' };
    if (name?.toLowerCase().includes('inventory')) return { bg: 'bg-[#F5F5F5]', text: 'text-[#111111]', border: 'border-[#E5E5E5]', initials: 'IA' };
    if (name?.toLowerCase().includes('customer')) return { bg: 'bg-[#F5F5F5]', text: 'text-[#111111]', border: 'border-[#E5E5E5]', initials: 'CA' };
    return { bg: 'bg-[#F5F5F5]', text: 'text-[#111111]', border: 'border-[#E5E5E5]', initials: 'AI' };
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      
      {/* GMAIL-STYLE TOP SEARCH & ACTIONS BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E5E5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
            <span className="material-symbols-outlined text-[20px]">mail</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-['Space_Grotesk'] text-base font-bold text-[#111111] tracking-wide">
                Approvals Inbox
              </h1>
              {pendingCount > 0 && (
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {pendingCount} Action Required
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#666666] font-['JetBrains_Mono']">
              Business Owner Direct Approval Feed
            </span>
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#888888] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals (e.g. from:finance, >₹10000, PO-8841)..."
            className="w-full bg-[#FAFAFA] text-xs font-['JetBrains_Mono'] text-[#111111] pl-9 pr-8 py-2 rounded-lg border border-[#E5E5E5] focus:bg-white focus:outline-none focus:border-[#111111] placeholder:text-[#999999] transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-[#888888] hover:text-[#111111] text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Filters */}
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
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-medium ${
                filterTab === tab.id
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-white text-[#666666] hover:text-[#111111] border border-[#E5E5E5]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.2 rounded-full ${
                  filterTab === tab.id ? 'bg-white text-[#111111] font-bold' : 'bg-[#F5F5F5] text-[#111111]'
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
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E5E5] shadow-xs overflow-hidden flex flex-col h-full max-h-[800px]">
          {/* Inbox Toolbar */}
          <div className="p-3 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA] text-xs font-['JetBrains_Mono'] text-[#666666]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-[#666666] cursor-pointer hover:text-[#111111]" onClick={onRefreshApprovals}>
                refresh
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#666666]">
                {filteredApprovals.length} Approval Messages
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Live Feed Active
            </span>
          </div>

          {/* Email List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EEEEEE]">
            {filteredApprovals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3 text-[#666666]">
                <span className="material-symbols-outlined text-[36px] text-[#AAAAAA]">inbox</span>
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
                        ? 'bg-[#F5F5F5] border-l-4 border-l-[#111111]'
                        : isUnread
                        ? 'bg-white hover:bg-[#FAFAFA]'
                        : 'bg-white hover:bg-[#FAFAFA] opacity-90'
                    }`}
                  >
                    {/* Star Icon */}
                    <button
                      type="button"
                      onClick={(e) => toggleStar(item.id, e)}
                      className="mt-0.5 text-[#CCCCCC] hover:text-amber-500 transition cursor-pointer shrink-0"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${
                        isStarred ? 'text-amber-500 fill-current' : ''
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
                          isUnread ? 'font-bold text-[#111111]' : 'font-semibold text-[#444444]'
                        }`}>
                          {item.agentName || 'Company Agent'}
                        </span>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.2 rounded ${
                            item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : item.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-[10px] font-['JetBrains_Mono'] text-[#888888]">
                            {item.timestamp?.split(' ')[0] || 'Today'}
                          </span>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <span className={`text-xs font-['Space_Grotesk'] truncate ${
                        isUnread ? 'font-bold text-[#111111]' : 'text-[#333333]'
                      }`}>
                        {item.subject || item.title}
                      </span>

                      {/* Snippet Preview */}
                      <p className="text-[11px] font-['Space_Grotesk'] text-[#666666] line-clamp-1">
                        {item.description}
                      </p>

                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] font-['JetBrains_Mono']">
                        <span className="px-1.5 py-0.2 rounded bg-[#FAFAFA] text-[#111111] font-bold border border-[#E5E5E5]">
                          {item.amountFormatted || `₹${item.amount?.toLocaleString()}`}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#FAFAFA] text-[#666666] border border-[#E5E5E5]">
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
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E5E5] shadow-xs overflow-hidden flex flex-col min-h-[680px]">
          {activeApproval ? (
            <>
              {/* Email Top Actions Toolbar */}
              <div className="p-4 border-b border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-['JetBrains_Mono'] text-[#666666]">
                    Ref: <strong className="text-[#111111]">{activeApproval.requestId || '#REQ-8841-B'}</strong>
                  </span>
                  <span className="text-[11px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-white border border-[#E5E5E5] text-[#111111] font-medium">
                    {activeApproval.category || 'Executive Gating'}
                  </span>
                </div>

                {/* Direct Action Buttons in Email Toolbar */}
                <div className="flex items-center gap-2">
                  {isCurrentlyApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-['Space_Grotesk'] text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Approved by Owner</span>
                    </span>
                  ) : isCurrentlyRejected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 font-['Space_Grotesk'] text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Rejected by Owner</span>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-['Space_Grotesk'] text-xs font-bold uppercase rounded-lg border border-rose-300 transition cursor-pointer"
                      >
                        [ Reject ]
                      </button>

                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-[#111111] hover:bg-black disabled:opacity-50 text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                <div className="flex flex-col gap-1 border-b border-[#E5E5E5] pb-5">
                  <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[#111111] tracking-tight leading-snug">
                    {activeApproval.subject || activeApproval.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#666666] mt-1">
                    <span>Inbox</span>
                    <span>/</span>
                    <span className="text-[#111111] font-semibold">High Priority Gating</span>
                  </div>
                </div>

                {/* Sender & Recipient Details Block */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold font-['JetBrains_Mono'] text-sm shrink-0">
                      {activeApproval.agentName?.substring(0, 2) || 'AG'}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-sm font-bold text-[#111111]">
                          {activeApproval.agentName || 'Finance Agent'}
                        </span>
                        <span className="text-[11px] font-['JetBrains_Mono'] text-[#666666]">
                          &lt;{activeApproval.senderEmail || `${activeApproval.agentId?.toLowerCase() || 'agent'}@enclave.internal`}&gt;
                        </span>
                      </div>
                      <span className="text-xs text-[#666666] font-['Space_Grotesk']">
                        to <strong className="text-[#111111]">Business Owner</strong> &lt;{activeApproval.recipientEmail || 'owner@company.internal'}&gt;
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-['JetBrains_Mono'] text-[#888888] shrink-0 hidden sm:block">
                    <span>{activeApproval.timestamp || 'Today, 2:22 PM'}</span>
                    <div className="text-emerald-700 font-semibold mt-0.5">● Enclave Verified</div>
                  </div>
                </div>

                {/* Email Body: Corporate Decision Memo */}
                <div className="flex flex-col gap-5 text-sm font-['Space_Grotesk'] text-[#333333] leading-relaxed">
                  <p>
                    Dear Business Owner,
                  </p>
                  <p>
                    The company's autonomous AI strategic planner has deconstructed your recent directive and allocated tasks across our specialized company agents. During execution, a high-impact operation exceeded the autonomous governance ceiling and was automatically held awaiting your direct sign-off.
                  </p>

                  {/* Executive Financial Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                        TRANSACTION VALUE
                      </span>
                      <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#111111] mt-0.5">
                        {activeApproval.amountFormatted || `₹${activeApproval.amount?.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] text-[#666666] font-['JetBrains_Mono']">
                        Supplier: {activeApproval.supplier || 'National Logistics Hub'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                        AUTONOMOUS LIMIT
                      </span>
                      <span className="font-['Space_Grotesk'] text-xl font-bold text-[#111111] mt-0.5">
                        ₹{activeApproval.autonomousLimit?.toLocaleString() || '14,000'}
                      </span>
                      <span className="text-[10px] text-amber-800 font-['JetBrains_Mono'] font-medium">
                        Breach Delta: +₹{activeApproval.varianceAmount?.toLocaleString() || '4,500'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666]">
                        SECURITY POLICY
                      </span>
                      <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#111111] mt-1">
                        {activeApproval.policyRule || 'RULE_POL_093'}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        Risk Level: <strong className="text-[#111111]">{activeApproval.riskLevel || 'CRITICAL'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  {activeApproval.lineItems && activeApproval.lineItems.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider text-[#666666] font-semibold">
                        Itemized Purchase Order Requisition:
                      </span>
                      <div className="border border-[#E5E5E5] rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs font-['Space_Grotesk']">
                          <thead className="bg-[#FAFAFA] text-[#666666] font-['JetBrains_Mono'] text-[10px] uppercase border-b border-[#E5E5E5]">
                            <tr>
                              <th className="py-2.5 px-4">SKU Code</th>
                              <th className="py-2.5 px-4">Description</th>
                              <th className="py-2.5 px-4 text-center">Qty</th>
                              <th className="py-2.5 px-4 text-right">Unit Price</th>
                              <th className="py-2.5 px-4 text-right">Extended</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EEEEEE]">
                            {activeApproval.lineItems.map((li, idx) => (
                              <tr key={idx} className="hover:bg-[#FAFAFA]">
                                <td className="py-2.5 px-4 font-['JetBrains_Mono'] text-[#111111] font-medium">{li.sku}</td>
                                <td className="py-2.5 px-4 text-[#111111]">{li.description}</td>
                                <td className="py-2.5 px-4 text-center text-[#444444]">{li.quantity}</td>
                                <td className="py-2.5 px-4 text-right font-['JetBrains_Mono'] text-[#444444]">₹{li.unitPrice.toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right font-['JetBrains_Mono'] font-bold text-[#111111]">₹{li.extendedAmount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          {(activeApproval.subtotalFormatted || activeApproval.gstFormatted || activeApproval.shippingFormatted || activeApproval.subtotal) && (
                            <tfoot className="bg-[#FAFAFA] border-t border-[#E5E5E5] text-xs font-['JetBrains_Mono']">
                              <tr className="border-b border-[#EEEEEE]">
                                <td colSpan={3} className="py-2 px-4 text-[11px] text-[#666666]">
                                  {activeApproval.poNumber ? `PO Ref: ${activeApproval.poNumber} | Inv: ${activeApproval.invoiceNumber || 'N/A'}` : ''}
                                </td>
                                <td className="py-2 px-4 text-right text-[#666666]">Subtotal:</td>
                                <td className="py-2 px-4 text-right font-semibold text-[#111111]">{activeApproval.subtotalFormatted || `₹${activeApproval.subtotal?.toLocaleString()}`}</td>
                              </tr>
                              <tr className="border-b border-[#EEEEEE]">
                                <td colSpan={3} className="py-2 px-4 text-[11px] text-[#666666]">
                                  {activeApproval.transactionId ? `Txn ID: ${activeApproval.transactionId}` : ''}
                                </td>
                                <td className="py-2 px-4 text-right text-[#666666]">GST (18%):</td>
                                <td className="py-2 px-4 text-right font-semibold text-[#111111]">{activeApproval.gstFormatted || `₹${activeApproval.gst?.toLocaleString()}`}</td>
                              </tr>
                              <tr className="border-b border-[#EEEEEE]">
                                <td colSpan={3} className="py-2 px-4 text-[11px] text-[#666666]">
                                  {activeApproval.supplierAddress ? `Ship: ${activeApproval.supplierAddress}` : ''}
                                </td>
                                <td className="py-2 px-4 text-right text-[#666666]">Freight & Handling:</td>
                                <td className="py-2 px-4 text-right font-semibold text-[#111111]">{activeApproval.shippingFormatted || `₹${activeApproval.shipping?.toLocaleString()}`}</td>
                              </tr>
                              <tr className="bg-white border-t-2 border-[#111111]">
                                <td colSpan={3} className="py-3 px-4 font-bold text-[#111111] font-['Space_Grotesk']">
                                  TOTAL COMMITTED PAYOUT
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-[#111111] uppercase text-[11px]">Grand Total:</td>
                                <td className="py-3 px-4 text-right font-bold text-[#111111] font-['Space_Grotesk'] text-sm">{activeApproval.amountFormatted || `₹${(activeApproval.total || activeApproval.amount)?.toLocaleString()}`}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}

                  {/* AI Assessment & Why Approval is Needed */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 flex flex-col gap-2">
                    <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider text-amber-950 font-bold">
                      Why Your Approval is Required:
                    </span>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      {activeApproval.description}
                    </p>
                    <div className="flex flex-col gap-1 pt-1 text-xs text-[#555555]">
                      {activeApproval.reasoningSteps?.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-amber-800">•</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formal Sign-off Signature */}
                  <div className="pt-4 border-t border-[#E5E5E5] flex flex-col gap-1 text-xs text-[#666666] font-['Space_Grotesk']">
                    <span>Respectfully submitted,</span>
                    <strong className="text-[#111111]">{activeApproval.agentName || 'Finance Agent'}</strong>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#888888]">
                      Enclave ID: {activeApproval.enclaveHash || '0x9f4c882a46c3b21'} // Sovereign Dual-Signature Protocol
                    </span>
                  </div>

                  {/* Bottom Action Footer if Pending */}
                  {!isCurrentlyApproved && !isCurrentlyRejected && (
                    <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <span className="text-xs text-[#666666]">
                        Executing this order will transmit purchase parameters directly to supplier ERP and disburse funds.
                      </span>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={isProcessing}
                          className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl border border-rose-300 transition cursor-pointer"
                        >
                          Reject Request
                        </button>

                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="px-6 py-2.5 bg-[#111111] hover:bg-black disabled:opacity-50 text-white font-['Space_Grotesk'] text-xs font-bold uppercase rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
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
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
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
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-[#666666] my-auto">
              <span className="material-symbols-outlined text-[48px] text-[#AAAAAA]">mail_outline</span>
              <span className="font-['Space_Grotesk'] text-base text-[#111111] font-bold">Select an approval message</span>
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
