import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTransactionLogs from './AdminTransactionLogs/AdminTransactionLogs';
import AdminUsers from './AdminUsers/AdminUsers';
import AdminDashboard from './AdminDashboard/AdminDashboard';
import './Admin.css';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selected, setSelected] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    if (ok === 'true') {
      setAuthenticated(true);
    } else {
      // Not authenticated, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  function handleSignOut() {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_pin');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    setAuthenticated(false);
    navigate('/login');
  }

  if (!authenticated) {
    // Redirect handled in useEffect
    return null;
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Admin</h3>
          <div className="admin-email">admin@gmail.com</div>
        </div>
        <nav className="admin-nav">
          <button onClick={() => setSelected('dashboard')} className={`admin-nav-btn ${selected === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
          <button onClick={() => setSelected('transaction')} className={`admin-nav-btn ${selected === 'transaction' ? 'active' : ''}`}>Transaction Logs</button>
          <button onClick={() => setSelected('user')} className={`admin-nav-btn ${selected === 'user' ? 'active' : ''}`}>User</button>
        </nav>
        <div className="admin-signout">
          <button onClick={handleSignOut} className="admin-signout-btn">Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main-card">
          <h2 className="admin-main-title">{selected === 'dashboard' ? 'Dashboard' : selected === 'transaction' ? 'Transaction Logs' : 'Users'}</h2>
          <div className="admin-main-body">
            {selected === 'dashboard' && <AdminDashboard />}
            {selected === 'transaction' && <AdminTransactionLogs />}
            {selected === 'user' && <AdminUsers />}
          </div>
        </div>
      </main>
    </div>
  );
}
