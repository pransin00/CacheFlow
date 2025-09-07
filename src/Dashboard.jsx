import React, { useEffect, useState } from 'react';
import logo from './assets/CacheFlow_Logo.png';
import { supabase } from './supabaseClient';
import overviewIcon from './assets/overview.png';
import historyIcon from './assets/history.png';
import userIcon from './assets/user.png';
import logoutIcon from './assets/logout.png';
import viewPng from './assets/view.png';
import hidePng from './assets/hide.png';

const SidebarItem = ({ icon, label, active }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1vw',
    padding: '0.8vw 2vw',
    fontWeight: active ? 700 : 500,
    fontSize: '1.1vw',
    color: active ? '#0a3cff' : '#888',
    background: active ? '#e6edfa' : 'none',
    borderRadius: '0.7vw',
    marginBottom: '0.7vw',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  }}>
    <span style={{ fontSize: '1.3vw' }}>{icon}</span>
    {label}
  </div>
);

const ActionButton = ({ label, icon }) => (
  <div style={{
    background: '#fafdff',
    borderRadius: '1vw',
    boxShadow: '0 4px 16px rgba(10,60,255,0.08)',
    padding: '2vw 2vw 1.2vw 2vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '160px',
    maxWidth: '200px',
    width: '100%',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1.1vw',
    color: '#1976d2',
    justifyContent: 'center',
    margin: '0 1vw',
    boxSizing: 'border-box',
  }}>
    {icon}
    <div style={{ marginTop: '0.7vw' }}>{label}</div>
  </div>
);

const transactionRowStyle = (amount) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '0.7vw',
  width: '100%',
  fontSize: '1vw',
  fontWeight: 500,
  color: amount < 0 ? '#e53935' : '#43a047',
});

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([
    // Demo data for screenshot
    { name: 'Young Lifters Program', date: '29–Aug–2025', amount: -50000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: 10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: -10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: 10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: -10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: 10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: -10000 },
    { name: 'Oluwabern Jamin', date: '06.Mar.2023 - 09:39', amount: 10000 },
  ]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user_id = localStorage.getItem('user_id');
      console.log('Dashboard: user_id from localStorage:', user_id);
      if (!user_id) return;
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('firstname, lastname')
          .eq('id', user_id)
          .single();
        console.log('Dashboard: userData from Supabase:', userData, 'error:', userError);
        const { data: accountData, error: accError } = await supabase
          .from('accounts')
          .select('account_number, balance')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setUser(userData);
        setAccount(accountData);
      } catch (error) {
        console.error('Error fetching user/account info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    window.location.href = '/login';
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#fafdff',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '16vw',
        minWidth: 180,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(10,60,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '2vw 0 2vw 0',
        gap: '1vw',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        <img src={logo} alt="CacheFlow Logo" style={{ width: '10vw', margin: '0 0 2vw 2vw', alignSelf: 'flex-start' }} />
        <div style={{ width: '100%', marginTop: '2vw' }}>
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#9776;</span>} label="Overview" active />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#8596;</span>} label="Transactions" />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#128100;</span>} label="Profile" />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: '100%', marginBottom: '2vw' }}>
          <div onClick={() => setShowLogoutModal(true)}>
            <SidebarItem icon={<img src={logoutIcon} alt="Logout" style={{width:'1.5vw',height:'1.5vw',objectFit:'contain'}} />} label={<span style={{color:'#e53935',fontWeight:700}}>Logout</span>} />
          </div>
        </div>
      </div>
      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1vw',
            padding: '2vw 3vw',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            minWidth: 300,
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: '1.2vw', marginBottom: '1vw' }}>Are you sure you want to log out?</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2vw' }}>
              <button onClick={handleLogout} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: '0.5vw', padding: '0.7vw 2vw', fontWeight: 600, fontSize: '1vw', cursor: 'pointer' }}>Log out</button>
              <button onClick={() => setShowLogoutModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: '0.5vw', padding: '0.7vw 2vw', fontWeight: 600, fontSize: '1vw', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '2vw 3vw 2vw 3vw',
        background: 'transparent',
      }}>
        {/* Top Row: Overview + Account Number */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ fontWeight: 700, fontSize: '2vw', color: '#222', marginBottom: '2vw', marginTop: '0.5vw' }}>Overview</div>
          <div style={{ textAlign: 'right', marginTop: '0.5vw' }}>
            <div style={{ fontSize: '1vw', color: '#1976d2', fontWeight: 500, marginBottom: '0.2vw' }}>
              {user && user.firstname && user.lastname
                ? `${user.firstname} ${user.lastname}`
                : ''}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.7vw', color: '#222', letterSpacing: '1px' }}>{account ? account.account_number : '1234567890'}</div>
          </div>
        </div>
        {/* Main Row: Balance + Actions + Transactions */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '2vw', alignItems: 'flex-start', marginTop: '1vw' }}>
          {/* Left: Balance + Actions */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '1.1vw', color: '#222', marginBottom: '1vw', marginLeft: '2vw' }}>Current Account Balance</div>
            <div style={{
              width: '45vw',
              maxWidth: 700,
              minWidth: 320,
              margin: '0 auto',
              background: '#b8e0ff',
              borderRadius: '1vw',
              padding: '2vw 2vw 2vw 2vw',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              position: 'relative',
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(10,60,255,0.08)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginRight: '1vw', width: '100%' }}>
                <span style={{ fontWeight: 600, fontSize: '1vw', color: '#3b3bb3', marginBottom: '0.2vw', alignSelf: 'flex-end' }}>Current Balance</span>
                <span style={{ fontWeight: 700, fontSize: '2vw', color: '#222', alignSelf: 'flex-end' }}>
                  {showBalance && account && account.balance !== undefined
                    ? account.balance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})
                    : showBalance ? '0.00' : '******'}
                </span>
              </div>
              <button
                onClick={() => setShowBalance((prev) => !prev)}
                style={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: '0.7vw',
                  width: '2.5vw',
                  height: '2.5vw',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  marginLeft: '1vw',
                  padding: 0,
                }}
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                <img
                  src={showBalance ? viewPng : hidePng}
                  alt={showBalance ? 'Hide balance' : 'Show balance'}
                  style={{ width: '1.5vw', height: '1.5vw', objectFit: 'contain' }}
                />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2vw', margin: '2vw auto 0 auto', width: '32vw', maxWidth: 500, minWidth: 320, justifyContent: 'center' }}>
              <ActionButton label='Fund Transfer' icon={<span style={{ fontSize: '2.2vw' }}>&#128640;</span>} />
              <ActionButton label='Pay Bills' icon={<span style={{ fontSize: '2.2vw' }}>&#128179;</span>} />
              <ActionButton label='Withdrawal' icon={<span style={{ fontSize: '2.2vw' }}>&#128184;</span>} />
            </div>
          </div>
          {/* Right: Transactions Panel */}
          <div style={{
            flex: 1,
            background: '#fff',
            borderRadius: '1vw',
            boxShadow: '0 2px 12px rgba(10,60,255,0.06)',
            padding: '2vw 1vw',
            minWidth: '260px',
            maxWidth: '28vw',
            width: '100%',
            maxHeight: '60vh',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1vw' }}>
              <div style={{ fontWeight: 700, fontSize: '1.3vw', color: '#222' }}>Transactions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5vw' }}>
                <input type='date' style={{ border: '1px solid #e6edfa', borderRadius: '0.4vw', padding: '0.3vw 0.7vw', fontSize: '0.9vw', background: '#fafdff' }} />
                <span style={{ fontSize: '1.1vw', color: '#1976d2', cursor: 'pointer' }}>&#8594;</span>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              {transactions.map((tx, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7vw', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#222', fontSize: '1vw' }}>{tx.name}</div>
                    <div style={{ color: '#888', fontSize: '0.8vw' }}>{tx.date}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1vw', color: tx.amount < 0 ? '#e53935' : '#43a047' }}>
                    {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
