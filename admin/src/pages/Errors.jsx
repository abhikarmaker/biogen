import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { getErrors } from '../lib/api';
import { markErrorsSeen } from '../lib/notifications';
import { format } from 'date-fns';

const COLUMNS = [
  { key: 'type', label: 'Type', render: (r) => <span className="text-red-400">{r.type}</span> },
  { key: 'message', label: 'Message' },
  { key: 'endpoint', label: 'Endpoint', render: (r) => <code className="text-xs text-gray-400">{r.endpoint || '—'}</code> },
  {
    key: 'created_at',
    label: 'When',
    render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, HH:mm') : '—',
  },
];

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT,
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

export default function Errors() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    markErrorsSeen();
    getErrors()
      .then((d) => {
        if (d.setup_required) setSetupRequired(true);
        setRows(d.errors || []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Errors & Logs</h1>
      <p className="text-sm text-gray-400 mb-6">Last 100 API errors</p>

      {setupRequired && (
        <div className="mb-5 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-5">
          <p className="text-sm font-semibold text-yellow-400 mb-2">Table not set up yet</p>
          <p className="text-xs text-gray-400 mb-3">
            Run this SQL in Supabase → SQL Editor to enable error logging:
          </p>
          <pre className="bg-bg border border-border rounded-lg p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {SETUP_SQL}
          </pre>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            emptyMessage={setupRequired ? 'No errors yet (table just created)' : 'No errors logged 🎉'}
          />
        )}
      </div>
    </div>
  );
}
