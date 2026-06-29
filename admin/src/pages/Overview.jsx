import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import { getOverview } from '../lib/api';

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(setData)
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: 'Total users', value: data?.totalUsers?.toLocaleString() ?? '—', icon: '👥' },
    { label: 'Active Pro subscribers', value: data?.activeSubscribers?.toLocaleString() ?? '—', icon: '⭐', accent: true },
    { label: 'Bios generated today', value: data?.biosToday?.toLocaleString() ?? '—', icon: '✍️' },
    { label: 'Bios generated (all time)', value: data?.totalBios?.toLocaleString() ?? '—', icon: '📝' },
    { label: 'MRR', value: data?.mrr != null ? `$${data.mrr.toLocaleString()}` : '$—', icon: '💰' },
    { label: 'AI cost this month', value: data?.aiCostMonth != null ? `$${data.aiCostMonth}` : '$—', icon: '🤖' },
    { label: 'Churn rate', value: data?.churnRate != null ? `${data.churnRate}%` : '—', icon: '📉' },
    { label: 'Avg bios per user', value: data?.avgBiosPerUser ?? '—', icon: '📊' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
      <p className="text-sm text-gray-400 mb-6">Real-time BioGen metrics</p>

      {loading ? (
        <div className="text-gray-500">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      )}
    </div>
  );
}
