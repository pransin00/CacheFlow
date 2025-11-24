import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/CacheFlow_Logo.png';
import Sidebar from '../../share/Sidebar/Sidebar';
import { supabase } from '../../utils/supabaseClient';
import overviewIcon from '../../assets/overview.png';
import historyIcon from '../../assets/history.png';
import userIcon from '../../assets/user.png';
import logoutIcon from '../../assets/logout.png';
import viewPng from '../../assets/view.png';
import hidePng from '../../assets/hide.png';
import Modal from '../../Modals/Modal/Modal';
import FundTransferModal from '../../Modals/FundTransferModal/FundTransferModal';
import BankTransferModal from '../../Modals/BankTransferModal/BankTransferModal';
import BillPaymentModal from '../../Modals/BillPaymentModal/BillPaymentModal';
import CardlessWithdrawalModal from '../../Modals/CardlessWithdrawalModal/CardlessWithdrawalModal';
import './Dashboard.css';

// sidebar is handled by shared Sidebar component

const ActionButton = ({ label, icon, onClick }) => (
  <div onClick={onClick} className="action-button">
    {icon}
    <div className="action-label">{label}</div>
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
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [showBalance, setShowBalance] = useState(true);
  const [showFundTransferModal, setShowFundTransferModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showBillPaymentModal, setShowBillPaymentModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAtmName, setWithdrawalAtmName] = useState('');

  const fetchDashboardData = async () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
      navigate('/login'); // Redirect if no user
      return;
    }
    try {
      // Fetch user and account in parallel
      const [userRes, accountRes] = await Promise.all([
        supabase.from('users').select('firstname, lastname').eq('id', user_id).single(),
        supabase.from('accounts').select('id, account_number, balance').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1).single()
      ]);

      if (userRes.error) console.error('Supabase users select error:', userRes.error);
      if (accountRes.error) console.error('Supabase accounts select error:', accountRes.error);

      const userData = userRes.data || null;
      const accountData = accountRes.data || null;

      setUser(userData);
      setAccount(accountData);

      if (accountData && accountData.id) {
        await fetchTransactions(accountData.id);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching user/account info:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterDate]);

  const fetchTransactions = async (accountIdParam) => {
    try {
      const accountId = accountIdParam || (account && account.id);
      if (!accountId) {
        setTransactions([]);
        return;
      }
      const dateObj = new Date(filterDate);
      const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
      const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
      const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('id, amount, type_id, date, transaction_types(name)')
        .eq('account_id', accountId)
        .gte('date', startIso)
        .lte('date', endIso)
        .order('date', { ascending: false });
      if (error) {
        console.error('Supabase transactions select error:', error);
        setTransactions([]);
        return;
      }
      setTransactions(txs || []);
    } catch (err) {
      console.error('fetchTransactions error:', err);
      setTransactions([]);
    }
  };

  useEffect(() => {
    const onRefresh = () => {
      fetchTransactions();
    };
    window.addEventListener('transactions:refresh', onRefresh);
    return () => window.removeEventListener('transactions:refresh', onRefresh);
  }, [account, filterDate]);

  // logout handled by shared Sidebar

  return (
    <div className="dashboard-root">
      <Sidebar activePage="dashboard" />

      {/* logout modal is now part of shared Sidebar */}

      <FundTransferModal
        isOpen={showFundTransferModal}
        onClose={() => setShowFundTransferModal(false)}
        onTransferSuccess={async () => {
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
            await fetchTransactions(accountData.id);
          }
        }}
      />

      <BankTransferModal
        isOpen={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
        onConfirm={(e) => {
          setShowBankTransferModal(false);
          if (e?.refresh) {
            fetchDashboardData();
          }
        }}
      />

      <div className="dashboard-main">
        <div className="main-top-row">
          <div className="page-title">Overview</div>
          <div className="user-area">
              <div className="user-info">
                <div className="user-name">
                  {user && user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : ''}
                </div>
                <div className="account-number">{account ? account.account_number : '1234567890'}</div>
              </div>
              {user && user.firstname && user.lastname && (
                <span className="initials" onClick={() => navigate('/profile')} title={`${user.firstname} ${user.lastname}`}>
                  {user.firstname[0]}{user.lastname[0]}
                </span>
              )}
            </div>
        </div>

        <div className="main-row">
          <div className="balance-col">
            <div className="balance-label">Current Account Balance</div>
            <div className="balance-card">
              <div className="balance-inner">
                <span className="small-label">Current Balance</span>
                <span className="balance-amount">{showBalance && account && account.balance !== undefined ? account.balance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : showBalance ? '0.00' : '******'}</span>
              </div>
              <button className="balance-toggle" onClick={() => setShowBalance(prev => !prev)} aria-label={showBalance ? 'Hide balance' : 'Show balance'}>
                <img src={showBalance ? viewPng : hidePng} alt="toggle" />
              </button>
            </div>

            <div className="actions-grid">
              <ActionButton label='Fund Transfer' icon={<span className="action-emoji">🚀</span>} onClick={() => setShowFundTransferModal(true)} />
              <ActionButton label='Pay Bills' icon={<span className="action-emoji">💳</span>} onClick={() => setShowBillPaymentModal(true)} />
              <ActionButton label='Withdrawal' icon={<span className="action-emoji">🏧</span>} onClick={() => { setWithdrawalAtmName('Nasugbu Main Branch'); setShowWithdrawalModal(true); }} />
              <ActionButton label='Bank Transfer' icon={<span className="action-emoji">🏦</span>} onClick={() => setShowBankTransferModal(true)} />
            </div>

            <BillPaymentModal
              isOpen={showBillPaymentModal}
              onClose={() => setShowBillPaymentModal(false)}
              onSubmit={async () => {
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
                  await fetchTransactions(accountData.id);
                }
              }}
            />

            {showWithdrawalModal && (
              <CardlessWithdrawalModal
                atmName={withdrawalAtmName}
                onClose={() => { setShowWithdrawalModal(false); setWithdrawalAtmName(''); }}
                onGenerate={() => {}}
              />
            )}
          </div>

          <div className="transactions-col">
            <div className="transactions-header">
              <div className="transactions-title">Transaction</div>
              <div className="transactions-date">{new Date(filterDate).toLocaleDateString()}</div>
            </div>

            <div className="transactions-list">
              {transactions.length === 0 ? (
                <div className="no-transactions">No transactions found.</div>
              ) : (
                transactions.map((tx) => {
                  const typeLabel = tx.transaction_types?.name || tx.type || 'Transaction';
                  const isWithdrawal = Number(tx.type_id) === 4 || (typeLabel || '').toString().toLowerCase().includes('withdrawal');
                  const signChar = isWithdrawal ? '-' : (tx.amount < 0 ? '-' : '+');
                  const amountAbs = Math.abs(tx.amount || 0);
                  const amountColor = isWithdrawal ? '#e53935' : (tx.amount < 0 ? '#e53935' : '#43a047');
                  return (
                    <div key={tx.id} className="tx-row">
                      <div className="tx-left">
                        <div className="tx-label">{typeLabel}</div>
                        <div className="tx-date">{tx.date ? new Date(tx.date).toLocaleString() : ''}</div>
                      </div>
                      <div className="tx-amount" style={{ color: amountColor }}>{signChar}{amountAbs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
