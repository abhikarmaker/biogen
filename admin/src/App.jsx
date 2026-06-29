import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Users from './pages/Users';
import Revenue from './pages/Revenue';
import Bios from './pages/Bios';
import Errors from './pages/Errors';
import AICosts from './pages/AICosts';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';

function ProtectedLayout({ children }) {
  const token = localStorage.getItem('biogen_admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedLayout><Overview /></ProtectedLayout>} />
        <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
        <Route path="/revenue" element={<ProtectedLayout><Revenue /></ProtectedLayout>} />
        <Route path="/bios" element={<ProtectedLayout><Bios /></ProtectedLayout>} />
        <Route path="/errors" element={<ProtectedLayout><Errors /></ProtectedLayout>} />
        <Route path="/ai-costs" element={<ProtectedLayout><AICosts /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
