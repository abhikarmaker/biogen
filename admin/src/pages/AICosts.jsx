import React from 'react';
import MetricCard from '../components/MetricCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const AVG_COST_PER_BIO = 0.00006;
const EMPTY_DATA = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, calls: 0 }));

export default function AICosts() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">AI Costs</h1>
      <p className="text-sm text-gray-400 mb-6">Gemini API usage estimates</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="API calls today" value="—" icon="🤖" />
        <MetricCard label="API calls this month" value="—" icon="📡" />
        <MetricCard label="Est. cost today" value="$—" icon="💸" />
        <MetricCard label="Est. cost this month" value="$—" icon="💰" accent />
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Daily API calls — last 30 days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={EMPTY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
            <XAxis dataKey="day" tick={{ fill: '#6B6B8A', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6B6B8A', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#13132B', border: '1px solid #2A2A4A', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#7B61FF' }}
            />
            <Line type="monotone" dataKey="calls" stroke="#7B61FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-600 mt-3 text-center">Connect the backend to see live Gemini usage</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Pricing reference</h2>
        <p className="text-sm text-gray-300">
          Model: <code className="text-accent">gemini-1.5-flash</code>
        </p>
        <p className="text-sm text-gray-300 mt-1">
          Est. cost per bio: <code className="text-accent">${AVG_COST_PER_BIO.toFixed(6)}</code>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Based on ~200 input + 150 output tokens per bio at Gemini Flash pricing.
        </p>
      </div>
    </div>
  );
}
