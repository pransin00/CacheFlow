import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTransactionLogs from './AdminTransactionLogs/AdminTransactionLogs';
import AdminUsers from './AdminUsers/AdminUsers';
import AdminDashboard from './AdminDashboard/AdminDashboard';
import './Admin.css';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    if (ok === 'true') setAuthenticated(true);
  }, []);

  function handleLogin(e) {
    e && e.preventDefault();
    setError('');
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_authenticated', 'true');
      setAuthenticated(true);
    } else {
      setError('Invalid admin credentials');
    }
  }

  function handleSignOut() {
    localStorage.removeItem('admin_authenticated');
    setAuthenticated(false);
    setUsername('');
    setPassword('');
    setSelected('transaction');
    navigate('/login');
  }

  if (!authenticated) {
    return (
      <div className="admin-login-root">
        <form onSubmit={handleLogin} className="admin-login-form">
          <h2 className="admin-login-title">Admin Login</h2>
          <div className="admin-login-sub">Sign in with the single admin account.</div>
          <label className="admin-label">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="admin-input" placeholder="admin" />
          <label className="admin-label">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="admin-input" placeholder="admin123" />
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-login-actions">
            <button type="submit" className="admin-btn admin-btn-primary">Sign in</button>
            <button type="button" onClick={() => { setUsername(ADMIN_USERNAME); setPassword(ADMIN_PASSWORD); }} className="admin-btn admin-btn-outline">Fill</button>
          </div>
        </form>
      </div>
    );
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
