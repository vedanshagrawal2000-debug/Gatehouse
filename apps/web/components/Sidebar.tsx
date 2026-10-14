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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col justify-between border-r border-[#E5E5E5]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="h-16 px-6 flex items-center gap-3 border-b border-[#E5E5E5] cursor-pointer group transition-colors"
        >
          {/* Professional Minimalist Emblem */}
          <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[18px]">security</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-base font-bold tracking-tight text-[#111111]">
              GATEHOUSE
            </span>
            <span className="text-[10px] text-[#666666] font-mono uppercase tracking-wider font-medium">
              AI GOVERNANCE
            </span>
          </div>
        </div>

        {/* 5 Navigation Items */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = isTabActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${active ? 'text-white' : 'text-[#888888]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-white text-[#111111]'
                        : 'bg-[#111111] text-white'
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
      <div className="p-4 border-t border-[#E5E5E5] flex flex-col gap-1.5 font-mono text-xs bg-[#FAFAFA]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#111111] font-semibold text-[11px]">System Operational</span>
          </div>
          <span className="text-[#888888] text-[10px]">v4.3</span>
        </div>
        <div className="text-[10px] text-[#666666] tracking-wider flex items-center justify-between pt-0.5">
          <span>GOVERNANCE ENGINE</span>
          <span className="text-[#111111] font-semibold">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
