import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { getBios, deleteBioAdmin } from '../lib/api';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PLATFORMS = ['linkedin', 'instagram', 'twitter', 'threads', 'tiktok', 'youtube', 'hinge', 'bumble', 'github', 'discord', 'reddit', 'substack'];

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

  const handleDelete = (id) => { setRows((prev) => prev.filter((r) => r.id !== id)); setTotal((t) => t - 1); };

  const columns = [
    { key: 'email', label: 'User', render: (r) => r.users?.email || '—' },
    { key: 'platform', label: 'Platform', render: (r) => <span className="capitalize">{r.platform}</span> },
    { key: 'tone', label: 'Tone' },
    { key: 'created_at', label: 'Date', render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—' },
    { key: 'content', label: 'Preview', render: (r) => <span className="text-gray-400">{r.content?.slice(0, 60)}…</span> },
    { key: 'actions', label: '', render: (r) => <DeleteBioBtn id={r.id} onDelete={handleDelete} /> },
  ];

  const fetchBios = useCallback(() => {
    setLoading(true);
    getBios({ platform })
      .then((d) => { setRows(d.bios); setTotal(d.total); })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [platform]);

  useEffect(() => { fetchBios(); }, [fetchBios]);

  const chartData = PLATFORMS.map((p) => ({
    platform: p,
    count: rows.filter((r) => r.platform === p).length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bios</h1>
          <p className="text-sm text-gray-400">{total.toLocaleString()} total generated</p>
        </div>
        <button onClick={fetchBios} className="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Count by platform</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
            <XAxis dataKey="platform" tick={{ fill: '#6B6B8A', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B6B8A', fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
            <Bar dataKey="count" fill="#7B61FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
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
