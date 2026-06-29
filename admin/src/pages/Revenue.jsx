import React from 'react';
import MetricCard from '../components/MetricCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EMPTY_DATA = MONTHS.map((month) => ({ month, mrr: 0 }));

export default function Revenue() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Revenue</h1>
      <p className="text-sm text-gray-400 mb-6">Stripe billing overview</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="MRR" value="$—" icon="💰" accent />
        <MetricCard label="New subs this month" value="—" icon="📈" />
        <MetricCard label="Churned this month" value="—" icon="📉" />
        <MetricCard label="One-time purchases" value="$—" icon="🛒" />
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">MRR — Last 12 months</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={EMPTY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
            <XAxis dataKey="month" tick={{ fill: '#6B6B8A', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B6B8A', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#7B61FF' }}
            />
            <Line type="monotone" dataKey="mrr" stroke="#7B61FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-600 mt-3 text-center">Connect Stripe to see live revenue data</p>
      </div>
    </div>
  );
}
