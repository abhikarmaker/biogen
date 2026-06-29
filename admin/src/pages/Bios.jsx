import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { getBios, deleteBioAdmin, getOverview } from '../lib/api';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter',   label: 'X (Twitter)' },
  { id: 'threads',   label: 'Threads' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'facebook',  label: 'Facebook' },
  { id: 'snapchat',  label: 'Snapchat' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'telegram',  label: 'Telegram' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'discord',   label: 'Discord' },
  { id: 'reddit',    label: 'Reddit' },
  { id: 'mastodon',  label: 'Mastodon' },
  { id: 'bereal',    label: 'BeReal' },
  { id: 'spotify',   label: 'Spotify' },
  { id: 'twitch',    label: 'Twitch' },
  { id: 'hinge',     label: 'Hinge' },
  { id: 'bumble',    label: 'Bumble' },
  { id: 'tinder',    label: 'Tinder' },
  { id: 'github',    label: 'GitHub' },
  { id: 'substack',  label: 'Substack' },
  { id: 'medium',    label: 'Medium' },
  { id: 'patreon',   label: 'Patreon' },
  { id: 'fiverr',    label: 'Fiverr' },
];

const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.label]));

function DeleteBioBtn({ id, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!confirm('Delete this bio? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteBioAdmin(id);
      onDelete(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs px-3 py-1.5 border border-red-800 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
    >
      {loading ? '...' : 'Delete'}
    </button>
  );
}

export default function Bios() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const handleDelete = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  };

  const columns = [
    { key: 'email', label: 'User', render: (r) => <span className="text-gray-300">{r.users?.email || '—'}</span> },
    {
      key: 'platform', label: 'Platform',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-accent/10 text-accent">
          {PLATFORM_LABEL[r.platform] || r.platform}
        </span>
      ),
    },
    { key: 'tone', label: 'Tone', render: (r) => <span className="text-gray-400">{r.tone || '—'}</span> },
    { key: 'length', label: 'Length', render: (r) => <span className="text-gray-400">{r.length || '—'}</span> },
    { key: 'created_at', label: 'Date', render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—' },
    { key: 'content', label: 'Preview', render: (r) => <span className="text-gray-500 text-xs">{r.content?.slice(0, 70)}…</span> },
    { key: 'actions', label: '', render: (r) => <DeleteBioBtn id={r.id} onDelete={handleDelete} /> },
  ];

  const fetchBios = useCallback(() => {
    setLoading(true);
    getBios({ platform })
      .then((d) => { setRows(d.bios || []); setTotal(d.total || 0); })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [platform]);

  // Load chart data (real platform breakdown from overview)
  useEffect(() => {
    setChartLoading(true);
    getOverview()
      .then((d) => {
        const data = (d.platformBreakdown || []).map((p) => ({
          name: PLATFORM_LABEL[p.platform] || p.platform,
          count: p.count,
        }));
        setChartData(data);
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, []);

  useEffect(() => { fetchBios(); }, [fetchBios]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bios</h1>
          <p className="text-sm text-gray-400">{total.toLocaleString()} total generated</p>
        </div>
        <button onClick={fetchBios} className="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
      </div>

      {/* Platform breakdown chart — from real DB data */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Bios by platform</h2>
        <p className="text-xs text-gray-500 mb-4">Last 30 days</p>
        {chartLoading ? (
          <div className="text-gray-600 text-sm h-[180px] flex items-center">Loading chart...</div>
        ) : chartData.length === 0 ? (
          <div className="text-gray-600 text-sm h-[180px] flex items-center">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6B6B8A', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6B6B8A', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#7B61FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No bios yet — generate one from the app" />
        )}
      </div>
    </div>
  );
}
