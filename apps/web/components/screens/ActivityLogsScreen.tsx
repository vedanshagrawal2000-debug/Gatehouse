import React, { useState } from 'react';

interface AuditRecord {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  decision: 'Allowed' | 'Approval Required' | 'Rejected';
  approver: string;
  hash: string;
}

export const ActivityLogsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Allowed' | 'Approval Required' | 'Rejected'>('All');
  const [search, setSearch] = useState<string>('');

  const auditRecords: AuditRecord[] = [
    {
      id: 'AUD-9021',
      timestamp: '14:02:18 Today',
      agent: 'Inventory Agent (AGT-02)',
      action: 'get_inventory(warehouse_id: "WH-04-EAST")',
      decision: 'Allowed',
      approver: 'Autonomous Policy Gate',
      hash: '0x9a8f...2e10',
    },
    {
      id: 'AUD-9020',
      timestamp: '14:02:22 Today',
      agent: 'Inventory Agent (AGT-02)',
      action: 'identify_low_stock(safety_floor: 15)',
      decision: 'Allowed',
      approver: 'Autonomous Policy Gate',
      hash: '0x3c71...9f8b',
    },
    {
      id: 'AUD-9019',
      timestamp: '13:57:44 Today',
      agent: 'Customer Agent (AGT-01)',
      action: 'draft_customer_reply(ticket: "#9042")',
      decision: 'Allowed',
      approver: 'Autonomous Policy Gate',
      hash: '0x81be...41fa',
    },
    {
      id: 'AUD-9018',
      timestamp: '13:51:02 Today',
      agent: 'Finance Agent (AGT-03)',
      action: 'prepare_restock_order(value: ₹18,500)',
      decision: 'Approval Required',
      approver: 'Pending Operator Sign-off',
      hash: '0x55d2...ec01',
    },
    {
      id: 'AUD-9017',
      timestamp: '13:42:15 Today',
      agent: 'Customer Agent (AGT-01)',
      action: 'authorize_refund(value: $1,250)',
      decision: 'Allowed',
      approver: 'Operator // Admin (L5)',
      hash: '0x221a...88cc',
    },
    {
      id: 'AUD-9016',
      timestamp: '11:15:30 Today',
      agent: 'Finance Agent (AGT-03)',
      action: 'disburse_vendor_wire(value: $45,000)',
      decision: 'Rejected',
      approver: 'Operator // Admin (L5)',
      hash: '0xfe01...5562',
    },
    {
      id: 'AUD-9015',
      timestamp: '09:30:11 Today',
      agent: 'Inventory Agent (AGT-02)',
      action: 'prepare_restock_order(value: $9,200)',
      decision: 'Allowed',
      approver: 'Operator // Admin (L5)',
      hash: '0x77aa...bc44',
    },
    {
      id: 'AUD-9014',
      timestamp: '08:12:05 Today',
      agent: 'Inventory Agent (AGT-02)',
      action: 'scan_depot_rfid(location: "DEPOT-09")',
      decision: 'Allowed',
      approver: 'Autonomous Policy Gate',
      hash: '0x66bb...1123',
    },
  ];

  const filteredLogs = auditRecords.filter((record) => {
    if (filter !== 'All' && record.decision !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        record.agent.toLowerCase().includes(q) ||
        record.action.toLowerCase().includes(q) ||
        record.approver.toLowerCase().includes(q) ||
        record.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1c23] pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[22px]">receipt_long</span>
            <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase">
              AUDIT LOGS
            </h1>
          </div>
          <p className="font-['Space_Grotesk'] text-xs sm:text-sm text-[#8e95a5]">
            Cryptographically verified immutable audit ledger capturing every tool invocation, policy check, and human decision.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(auditRecords, null, 2));
              alert('Audit ledger copied to clipboard!');
            }}
            className="px-4 py-2 bg-[#14161f] hover:bg-[#1f222e] text-[#cbd5e1] font-['Space_Grotesk'] text-xs font-semibold rounded-lg border border-[#1e222b] transition flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy Ledger JSON</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-[#101217] rounded-xl border border-[#1e222b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748b] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by agent, action, hash, or approver..."
            className="w-full bg-[#07080a] text-xs font-['JetBrains_Mono'] text-white pl-9 pr-3 py-2 rounded-lg border border-[#1e222b] focus:outline-none focus:border-[#dc2626] placeholder:text-[#475569] transition"
          />
        </div>

        {/* Filter Chips: All, Allowed, Approval Required, Rejected */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-['Space_Grotesk']">
          {(['All', 'Allowed', 'Approval Required', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                filter === tab
                  ? 'bg-[#dc2626] text-white font-bold shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                  : 'bg-[#161822] text-[#8e95a5] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#101217] rounded-2xl border border-[#1e222b] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-['Space_Grotesk'] text-xs">
            <thead className="bg-[#090a0d] text-[#64748b] font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider border-b border-[#1a1c23]">
              <tr>
                <th className="py-3.5 px-6">TIMESTAMP</th>
                <th className="py-3.5 px-6">AGENT</th>
                <th className="py-3.5 px-6">ACTION</th>
                <th className="py-3.5 px-6">DECISION</th>
                <th className="py-3.5 px-6">APPROVER</th>
                <th className="py-3.5 px-6">HASH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1c23]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#14161f] transition">
                  <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#8e95a5] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-white whitespace-nowrap">
                    {log.agent}
                  </td>
                  <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#cbd5e1]">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-['JetBrains_Mono'] font-bold ${
                      log.decision === 'Allowed'
                        ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
                        : log.decision === 'Approval Required'
                        ? 'bg-[#dc2626]/20 text-[#fca5a5] border border-[#dc2626]/40 animate-pulse'
                        : 'bg-[#dc2626]/30 text-[#ef4444] border border-[#dc2626]/60'
                    }`}>
                      {log.decision === 'Allowed' && '✓ Allowed'}
                      {log.decision === 'Approval Required' && '⚠ Approval Required'}
                      {log.decision === 'Rejected' && '✕ Rejected'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-['Space_Grotesk'] text-[#94a3b8] whitespace-nowrap">
                    {log.approver}
                  </td>
                  <td className="py-3.5 px-6 font-['JetBrains_Mono'] text-[#38bdf8] text-[11px]">
                    {log.hash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#1a1c23] bg-[#090a0d] flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#64748b]">
          <span>Showing {filteredLogs.length} cryptographically signed records</span>
          <span className="text-[#10b981]">SHA-256 Tamper-Evident Ledger</span>
        </div>
      </div>

    </div>
  );
};
