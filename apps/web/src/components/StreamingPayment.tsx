'use client';

import { useState } from 'react';
import { Activity, Play, Square, AlertCircle, CheckCircle } from 'lucide-react';

interface Stream {
  id: string;
  sender: string;
  recipient: string;
  totalAmount: string;
  duration: number;
  asset: string;
  status: 'active' | 'cancelled';
  startedAt: string;
  endsAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function StreamingPayment() {
  const [form, setForm] = useState({ recipient: '', totalAmount: '', duration: '86400', asset: 'XLM' });
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const notify = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const createStream = async () => {
    if (!form.recipient || !form.totalAmount) return notify('Fill in all required fields', false);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/streaming/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'DEMO_SENDER_ADDRESS',
          recipient: form.recipient,
          totalAmount: form.totalAmount,
          duration: parseInt(form.duration),
          asset: form.asset,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStreams(prev => [data.data, ...prev]);
        setForm(f => ({ ...f, recipient: '', totalAmount: '' }));
        notify('Stream created successfully', true);
      } else {
        notify(data.error?.message ?? 'Failed to create stream', false);
      }
    } catch {
      // Demo mode — add locally
      const mock: Stream = {
        id: crypto.randomUUID(), ...form,
        sender: 'DEMO_SENDER',
        duration: parseInt(form.duration),
        status: 'active',
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + parseInt(form.duration) * 1000).toISOString(),
      };
      setStreams(prev => [mock, ...prev]);
      setForm(f => ({ ...f, recipient: '', totalAmount: '' }));
      notify('Stream created (demo mode)', true);
    }
    setLoading(false);
  };

  const cancelStream = async (id: string) => {
    try {
      await fetch(`${API}/api/v1/streaming/${id}`, { method: 'DELETE' });
    } catch {}
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    notify('Stream cancelled', true);
  };

  const field = (key: keyof typeof form, label: string, placeholder = '', type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Streaming Payments</h2>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {msg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      <div className="space-y-3">
        {field('recipient', 'Recipient Address', 'G...')}
        {field('totalAmount', 'Total Amount', '100')}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (s)</label>
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
              <option value="3600">1 Hour</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
              <option value="2592000">30 Days</option>
            </select>
          </div>
          {field('asset', 'Asset')}
        </div>
        <button onClick={createStream} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
          <Play className="h-4 w-4" /> {loading ? 'Creating…' : 'Start Stream'}
        </button>
      </div>

      {streams.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Streams</h3>
          <div className="space-y-2">
            {streams.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.totalAmount} {s.asset}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">→ {s.recipient.slice(0, 8)}…</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {s.status}
                  </span>
                  {s.status === 'active' && (
                    <button onClick={() => cancelStream(s.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
