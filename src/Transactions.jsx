import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/CacheFlow_Logo.png';
import { supabase } from './supabaseClient';
import logoutIcon from './assets/logout.png';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    style={{
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
      cursor: onClick ? 'pointer' : 'default',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s, color 0.2s',
      userSelect: 'none',
      outline: 'none',
      '&:hover': {
        background: active ? '#e6edfa' : '#f5f7fa',
      }
    }}
  >
    <span style={{ fontSize: '1.3vw' }}>{icon}</span>
    {label}
  </div>
);

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [weekFilter, setWeekFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    let intervalId;
    const fetchTransactions = async () => {
      setLoading(true);
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        setLoading(false);
        return;
      }
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (accountData && accountData.id) {
        let query = supabase
          .from('transactions')
          .select('id, amount, type_id, date, transaction_status, transaction_types(name)')
          .eq('account_id', accountData.id)
          .order('date', { ascending: false });

        // Week filter
        if (weekFilter) {
          const now = new Date();
          let start, end;
          if (weekFilter === 'this') {
            // Start of this week (Monday)
            start = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            end = new Date();
          } else if (weekFilter === 'last') {
            // Start of last week (Monday)
            const lastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 6));
            start = new Date(lastWeek.setDate(lastWeek.getDate() - lastWeek.getDay() + 1));
            end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
          }
          if (start && end) {
            const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
            const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
            query = query.gte('date', startIso).lte('date', endIso);
          }
        }

        // Category filter
        if (categoryFilter) {
          query = query.eq('transaction_types.name', categoryFilter);
        }

        const { data: txs } = await query;
        setTransactions(txs || []);
      }
      setLoading(false);
    };
    fetchTransactions();
    intervalId = setInterval(fetchTransactions, 10000); // auto-refresh every 10s
    return () => clearInterval(intervalId);
  }, [weekFilter, categoryFilter]);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#fafdff', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch' }}>
      {/* Sidebar */}
      <div style={{
        width: '16vw',
        minWidth: 180,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(10,60,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '2vw 0 2vw 0',
        gap: '1vw',
        boxSizing: 'border-box',
        zIndex: 100,
      }}>
        <img src={logo} alt="CacheFlow Logo" style={{ width: '10vw', margin: '0 0 2vw 2vw', alignSelf: 'flex-start' }} />
        <div style={{ width: '100%', marginTop: '2vw' }}>
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#9776;</span>} label="Overview" onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#8596;</span>} label="Transactions" active onClick={() => navigate('/transactions')} />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#128205;</span>} label="Maps" onClick={() => navigate('/maps')} />
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
  <div style={{ flex: 1, padding: '2vw', minHeight: '80vh', background: '#fafdff', marginLeft: '16vw' }}>
        <h2 style={{ color: '#1856c9', fontWeight: 700, marginBottom: '2vw' }}>All Transactions</h2>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '2vw', marginBottom: '2vw', alignItems: 'center' }}>
          <div>
            <label style={{ fontWeight: 500, marginRight: '0.7vw' }}>Week:</label>
            <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)} style={{ padding: '0.4vw 1vw', borderRadius: '0.5vw', fontSize: '1vw' }}>
              <option value=''>All</option>
              <option value='this'>This Week</option>
              <option value='last'>Last Week</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 500, marginRight: '0.7vw' }}>Category:</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.4vw 1vw', borderRadius: '0.5vw', fontSize: '1vw' }}>
              <option value=''>All</option>
              <option value='Fund Transfer'>Fund Transfer</option>
              <option value='Bank Transfer'>Bank Transfer</option>
              <option value='Bill Payment'>Bill Payment</option>
              <option value='Cardless Withdrawal'>Cardless Withdrawal</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <span className="loader" style={{ display: 'inline-block', width: 48, height: 48, border: '5px solid #1856c9', borderTop: '5px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ color: '#888' }}>No transactions found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1vw', background: '#fff', borderRadius: '1vw', boxShadow: '0 2px 12px rgba(10,60,255,0.06)' }}>
            <thead>
              <tr style={{ background: '#e6edfa', color: '#1856c9', fontWeight: 700 }}>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f5f7fa' }}>
                  <td style={{ padding: '0.7vw', color: '#222' }}>{tx.date ? new Date(tx.date).toLocaleString() : ''}</td>
                  <td style={{ padding: '0.7vw', color: '#1976d2' }}>{tx.transaction_types?.name || 'Transaction'}</td>
                  <td style={{ padding: '0.7vw', textAlign: 'right', fontWeight: 700, color: tx.amount < 0 ? '#e53935' : '#43a047' }}>
                    {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.7vw', color: '#888' }}>{tx.transaction_status || ''}</td>
                  <td style={{ padding: '0.7vw', color: '#888' }}>{tx.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
