import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import AdminTransactionLogs from './AdminTransactionLogs/AdminTransactionLogs';
import AdminUsers from './AdminUsers/AdminUsers';
import AdminDashboard from './AdminDashboard/AdminDashboard';
import ResetPassword from '../ResetPassword/ResetPassword';
import PinManageModal from '../../Modals/PinManageModal/PinManageModal';
import './Admin.css';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selected, setSelected] = useState('dashboard');
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPinManage, setShowPinManage] = useState(false);
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
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>Admin Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => {
                  setShowAdminProfile(false);
                  setShowResetPassword(true);
                }}
                style={{ padding: '12px 16px', borderRadius: 6, background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                Reset Password
              </button>
              <button 
                onClick={() => {
                  setShowAdminProfile(false);
                  setShowPinManage(true);
                }}
                style={{ padding: '12px 16px', borderRadius: 6, background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
              >
                Reset PIN
              </button>
            </div>
            
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button onClick={() => setShowAdminProfile(false)} className="modal-btn modal-cancel">Close</button>
            </div>
          </div>
        </div>
      )}

      {showResetPassword && (
        <ResetPassword 
          onClose={() => setShowResetPassword(false)} 
          onSuccess={() => {
            setShowResetPassword(false);
            alert('Password reset successfully');
          }}
        />
      )}

      {showPinManage && adminData && (
        <PinManageModal 
          onClose={() => setShowPinManage(false)}
          currentPin={adminData.pin}
          onSuccess={() => {
            setShowPinManage(false);
            alert('PIN reset successfully');
            loadAdminData();
          }}
        />
      )}
    </div>
  );
}
