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
      <div