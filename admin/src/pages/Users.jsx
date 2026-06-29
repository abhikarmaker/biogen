import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { getUsers, updateUserPlan, deleteUser } from '../lib/api';
import { format, formatDistanceToNow } from 'date-fns';

function PlanBadge({ plan }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
      plan === 'pro' ? 'bg-accent/20 text-accent' : 'bg-gray-700 text-gray-300'
    }`}>
      {plan?.toUpperCase()}
    </span>
  );
}

function PlanToggle({ user, onToggle }) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = user.plan === 'pro' ? 'free' : 'pro';
    try { await updateUserPlan(user.id, next); } catch { /* no-op */ }
    onToggle(user.id, next);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="text-xs px-3 py-1.5 border border-border rounded-lg text-gray-300 hover:border-accent hover:text-accent transition-colors"
    >
      {loading ? '...' : user.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
    </button>
  );
}

function DeleteUserBtn({ userId, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!confirm('Delete this user and all their bios? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteUser(userId);
      onDelete(userId);
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
      className="text-xs px-3 py-1.5 border border-red-800 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors ml-2"
    >
      {loading ? '...' : 'Delete'}
    </button>
  );
}

export default function Users() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);

  const handleToggle = (id, newPlan) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, plan: newPlan } : r));
  const handleDelete = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  };

  const proCount = rows.filter((r) => r.plan === 'pro').length;
  const conversionPct = rows.length > 0 ? ((proCount / rows.length) * 100).toFixed(0) : 0;

  const columns = [
    { key: 'email', label: 'Email', render: (r) => <span className="text-white">{r.email}</span> },
    { key: 'plan', label: 'Plan', render: (r) => <PlanBadge plan={r.plan} /> },
    { key: 'bio_count', label: 'Bios', render: (r) => <span className="text-gray-300">{r.bio_count ?? 0}</span> },
    {
      key: 'last_active_at', label: 'Last active',
      render: (r) => r.last_active_at
        ? <span className="text-gray-400">{formatDistanceToNow(new Date(r.last_active_at), { addSuffix: true })}</span>
        : <span className="text-gray-600">—</span>,
    },
    {
      key: 'created_at', label: 'Joined',
      render: (r) => r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—',
    },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex items-center">
          <PlanToggle user={r} onToggle={handleToggle} />
          <DeleteUserBtn userId={r.id} onDelete={handleDelete} />
        </div>
      ),
    },
  ];

  const fetchUsers = useCallback(() => {
    setLoading(true);
    getUsers({ search, plan })
      .then((d) => { setRows(d.users || []); setTotal(d.total || 0); })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [search, plan]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} total
            {!loading && rows.length > 0 && (
              <span className="ml-2 text-accent font-medium">{conversionPct}% Pro</span>
            )}
          </p>
        </div>
        <button onClick={fetchUsers} className="text-sm text-gray-400 hover:text-white transition-colors">
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent w-72 transition-colors"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <DataTable columns={columns} rows={rows} emptyMessage="No users yet" />
        )}
      </div>
    </div>
  );
}
