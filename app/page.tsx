'use client';

import { useState } from 'react';

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
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">MTN-Agent Console</h1>
      <p className="text-gray-500 mb-6">Give the agent a purchasing task. It will reason, check policy, and act.</p>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm"
          placeholder="e.g. Order lunch for under €15"
          value={task}
          onChange={e => setTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runAgent()}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          onClick={runAgent}
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 min-h-48 font-mono text-sm space-y-1">
        {log.length === 0 && !loading && <p className="text-gray-400">Agent output will appear here...</p>}
        {log.map((line, i) => <p key={i}>{line}</p>)}
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-400">
        <a href="/policy" className="hover:text-black">Policy Dashboard →</a>
        <a href="/audit" className="hover:text-black">Audit Log →</a>
      </div>
    </main>
  );
}