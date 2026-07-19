'use client';

import { useState, useEffect } from 'react';

type LogEntry = {
  id: number;
  tool_called: string;
  merchant_name: string;
  amount: number;
  category: string;
  decision: string;
  reason: string;
  created_at: string;
  tx_hash?: string;
};

export default function AuditLog() {
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetch('/api/audit').then(r => r.json()).then(setLog);
  }, []);

  const decisionColor = (d: string) => {
    if (d === 'APPROVED') return 'bg-green-100 text-green-800';
    if (d === 'REJECTED') return 'bg-red-100 text-red-800';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Audit Log</h1>
      <p className="text-gray-500 mb-6">Every agent decision, immutably recorded.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Time</th>
              <th className="pb-2 pr-4">Merchant</th>
              <th className="pb-2 pr-4">Amount</th>
              <th className="pb-2 pr-4">Decision</th>
              <th className="pb-2 pr-4">Reason</th>
              <th className="pb-2">On-Chain</th>
            </tr>
          </thead>
          <tbody>
            {log.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleTimeString()}
                </td>
                <td className="py-3 pr-4 font-medium">{entry.merchant_name || '—'}</td>
                <td className="py-3 pr-4">{entry.amount ? `€${entry.amount}` : '—'}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${decisionColor(entry.decision)}`}>
                    {entry.decision}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-500">{entry.reason}</td>
                <td className="py-3">
                  {entry.tx_hash ? (
                    <a>
                    href={"https://sepolia.etherscan.io/tx/" + entry.tx_hash}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-mono text-xs"
                  
                    {entry.tx_hash.slice(0, 10)}...
                  </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No decisions logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4 text-sm text-gray-400">
        <a href="/" className="hover:text-black">← Agent Console</a>
        <a href="/policy" className="hover:text-black">Policy Dashboard →</a>
      </div>
    </main>
  );
}