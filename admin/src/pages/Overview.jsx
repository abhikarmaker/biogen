import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { getOverview } from '../lib/api';
import { format, parseISO } from 'date-fns';

const PLATFORM_LABELS = {
  linkedin: 'LinkedIn', instagram: 'Instagram', twitter: 'X', threads: 'Threads',
  tiktok: 'TikTok', youtube: 'YouTube', hinge: 'Hinge', bumble: 'Bumble',
  tinder: 'Tinder', github: 'GitHub', discord: 'Discord', reddit: 'Reddit',
  substack: 'Substack', medium: 'Medium', patreon: 'Patreon', fiverr: 'Fiverr',
  facebook: 'Facebook', snapchat: 'Snapchat', pinterest: 'Pinterest',
  telegram: 'Telegram', whatsapp: 'WhatsApp', spotify: 'Spotify', twitch: 'Twitch',
  mastodon: 'Mastodon', bereal: 'BeReal',
};

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 },
  labelStyle: { color: '#fff', fontSize: 12 },
  itemStyle: { color: '#7B61FF' },
};

function TrendChart({ data, color = '#7B61FF', label }) {
  const formatted = (data || []).map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#55556B', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis tick={{ fill: '#55556B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...CHART_STYLE} formatter={(v) => [v, label]} />
        <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PlatformBar({ data }) {
  const formatted = (data || []).slice(0, 8).map((d) => ({
    name: PLATFORM_LABELS[d.platform] || d.platform,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
        <XAxis type="number" tick={{ fill: '#55556B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#8B8BAA', fontSize: 11 }} tickLine={false} axisLine={false} width={68} />
        <Tooltip {...CHART_STYLE} formatter={(v) => [v, 'bios']} />
        <Bar dataKey="count" fill="#7B61FF" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ActivityItem({ icon, title, sub, time }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <span className="text-xs text-gray-600 shrink-0 mt-0.5">{time}</span>
    </div>
  );
}

export default function Overview() {
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

  const metrics = [
    { label: 'Total users',        value: data?.totalUsers?.toLocaleString() ?? '—',       icon: '👥' },
    { label: 'Pro subscribers',    value: data?.proUsers?.toLocaleString() ?? '—',          icon: '⭐', accent: true },
    { label: 'Conversion rate',    value: data?.conversionRate != null ? `${data.conversionRate}%` : '—', icon: '📈' },
    { label: 'Bios generated',     value: data?.totalBios?.toLocaleString() ?? '—',         icon: '✍️' },
    { label: 'New users today',    value: data?.newUsersToday?.toLocaleString() ?? '—',     icon: '🆕' },
    { label: 'New users this week',value: data?.newUsersThisWeek?.toLocaleString() ?? '—',  icon: '📅' },
    { label: 'Bios today',         value: data?.biosToday?.toLocaleString() ?? '—',         icon: '📝' },
    { label: 'Avg bios / user',    value: data?.avgBiosPerUser ?? '—',                      icon: '📊' },
  ];

  // Merge and sort recent activity
  const activity = [
    ...(data?.recentUsers || []).map((u) => ({
      type: 'signup',
      icon: '👤',
      title: u.email,
      sub: `Signed up · ${u.plan === 'pro' ? '⭐ Pro' : 'Free'}`,
      ts: u.created_at,
    })),
    ...(data?.recentBios || []).map((b) => ({
      type: 'bio',
      icon: '✍️',
      title: b.users?.email || 'Unknown',
      sub: `Generated a bio on ${PLATFORM_LABELS[b.platform] || b.platform}${b.tone ? ` · ${b.tone}` : ''}`,
      ts: b.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <button
          onClick={refresh}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ↻ Refresh
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Real-time BioGen metrics</p>

      {loading ? (
        <div className="text-gray-500">Loading metrics...</div>
      ) : (
        <>
          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">User signups</h2>
              <p className="text-xs text-gray-500 mb-4">Last 30 days</p>
              <TrendChart data={data?.signupsTrend} color="#7B61FF" label="signups" />
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">Bios generated</h2>
              <p className="text-xs text-gray-500 mb-4">Last 30 days</p>
              <TrendChart data={data?.biosTrend} color="#4ADE80" label="bios" />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Platform breakdown */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">Top platforms</h2>
              <p className="text-xs text-gray-500 mb-4">Bios generated · last 30 days</p>
              {(data?.platformBreakdown || []).length === 0 ? (
                <p className="text-xs text-gray-600">No data yet</p>
              ) : (
                <PlatformBar data={data.platformBreakdown} />
              )}
            </div>

            {/* Recent activity */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Recent activity</h2>
              {activity.length === 0 ? (
                <p className="text-xs text-gray-600">No activity yet</p>
              ) : (
                <div>
                  {activity.map((a, i) => (
                    <ActivityItem
                      key={i}
                      icon={a.icon}
                      title={a.title}
                      sub={a.sub}
                      time={format(new Date(a.ts), 'MMM d, HH:mm')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
