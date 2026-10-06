import React from 'react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
}) => {
  const isTabActive = (tabName: 'dashboard' | 'agents' | 'operations' | 'approvals' | 'audit_logs') => {
    if (tabName === 'dashboard') return currentTab === 'dashboard' || currentTab === 'overview' || currentTab === 'command-center';
    if (tabName === 'agents') return currentTab === 'agents' || currentTab === 'ai-agents';
    if (tabName === 'operations') return currentTab === 'operations' || currentTab === 'live-operations';
    if (tabName === 'approvals') return currentTab === 'approvals' || currentTab === 'approval-center';
    if (tabName === 'audit_logs') return currentTab === 'audit_logs' || currentTab === 'audit-logs' || currentTab === 'activity-logs';
    return false;
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      id: 'agents' as const,
      label: 'Agents',
      icon: 'smart_toy',
    },
    {
      id: 'operations' as const,
      label: 'Operations',
      icon: 'bolt',
    },
    {
      id: 'approvals' as const,
      label: 'Approvals',
      icon: 'verified_user',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    {
      id: 'audit_logs' as const,
      label: 'Audit Logs',
      icon: 'receipt_long',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0b0f] z-50 flex flex-col justify-between border-r border-[#1a1c23]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="h-16 px-6 flex items-center gap-3 border-b border-[#1a1c23] cursor-pointer group transition-colors"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#dc2626] shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
            <div className="absolute w-5 h-5 rounded-full bg-[#dc2626]/20 animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Space_Grotesk'] text-lg font-bold tracking-wider text-white group-hover:text-white transition">
              GATEHOUSE
            </span>
            <span className="text-[10px] text-[#94a3b8] font-['JetBrains_Mono'] uppercase tracking-widest">
              CONTROL ROOM
            </span>
          </div>
        </div>

        {/* 5 Navigation Items */}
        <nav className="flex flex-col gap-1.5 p-4">
          {navItems.map((item) => {
            const active = isTabActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-['Space_Grotesk'] transition-all cursor-pointer ${
                  active
                    ? 'bg-[#181a22] text-white font-semibold border-l-2 border-[#dc2626] shadow-[inset_0_0_12px_rgba(220,38,38,0.15)]'
                    : 'text-[#8e95a5] hover:bg-[#14161e] hover:text-[#e2e8f0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${active ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-[#dc2626] text-white shadow-[0_0_8px_rgba(220,38,38,0.6)]'
                        : 'bg-[#dc2626]/20 text-[#f87171] border border-[#dc2626]/40 animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#1a1c23] flex flex-col gap-1 font-['JetBrains_Mono'] text-xs bg-[#08090d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-[#10b981] font-semibold text-[11px]">System Online</span>
          </div>
          <span className="text-[#475569] text-[10px]">v4.2-PRO</span>
        </div>
        <div className="text-[10px] text-[#64748b] tracking-wider pt-1 flex items-center justify-between">
          <span>FAIL-SAFE ENCLAVE</span>
          <span className="text-[#38bdf8]">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
