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
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 flex items-center justify-between px-8">
      {/* Left: Brand / Section Title & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-[#111111] tracking-tight">GATEHOUSE</span>
          <span className="text-[#CCCCCC]">/</span>
          <span className="text-[#666666] font-medium uppercase tracking-wider text-xs">
            {currentTab.replace('_', ' ')}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Operational</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center relative w-80">
        <span className="material-symbols-outlined absolute left-3 text-[#888888] text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search operations, agents, hashes..."
          className="w-full bg-[#F5F5F5] text-xs font-mono text-[#111111] pl-9 pr-3 py-2 rounded-lg border border-[#E5E5E5] focus:outline-none focus:border-[#111111] focus:bg-white placeholder:text-[#888888] transition-all"
        />
      </div>

      {/* Right: Notifications, Alert, and Admin */}
      <div className="flex items-center gap-3">
        {/* Pending Approval Highlight */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => onNavigateTab?.('approvals')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-white text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{pendingApprovalsCount} Action{pendingApprovalsCount > 1 ? 's' : ''} Requires Approval</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button 
          onClick={() => onNavigateTab?.('approvals')}
          className="relative p-2 rounded-lg text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] transition cursor-pointer"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#111111] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E5E5]">
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center font-mono text-xs text-[#111111] font-bold">
            OP
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#111111] leading-none">
              Operator
            </span>
            <span className="text-[10px] text-[#888888] font-mono leading-tight mt-0.5">
              Admin (L5)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
