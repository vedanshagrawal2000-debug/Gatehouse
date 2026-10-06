import React, { useState } from 'react';
import { TabType, ApprovalRequest } from '../types';

interface HeaderProps {
  currentTab: TabType;
  pendingApprovalsCount: number;
  pendingApprovals?: ApprovalRequest[];
  onSelectApproval?: (approval: ApprovalRequest) => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  pendingApprovalsCount,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#0a0b0f]/90 backdrop-blur-md border-b border-[#1a1c23] z-40 flex items-center justify-between px-8">
      {/* Left: Brand / Section Title & Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm font-['Space_Grotesk']">
          <span className="font-bold text-white tracking-wide">GATEHOUSE</span>
          <span className="text-[#475569]">/</span>
          <span className="text-[#94a3b8] font-medium uppercase tracking-wider text-xs">CONTROL ROOM</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 text-[11px] font-['JetBrains_Mono'] text-[#34d399]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center relative w-72">
        <span className="material-symbols-outlined absolute left-3 text-[#64748b] text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search operations, agents, hashes..."
          className="w-full bg-[#13151c] text-xs font-['JetBrains_Mono'] text-white pl-9 pr-3 py-1.5 rounded-lg border border-[#232733] focus:outline-none focus:border-[#dc2626] placeholder:text-[#475569] transition-colors"
        />
      </div>

      {/* Right: Notifications, Alert, and Admin */}
      <div className="flex items-center gap-4">
        {/* Pending Approval Highlight */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => onNavigateTab?.('approvals')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#dc2626]/15 border border-[#dc2626]/50 text-[#fca5a5] text-xs font-['Space_Grotesk'] font-bold hover:bg-[#dc2626]/25 transition cursor-pointer shadow-[0_0_12px_rgba(220,38,38,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
            <span>{pendingApprovalsCount} Action Requires Approval</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button 
          onClick={() => onNavigateTab?.('approvals')}
          className="relative p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#151720] transition cursor-pointer"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full ring-2 ring-[#0a0b0f]" />
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#1a1c23]">
          <div className="w-8 h-8 rounded-lg bg-[#181a24] border border-[#272b38] flex items-center justify-center font-['JetBrains_Mono'] text-xs text-white font-bold shadow-sm">
            ADM
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-white font-['Space_Grotesk'] leading-none">
              Operator
            </span>
            <span className="text-[10px] text-[#64748b] font-['JetBrains_Mono'] leading-tight mt-0.5">
              Admin (L5)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
