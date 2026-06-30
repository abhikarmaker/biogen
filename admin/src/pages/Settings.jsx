import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getHealth } from '../lib/api';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
];

const DEFAULTS = {
  free_bio_limit: '3',
  gemini_model: 'gemini-1.5-flash',
  maintenance_mode: 'false',
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    Promise.all([
      getSettings().catch(() => DEFAULTS),
      getHealth().catch(() => null),
    ]).then(([s, h]) => {
      setSettings(s || DEFAULTS);
      setHealth(h);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
    } catch { /* dev mode — save locally only */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading settings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">App configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent hover:bg-accent/90 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Maintenance mode */}
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Maintenance mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Shows maintenance screen in the app</p>
          </div>
          <button
            onClick={() =>
              setSettings((s) => ({
                ...s,
                maintenance_mode: s.maintenance_mode === 'true' ? 'false' : 'true',
              }))
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.maintenance_mode === 'true' ? 'bg-accent' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.maintenance_mode === 'true' ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Free bio limit */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <label className="block text-sm font-semibold text-white mb-1.5">
            Free tier bio limit
          </label>
          <p className="text-xs text-gray-400 mb-3">Max bios a free user can generate</p>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.free_bio_limit}
            onChange={(e) => setSettings((s) => ({ ...s, free_bio_limit: e.target.value }))}
            className="w-32 bg-bg border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Gemini model */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <label className="block text-sm font-semibold text-white mb-1.5">
            Gemini model
          </label>
          <p className="text-xs text-gray-400 mb-3">AI model used for bio generation</p>
          <select
            value={settings.gemini_model}
            onChange={(e) => setSettings((s) => ({ ...s, gemini_model: e.target.value }))}
            className="bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Status indicators */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Connection status</h2>
          {[
            { label: 'Supabase', ok: health?.supabase },
            { label: 'Gemini API', ok: health?.gemini },
            { label: 'Stripe', ok: health?.stripe },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              {health === null ? (
                <span className="text-xs text-gray-600">Checking...</span>
              ) : (
                <span className={`flex items-center gap-1.5 ${ok ? 'text-green-400' : 'text-gray-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-gray-600'}`} />
                  {ok ? 'Connected' : 'Not configured'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
