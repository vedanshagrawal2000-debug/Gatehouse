'use client';

/**
 * GATEHOUSE - Enterprise AI Governance & Operations Platform
 * Clean, minimalist black-and-white SaaS command center.
 * Core workflow: Objective -> AI Strategy & Agent Allocation -> Tool Execution -> Policy Check -> Human Approval -> Downstream Commit
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TabType, ApprovalRequest } from '../types';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardScreen } from '../components/screens/DashboardScreen';
import { AgentsScreen } from '../components/screens/AgentsScreen';
import { OperationsScreen } from '../components/screens/OperationsScreen';
import { SimpleApprovalsScreen } from '../components/screens/SimpleApprovalsScreen';
import { ActivityLogsScreen } from '../components/screens/ActivityLogsScreen';
import { executeAgentWorkflow, AgentRunResult } from '../services/agentEngine';
import { APPROVALS_DB } from '../services/businessTools';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([...APPROVALS_DB]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Current active workflow execution
  const [currentRun, setCurrentRun] = useState<AgentRunResult | null>(() => {
    return executeAgentWorkflow('Check low-stock products and prepare a restock order.');
  });

  // Fetch approvals from backend
  const refreshApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.approvals) && data.approvals.length > 0) {
          setApprovals(data.approvals);
          return;
        }
      }
    } catch {
      // Fallback to local DB
    }
    setApprovals([...APPROVALS_DB]);
  }, []);

  useEffect(() => {
    refreshApprovals();
  }, [refreshApprovals]);

  // Run a mission via backend API (with deterministic fallback)
  const handleRunMission = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsRunning(true);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.strategicPlan) {
          const local = executeAgentWorkflow(promptText);
          data.strategicPlan = local.strategicPlan;
        }
        setCurrentRun(data);
        if (data.approvalRequest || data.haltedForApproval) {
          await refreshApprovals();
        }
      } else {
        const local = executeAgentWorkflow(promptText);
        setCurrentRun(local);
        if (local.approvalRequest || local.haltedForApproval) {
          await refreshApprovals();
        }
      }
    } catch {
      const local = executeAgentWorkflow(promptText);
      setCurrentRun(local);
    } finally {
      setIsRunning(false);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="bg-[#FAFAFA] text-[#111111] min-h-screen flex selection:bg-[#111111] selection:text-white">
      {/* Professional SaaS Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingApprovalsCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen w-full">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          pendingApprovalsCount={pendingCount}
          onNavigateTab={setCurrentTab}
        />

        {/* Viewport Workspace */}
        <main className="w-full pt-16 flex-1 flex flex-col">
          {(currentTab === 'dashboard' || currentTab === 'overview' || currentTab === 'command-center') && (
            <DashboardScreen
              onNavigate={setCurrentTab}
              onRunMission={handleRunMission}
              pendingApprovalsCount={pendingCount}
              currentRun={currentRun}
              onRefreshApprovals={refreshApprovals}
              isRunning={isRunning}
            />
          )}

          {(currentTab === 'agents' || currentTab === 'ai-agents') && (
            <AgentsScreen
              onNavigate={setCurrentTab}
              onRunMission={handleRunMission}
            />
          )}

          {(currentTab === 'operations' || currentTab === 'live-operations') && (
            <OperationsScreen
              onNavigate={setCurrentTab}
              onOpenBiometric={() => setCurrentTab('approvals')}
              currentRun={currentRun}
              onRunMission={handleRunMission}
              isRunning={isRunning}
            />
          )}

          {(currentTab === 'approvals' || currentTab === 'approval-center') && (
            <SimpleApprovalsScreen
              onNavigate={setCurrentTab}
              approvalsList={approvals}
              onRefreshApprovals={refreshApprovals}
            />
          )}

          {(currentTab === 'audit_logs' || currentTab === 'audit-logs' || currentTab === 'activity-logs') && (
            <ActivityLogsScreen />
          )}
        </main>
      </div>
    </div>
  );
}
