import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/',          label: 'Overview',  icon: '📊' },
  { to: '/users',     label: 'Users',     icon: '👥' },
  { to: '/revenue',   label: 'Revenue',   icon: '💰' },
  { to: '/bios',      label: 'Bios',      icon: '✍️' },
  { to: '/errors',    label: 'Errors',    icon: '🚨' },
  { to: '/ai-costs',  label: 'AI Costs',  icon: '🤖' },
  { to: '/settings',  label: 'Settings',  icon: '⚙️' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('biogen_admin_token');
    navigate('/login');
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-xs font-bold">
            ⚡
          </div>
          <span className="font-bold text-base text-white">BioGen</span>
          <span className="text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded">
            ADMIN
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/20 text-white'
                  : 'text-gray-400 hover:bg-surface-high hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-surface-high hover:text-white transition-colors"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
