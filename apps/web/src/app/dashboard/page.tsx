'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownLeft, Zap, DollarSign, Users, Clock } from 'lucide-react';

const STATS = [
  { label: 'Total Payments', value: '1,284', change: '+12%', icon: DollarSign, color: 'blue' },
  { label: 'Active Streams', value: '34', change: '+5%', icon: Activity, color: 'green' },
  { label: 'Wallets Connected', value: '892', change: '+8%', icon: Users, color: 'purple' },
  { label: 'Avg. Tx Time', value: '4.2s', change: '-0.3s', icon: Clock, color: 'orange' },
  { label: 'XLM Sent', value: '48,320', change: '+22%', icon: ArrowUpRight, color: 'teal' },
  { label: 'XLM Received', value: '50,110', change: '+18%', icon: ArrowDownLeft, color: 'indigo' },
];

const ACTIVITY = [
  { id: '1', type: 'payment', from: 'GBT...XYZ', to: 'GAB...QRS', amount: '100 XLM', time: '2m ago', status: 'success' },
  { id: '2', type: 'stream',  from: 'GCD...MNO', to: 'GEF...PQR', amount: '500 XLM/30d', time: '8m ago', status: 'active' },
  { id: '3', type: 'payment', from: 'GHI...STU', to: 'GJK...VWX', amount: '250 XLM', time: '15m ago', status: 'success' },
  { id: '4', type: 'stream',  from: 'GLM...YZA', to: 'GNO...BCD', amount: '1000 XLM/7d', time: '1h ago', status: 'active' },
  { id: '5', type: 'payment', from: 'GPQ...EFG', to: 'GRS...HIJ', amount: '75 XLM', time: '2h ago', status: 'failed' },
];

const colorCls: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const statusCls: Record<string, string> = {
  success: 'bg-green-500',
  active: 'bg-blue-500',
  failed: 'bg-red-500',
};

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 500); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" /> Analytics Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Platform activity and network statistics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {STATS.map(({ label, value, change, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
                <div className={`p-2 rounded-lg ${colorCls[color]}`}><Icon className="h-4 w-4" /></div>
              </div>
              {ready ? (
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                  <span className="text-sm font-medium pb-0.5 text-green-600 dark:text-green-400">{change}</span>
                </div>
              ) : (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.type === 'payment' ? colorCls.blue : colorCls.purple}`}>
                    {item.type === 'payment' ? <DollarSign className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.from} → {item.to}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.amount}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusCls[item.status]}`} />
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
