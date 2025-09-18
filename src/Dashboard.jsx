import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/CacheFlow_Logo.png';
import { supabase } from './supabaseClient';
import overviewIcon from './assets/overview.png';
import historyIcon from './assets/history.png';
import userIcon from './assets/user.png';
import logoutIcon from './assets/logout.png';
import viewPng from './assets/view.png';
import hidePng from './assets/hide.png';
import Modal from './Modal';
import FundTransferModal from './FundTransferModal';
import BankTransferModal from './BankTransferModal';
import BillPaymentModal from './BillPaymentModal';

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

const ActionButton = ({ label, icon, onClick }) => (
  <div onClick={onClick} style={{
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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showFundTransferModal, setShowFundTransferModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showBillPaymentModal, setShowBillPaymentModal] = useState(false);
  // BillPaymentModal now uses only static billers. No billers state or fetch needed.

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('firstname, lastname')
          .eq('id', user_id)
          .single();
        const { data: accountData } = await supabase
          .from('accounts')
          .select('id, account_number, balance')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setUser(userData);
        setAccount(accountData);
        // Fetch transactions for this account and filterDate
        if (accountData && accountData.id) {
          const dateObj = new Date(filterDate);
          const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
          const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
          const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
          const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
          let query = supabase
            .from('transactions')
            .select('id, amount, type_id, date, transaction_types(name)')
            .eq('account_id', accountData.id)
            .gte('date', startIso)
            .lte('date', endIso)
            .order('date', { ascending: false });
          if (categoryFilter) {
            query = query.eq('transaction_types.name', categoryFilter);
          }
          const { data: txs } = await query;
          setTransactions(txs || []);
        }
      } catch (error) {
        console.error('Error fetching user/account info:', error);
      }
    };
    fetchUserInfo();
  }, [filterDate, categoryFilter]);

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
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#9776;</span>} label="Overview" active onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#8596;</span>} label="Transactions" onClick={() => navigate('/transactions')} />
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
      {/* Fund Transfer Modal */}
      <FundTransferModal
        isOpen={showFundTransferModal}
        onClose={() => setShowFundTransferModal(false)}
        onTransferSuccess={() => {
          // Re-fetch transactions after successful transfer
          (async () => {
            const user_id = localStorage.getItem('user_id');
            if (!user_id) return;
            const { data: accountData } = await supabase
              .from('accounts')
              .select('id, account_number, balance')
              .eq('user_id', user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            setAccount(accountData);
            if (accountData && accountData.id) {
              const dateObj = new Date(filterDate);
              const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
              const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
              const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
              const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
              const { data: txs } = await supabase
                .from('transactions')
                .select('id, amount, type_id, date, transaction_types(name)')
                .eq('account_id', accountData.id)
                .gte('date', startIso)
                .lte('date', endIso)
                .order('date', { ascending: false });
              setTransactions(txs || []);
            }
          })();
        }}
      />
      <BankTransferModal
        isOpen={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
        onConfirm={(data) => {
          // Placeholder: handle bank transfer logic here
          setShowBankTransferModal(false);
        }}
      />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.8vw', marginTop: '0.5vw' }}>
            {/* Name and Account Number stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ color: '#1976d2', fontWeight: 500, fontSize: '1.2vw' }}>
                {user && user.firstname && user.lastname
                  ? `${user.firstname} ${user.lastname}`
                  : ''}
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.7vw', color: '#222', letterSpacing: '1px', marginTop: '0.2vw' }}>
                {account ? account.account_number : '1234567890'}
              </span>
            </div>
            {/* Initials Icon - now navigates to profile */}
            {user && user.firstname && user.lastname && (
              <span
                onClick={() => navigate('/profile')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '3.5vw',
                  height: '3.5vw',
                  borderRadius: '50%',
                  background: '#1856c9',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.6vw',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(24,86,201,0.15)',
                  userSelect: 'none',
                  border: '3px solid #fff',
                  marginLeft: '0.5vw',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                title={`${user.firstname} ${user.lastname}`}
              >
                {user.firstname[0]}{user.lastname[0]}
              </span>
            )}
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
            {/* Action Buttons aligned with balance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '2vw',
              margin: '2vw auto 0 auto',
              width: 'max-content',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {/* Top row: Fund Transfer, Pay Bills, Withdrawal */}
              <ActionButton label='Fund Transfer' icon={<span style={{ fontSize: '2.2vw' }}>&#128640;</span>} onClick={() => setShowFundTransferModal(true)} />
              <ActionButton label='Pay Bills' icon={<span style={{ fontSize: '2.2vw' }}>&#128179;</span>} onClick={() => setShowBillPaymentModal(true)} />
              <ActionButton label='Withdrawal' icon={<span style={{ fontSize: '2.2vw' }}>&#128184;</span>} />
      {/* Bill Payment Modal */}
      <BillPaymentModal
        isOpen={showBillPaymentModal}
        onClose={() => setShowBillPaymentModal(false)}
        onSubmit={() => {
          // Refresh transactions after bill payment
          (async () => {
            const user_id = localStorage.getItem('user_id');
            if (!user_id) return;
            const { data: accountData } = await supabase
              .from('accounts')
              .select('id, account_number, balance')
              .eq('user_id', user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            setAccount(accountData);
            if (accountData && accountData.id) {
              const dateObj = new Date(filterDate);
              const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
              const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
              const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
              const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
              let query = supabase
                .from('transactions')
                .select('id, amount, type_id, date, transaction_types(name)')
                .eq('account_id', accountData.id)
                .gte('date', startIso)
                .lte('date', endIso)
                .order('date', { ascending: false });
              if (categoryFilter) {
                query = query.eq('transaction_types.name', categoryFilter);
              }
              const { data: txs } = await query;
              setTransactions(txs || []);
            }
          })();
        }}
      />
              {/* Bottom row: Bank Transfer under Fund Transfer */}
              <ActionButton label='Bank Transfer' icon={<span style={{ fontSize: '2.2vw' }}>&#128176;</span>} onClick={() => setShowBankTransferModal(true)} />
              <div></div>
              <div></div>
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
                <input
                  type='date'
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  style={{ border: '1px solid #e6edfa', borderRadius: '0.4vw', padding: '0.3vw 0.7vw', fontSize: '0.9vw', background: '#fafdff' }}
                />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ marginLeft: '1vw', padding: '0.3vw 0.7vw', borderRadius: '0.4vw', fontSize: '0.9vw', background: '#fafdff', border: '1px solid #e6edfa' }}>
                  <option value=''>All</option>
                  <option value='Fund Transfer'>Fund Transfer</option>
                  <option value='Bank Transfer'>Bank Transfer</option>
                  <option value='Bill Payment'>Bill Payment</option>
                  <option value='Cardless Withdrawal'>Cardless Withdrawal</option>
                </select>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              {transactions.length === 0 ? (
                <div style={{ color: '#888', fontSize: '1vw' }}>No transactions found.</div>
              ) : (
                transactions.map((tx) => {
                  const typeLabel = tx.transaction_types?.name || 'Transaction';
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7vw', width: '100%' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#222', fontSize: '1vw' }}>{typeLabel}</div>
                        <div style={{ color: '#888', fontSize: '0.8vw' }}>{tx.date ? new Date(tx.date).toLocaleString() : ''}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1vw', color: tx.amount < 0 ? '#e53935' : '#43a047' }}>
                        {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
