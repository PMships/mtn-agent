'use client';

import { useState, useEffect } from 'react';

type Approval = {
  id: number;
  merchant_id: string;
  merchant_name: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
};

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/approvals').then(r => r.json()).then(setApprovals);
  }, []);

  async function decide(id: number, decision: 'approved' | 'rejected') {
    setLoading(id);
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    });
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a));
    setLoading(null);
  }

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A1F71' }}>Pending Approvals</h1>
        <p className="text-gray-500">Transactions the agent escalated for human review.</p>
      </div>

      {/* Pending */}
      <div className="space-y-4 mb-10">
        {pending.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center text-gray-400">
            No pending approvals
          </div>
        )}
        {pending.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-lg">{a.merchant_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
                    PENDING
                  </span>
                </div>
                <p className="text-2xl font-bold mb-2" style={{ color: '#1A1F71' }}>€{a.amount}</p>
                <p className="text-sm text-gray-500">{a.reason}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => decide(a.id, 'rejected')}
                  disabled={loading === a.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#EB001B' }}
                >
                  Reject
                </button>
                <button
                  onClick={() => decide(a.id, 'approved')}
                  disabled={loading === a.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#1A1F71' }}
                >
                  {loading === a.id ? '...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Resolved</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Merchant</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Amount</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Decision</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-3 font-medium text-gray-800">{a.merchant_name}</td>
                    <td className="px-6 py-3 text-gray-800">€{a.amount}</td>
                    <td className="px-6 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={a.status === 'approved'
                          ? { backgroundColor: '#dcfce7', color: '#166534' }
                          : { backgroundColor: '#fee2e2', color: '#991b1b' }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{new Date(a.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}