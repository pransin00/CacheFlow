import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AdminTransactionLogs from './AdminTransactionLogs/AdminTransactionLogs';
import AdminUsers from './AdminUsers/AdminUsers';
import AdminDashboard from './AdminDashboard/AdminDashboard';
import './Admin.css';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selected, setSelected] = useState('dashboard');
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    if (ok === 'true') {
      setAuthenticated(true);
      loadAdminData();
    } else {
      // Not authenticated, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  async function loadAdminData() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setAdminData(data);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  }

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
        <div 
          className="admin-sidebar-header" 
          style={{ cursor: 'pointer' }}
          onClick={() => setShowAdminProfile(true)}
        >
          <h3>Admin</h3>
          <div className="admin-email">{adminData?.username || 'admin@gmail.com'}</div>
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

      {showAdminProfile && adminData && (
        <div className="modal-overlay" onClick={() => setShowAdminProfile(false)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Admin Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, fontSize: 14 }}>
                <strong>User ID:</strong><span>{adminData.id}</span>
                <strong>Username:</strong><span>{adminData.username || 'N/A'}</span>
                <strong>Full Name:</strong><span>{`${adminData.first_name || ''} ${adminData.middle_name || ''} ${adminData.last_name || ''}`.trim() || 'N/A'}</span>
                <strong>Contact:</strong><span>{adminData.contact_number || 'N/A'}</span>
                <strong>Role:</strong><span style={{ color: '#d32f2f', fontWeight: 600 }}>{adminData.role || 'admin'}</span>
              </div>
              
              <div style={{ marginTop: 20, padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12, fontSize: 15 }}>Reset Credentials</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={async () => {
                      const newPassword = prompt('Enter new password:');
                      if (!newPassword) return;
                      
                      const { hashPassword } = await import('../../utils/hashUtils');
                      const hashedPassword = await hashPassword(newPassword);
                      
                      const { error } = await supabase
                        .from('users')
                        .update({ password: hashedPassword })
                        .eq('id', adminData.id);
                      
                      if (error) {
                        alert('Failed to reset password');
                      } else {
                        alert('Password reset successfully');
                        setShowAdminProfile(false);
                      }
                    }}
                    style={{ padding: '8px 12px', borderRadius: 6, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Reset Password
                  </button>
                  <button 
                    onClick={async () => {
                      const newPin = prompt('Enter new 4-digit PIN:');
                      if (!newPin || !/^\d{4}$/.test(newPin)) {
                        alert('PIN must be 4 digits');
                        return;
                      }
                      
                      const { hashPassword } = await import('../../utils/hashUtils');
                      const hashedPin = await hashPassword(newPin);
                      
                      const { error } = await supabase
                        .from('users')
                        .update({ pin: hashedPin })
                        .eq('id', adminData.id);
                      
                      if (error) {
                        alert('Failed to reset PIN');
                      } else {
                        alert('PIN reset successfully');
                        setShowAdminProfile(false);
                      }
                    }}
                    style={{ padding: '8px 12px', borderRadius: 6, background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    Reset PIN
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button onClick={() => setShowAdminProfile(false)} className="modal-btn modal-cancel">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
