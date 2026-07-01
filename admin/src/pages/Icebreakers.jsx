import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { getIcebreakers, deleteIcebreakerAdmin, getOverview } from '../lib/api';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TONES = ['Playful', 'Witty', 'Direct', 'Charming', 'Curious'];

function DeleteIcebreakerBtn({ id, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!confirm('Delete this icebreaker? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteIcebreakerAdmin(id);
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

export default function Icebreakers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const handleDelete = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  };

  const columns = [
    { key: 'email', label: 'User', render: (r) => <span className="text-gray-300">{r.users?.email || '—'}</span> },
    {
      key: 'tone', label: 'Tone',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-accent/10 text-accent">
          {r.tone || '—'}
        </span>
      ),
    },
    {
      key: 'openers', label: 'Openers',
      render: (r) => {
        const locked = (r.openers || []).filter((o) => o.locked).length;
        return <span className="text-gray-400 text-xs">{(r.openers || []).length} {locked > 0 ? `(${locked} locked)` : ''}</span>;
      },
    },
    { key: 'created_at', label: 'Date', render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—' },
    { key: 'match_bio', label: 'Their bio', render: (r) => <span className="text-gray-500 text-xs">{r.match_bio?.slice(0, 70)}…</span> },
    { key: 'actions', label: '', render: (r) => <DeleteIcebreakerBtn id={r.id} onDelete={handleDelete} /> },
  ];

  const fetchIcebreakers = useCallback(() => {
    setLoading(true);
    getIcebreakers({ tone })
      .then((d) => {
        setRows(d.icebreakers || []);
        setTotal(d.total || 0);
        setSetupRequired(!!d.setup_required);
      })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [tone]);

  // Load chart data (real tone breakdown from overview)
  useEffect(() => {
    setChartLoading(true);
    getOverview()
      .then((d) => {
        const data = (d.icebreakerToneBreakdown || []).map((t) => ({
          name: t.tone,
          count: t.count,
        }));
        setChartData(data);
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, []);

  useEffect(() => { fetchIcebreakers(); }, [fetchIcebreakers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Icebreakers</h1>
          <p className="text-sm text-gray-400">{total.toLocaleString()} total generated</p>
        </div>
        <button onClick={fetchIcebreakers} className="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
      </div>

      {setupRequired && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 mb-6 text-sm text-yellow-300">
          The <code className="text-yellow-200">icebreakers</code> table hasn&apos;t been created in Supabase yet — run the migration to start seeing data here.
        </div>
      )}

      {/* Tone breakdown chart — from real DB data */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Icebreakers by tone</h2>
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
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All tones</option>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No icebreakers yet — generate one from the app" />
        )}
      </div>
    </div>
  );
}
