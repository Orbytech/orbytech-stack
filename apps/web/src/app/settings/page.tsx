'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Globe, Moon, Save } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

interface SettingRow {
  label: string;
  description: string;
  key: string;
}

const NOTIF_SETTINGS: SettingRow[] = [
  { label: 'Payment confirmations', description: 'Get notified when a payment confirms', key: 'paymentConfirm' },
  { label: 'Stream updates', description: 'Alerts for stream creation and cancellation', key: 'streamUpdates' },
  { label: 'Low balance warning', description: 'Alert when XLM balance drops below threshold', key: 'lowBalance' },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001');
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    paymentConfirm: true,
    streamUpdates: true,
    lowBalance: false,
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} aria-checked={value} role="switch"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-7 w-7 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <button onClick={save}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            <Save className="h-4 w-4" />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>

        <Section icon={Globe} title="Network">
          <div className="flex gap-3">
            {(['testnet', 'mainnet'] as const).map(n => (
              <button key={n} onClick={() => setNetwork(n)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${network === n ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API URL</label>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </Section>

        <Section icon={Moon} title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dark mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
            </div>
            <Toggle value={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </Section>

        <Section icon={Bell} title="Notifications">
          <div className="space-y-4">
            {NOTIF_SETTINGS.map(({ label, description, key }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <Toggle value={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} />
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Shield} title="Security">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your secret keys are stored only in your browser's local storage and are never sent to our servers.
          </p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-4 text-sm text-red-600 hover:underline">
            Clear all local data
          </button>
        </Section>
      </div>
    </div>
  );
}
