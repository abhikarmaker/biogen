import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { getOverview } from '../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

function StatusBadge({ status }) {
  const color = status === 'active'
    ? 'bg-green-900/40 text-green-400'
    : status === 'canceled'
    ? 'bg-red-900/30 text-red-400'
    : 'bg-gray-700 text-gray-400';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}

const SUB_COLUMNS = [
  { key: 'email', label: 'User', render: (r) => <span className="text-gray-300">{r.users?.email || '—'}</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  {
    key: 'created_at', label: 'Started',
    render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—',
  },
  {
    key: 'expires_at', label: 'Expires',
    render: (r) => r.expires_at
      ? <span className="text-gray-400">{format(new Date(r.expires_at), 'MMM d, yyyy')}</span>
      : <span className="text-gray-600">—</span>,
  },
];

export default function Revenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getOverview()
      .then(setData)
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const subs = data?.recentSubscriptions || [];
  const activeSubs = subs.filter((s) => s.status === 'active').length;
  const canceledSubs = subs.filter((s) => s.status === 'canceled').length;

  // Build a subscription trend from creation dates
  const subTrend = (() => {
    const map = {};
    subs.forEach((s) => {
      const day = s.created_at?.slice(0, 10);
      if (day) map[day] = (map[day] || 0) + 1;
    });
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { date: format(parseISO(key), 'MMM d'), count: map[key] || 0 };
    });
  })();

  const metrics = [
    { label: 'Active subscriptions', value: data?.activeSubscribers?.toLocaleString() ?? '—', icon: '⭐', accent: true },
    { label: 'Pro users', value: data?.proUsers?.toLocaleString() ?? '—', icon: '👑' },
    { label: 'Conversion rate', value: data?.conversionRate != null ? `${data.conversionRate}%` : '—', icon: '📈' },
    { label: 'MRR (estimate)', value: data?.activeSubscribers != null ? `$${(data.activeSubscribers * 4.99).toFixed(0)}` : '$—', icon: '💰', accent: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <button onClick={refresh} className="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Subscription overview from the database</p>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
          </div>

          {/* Subscription activity chart */}
          <div className="bg-surface border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-1">New subscriptions</h2>
            <p className="text-xs text-gray-500 mb-4">Last 30 days · based on latest 20 records</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={subTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#55556B', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fill: '#55556B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', fontSize: 12 }}
                  formatter={(v) => [v, 'new subs']}
                />
                <Area type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={2} fill="url(#subGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Subscriptions table */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Recent subscriptions</h2>
              <p className="text-xs text-gray-500">Last 20 records</p>
            </div>
            {subs.length === 0 ? (
              <div className="text-gray-600 text-sm py-4">
                No subscriptions yet. Connect Stripe to start accepting payments.
              </div>
            ) : (
              <DataTable columns={SUB_COLUMNS} rows={subs} emptyMessage="No subscriptions" />
            )}
          </div>

          {!data?.activeSubscribers && (
            <p className="text-xs text-gray-600 mt-4 text-center">
              Connect Stripe to enable live revenue tracking and webhook events.
            </p>
          )}
        </>
      )}
    </div>
  );
}
