import React from 'react';

export default function MetricCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold ${accent ? 'text-accent' : 'text-white'}`}>
        {value ?? '—'}
      </div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
