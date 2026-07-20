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