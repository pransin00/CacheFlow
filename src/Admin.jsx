import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTransactionLogs from './AdminTransactionLogs';
import AdminUsers from './AdminUsers';
import AdminDashboard from './AdminDashboard';

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
    // Redirect to the login page
    navigate('/login');
  }

  if (!authenticated) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
        <form onSubmit={handleLogin} style={{ width: 420, padding: 28, borderRadius: 12, background: '#fff', boxShadow: '0 6px 24px rgba(15,30,80,0.08)' }}>
          <h2 style={{ margin: 0, marginBottom: 12, color: '#0a3cff' }}>Admin Login</h2>
          <div style={{ color: '#444', marginBottom: 18 }}>Sign in with the single admin account.</div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #e6eefc' }} placeholder="admin" />
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #e6eefc' }} placeholder="admin123" />
          {error && <div style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#0a3cff', color: '#fff', fontWeight: 700 }}>Sign in</button>
            <button type="button" onClick={() => { setUsername(ADMIN_USERNAME); setPassword(ADMIN_PASSWORD); }} style={{ padding: 10, borderRadius: 8, border: '1px solid #dbeafe', background: '#fff' }}>Fill</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: '#f6f8ff' }}>
  <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #eef2ff', padding: 20, boxSizing: 'border-box', position: 'relative', height: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: 0, color: '#0a3cff' }}>Admin</h3>
          <div style={{ color: '#666', fontSize: 13 }}>admin@gmail.com</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setSelected('dashboard')} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: selected === 'dashboard' ? '#eef4ff' : 'transparent', cursor: 'pointer', fontWeight: 700 }}>Dashboard</button>
          <button onClick={() => setSelected('transaction')} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: selected === 'transaction' ? '#eef4ff' : 'transparent', cursor: 'pointer', fontWeight: 700 }}>Transaction Logs</button>
          <button onClick={() => setSelected('user')} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: selected === 'user' ? '#eef4ff' : 'transparent', cursor: 'pointer', fontWeight: 700 }}>User</button>
        </nav>
        <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
          <button onClick={handleSignOut} style={{ padding: 10, borderRadius: 8, border: '1px solid #ffd1d1', background: '#fff', color: '#d32f2f', cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28, height: '100vh', overflow: 'auto', boxSizing: 'border-box' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 6px 20px rgba(15,30,80,0.03)' }}>
          <h2 style={{ marginTop: 0, color: '#0a3cff' }}>{selected === 'dashboard' ? 'Dashboard' : selected === 'transaction' ? 'Transaction Logs' : 'Users'}</h2>
          <div style={{ marginTop: 8, color: '#444' }}>
            {selected === 'dashboard' && (
              <AdminDashboard />
            )}

            {selected === 'transaction' && (
              <AdminTransactionLogs />
            )}

            {selected === 'user' && (
              <AdminUsers />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
