'use client';

import { useState, useEffect } from 'react';

export default function PolicyDashboard() {
  const [policy, setPolicy] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/policy').then(r => r.json()).then(setPolicy);
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!policy) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Policy Dashboard</h1>
      <p className="text-gray-500 mb-6">Control what the agent is allowed to do.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Daily Limit (€)</label>
          <input type="number" className="border rounded-lg px-4 py-2 w-full"
            value={policy.daily_limit}
            onChange={e => setPolicy({ ...policy, daily_limit: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Single Transaction Limit (€)</label>
          <input type="number" className="border rounded-lg px-4 py-2 w-full"
            value={policy.single_transaction_limit}
            onChange={e => setPolicy({ ...policy, single_transaction_limit: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Require Approval Above (€)</label>
          <input type="number" className="border rounded-lg px-4 py-2 w-full"
            value={policy.require_approval_above}
            onChange={e => setPolicy({ ...policy, require_approval_above: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Agent Active</label>
          <input type="checkbox" checked={policy.active}
            onChange={e => setPolicy({ ...policy, active: e.target.checked })} />
          <span className={`text-sm ${policy.active ? 'text-green-600' : 'text-red-600'}`}>
            {policy.active ? 'ON' : 'OFF (kill switch engaged)'}
          </span>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="mt-6 bg-black text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Policy'}
      </button>

      <div className="mt-4 flex gap-4 text-sm text-gray-400">
        <a href="/" className="hover:text-black">← Agent Console</a>
        <a href="/audit" className="hover:text-black">Audit Log →</a>
      </div>
    </main>
  );
}