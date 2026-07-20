'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['travel', 'food', 'accommodation', 'retail'];

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

  function toggleCategory(cat: string) {
    const current = policy.allowed_categories as string[];
    const updated = current.includes(cat)
      ? current.filter((c: string) => c !== cat)
      : [...current, cat];
    setPolicy({ ...policy, allowed_categories: updated });
  }

  if (!policy) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading policy...</div>
  );

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A1F71' }}>Policy Dashboard</h1>
        <p className="text-gray-500">Control what the agent is authorised to do.</p>
      </div>

      {/* Kill switch */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Agent Status</h2>
            <p className="text-sm text-gray-500 mt-0.5">Master kill switch — disable to block all agent transactions</p>
          </div>
          <button
            onClick={() => setPolicy({ ...policy, active: !policy.active })}
            className="px-5 py-2 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: policy.active ? '#EB001B' : '#6b7280' }}
          >
            {policy.active ? 'Agent ON' : 'Agent OFF'}
          </button>
        </div>
      </div>

      {/* Spending limits */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Spending Limits</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Daily Limit (€)', key: 'daily_limit' },
            { label: 'Per Transaction (€)', key: 'single_transaction_limit' },
            { label: 'Approval Above (€)', key: 'require_approval_above' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                value={policy[key]}
                onChange={e => setPolicy({ ...policy, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Allowed categories */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Allowed Categories</h2>
        <div className="flex gap-3 flex-wrap">
          {CATEGORIES.map(cat => {
            const active = policy.allowed_categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors capitalize"
                style={{
                  backgroundColor: active ? '#1A1F71' : 'white',
                  color: active ? 'white' : '#6b7280',
                  borderColor: active ? '#1A1F71' : '#e5e7eb',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1A1F71' }}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Policy'}
      </button>
    </main>
  );
}