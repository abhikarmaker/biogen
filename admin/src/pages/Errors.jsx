import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { getErrors } from '../lib/api';
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

export default function Errors() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getErrors()
      .then((d) => setRows(d.errors))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Errors & Logs</h1>
      <p className="text-sm text-gray-400 mb-6">Last 100 API errors</p>

      <div className="bg-surface border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <DataTable columns={COLUMNS} rows={rows} emptyMessage="No errors logged 🎉" />
        )}
      </div>
    </div>
  );
}
