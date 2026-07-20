'use client';

import { useState } from 'react';

const DEMO_TASKS = [
  "Order lunch for under €15",
  "Find me the cheapest flight to London and book it",
  "Book a hotel in Dublin for two nights",
];

export default function AgentConsole() {
  const [task, setTask] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function runAgent() {
    if (!task.trim()) return;
    setLoading(true);
    setLog([]);

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data !== '[DONE]') setLog(prev => [...prev, data]);
      }
    }
    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#1A1F71' }}>Agent Console</h1>
        <p className="text-gray-500">Give the agent a purchasing task. It will reason, check policy, and act.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1A1F71' } as React.CSSProperties}
            placeholder="e.g. Order lunch for under €15"
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAgent()}
          />
          <button
            className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1A1F71' }}
            onClick={runAgent}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Agent'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_TASKS.map(t => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Agent Output</h2>
        <div className="bg-gray-50 rounded-lg p-4 min-h-48 font-mono text-sm space-y-1">
          {log.length === 0 && !loading && (
            <p className="text-gray-400">Agent output will appear here...</p>
          )}
          {log.map((line, i) => (
            <p key={i} className={line.startsWith('📋 Result:') ? 'font-bold text-gray-900' : 'text-gray-600'}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}