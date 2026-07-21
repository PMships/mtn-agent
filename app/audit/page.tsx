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

  const decisionStyle = (d: string) => {
    if (d === 'APPROVED') return { backgroundColor: '#dcfce7', color: '#166534' };
    if (d === 'REJECTED') return { backgroundColor: '#fee2e2', color: '#991b1b' };
    return { backgroundColor: '#fef9c3', color: '#854d0e' };
  };

  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A1F71' }}>Audit Log</h1>
        <p className="text-gray-500">Every agent decision, permanently recorded.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#1A1F71' }}>
              <th className="text-left text-white font-medium px-6 py-3">Time</th>
              <th className="text-left text-white font-medium px-6 py-3">Merchant</th>
              <th className="text-left text-white font-medium px-6 py-3">Amount</th>
              <th className="text-left text-white font-medium px-6 py-3">Decision</th>
              <th className="text-left text-white font-medium px-6 py-3">Reason</th>
              <th className="text-left text-white font-medium px-6 py-3">On-Chain</th>
            </tr>
          </thead>
          <tbody>
            {log.map((entry, i) => (
              <tr key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">{entry.merchant_name || '—'}</td>
                <td className="px-6 py-4 text-gray-800">{entry.amount ? '€' + entry.amount : '—'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold" style={decisionStyle(entry.decision)}>
                    {entry.decision}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{entry.reason}</td>
                <td className="px-6 py-4">
                  {entry.tx_hash ? (
                    <a
                      href={"https://sepolia.etherscan.io/tx/" + entry.tx_hash}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs hover:underline"
                      >
                    
                      {entry.tx_hash.slice(0, 10)}...
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              
              </tr>
            ))}
            {log.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No decisions logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}