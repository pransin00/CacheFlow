import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/CacheFlow_Logo.png';
import Sidebar from '../../share/Sidebar/Sidebar';
import { supabase } from '../../utils/supabaseClient';
import logoutIcon from '../../assets/logout.png';
import Modal from '../../Modals/Modal/Modal';
import './Transactions.css';

// use shared Sidebar component for consistent navigation

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  // logout handled by shared Sidebar
  const [selectedTx, setSelectedTx] = useState(null);
  // weekDate is the picker value (ISO week string like 2025-W44).
  const [weekDate, setWeekDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // close popup when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (showCalendar && calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showCalendar]);

  // Small inline calendar week picker component
  const CalendarWeekPicker = ({ value, onChange }) => {
    const [viewDate, setViewDate] = useState(() => {
      if (value && value.includes('-W')) {
        const [y, w] = value.split('-W');
        // approximate view month as Monday of that week
        const isoToMonday = (year, week) => {
          const jan4 = new Date(year, 0, 4);
          const jan4Day = jan4.getDay() === 0 ? 7 : jan4.getDay();
          const monday1 = new Date(jan4);
          monday1.setDate(jan4.getDate() - (jan4Day - 1));
          const target = new Date(monday1);
          target.setDate(monday1.getDate() + (parseInt(week, 10) - 1) * 7);
          return target;
        };
        return isoToMonday(parseInt(y, 10), parseInt(w, 10));
      }
      return new Date();
    });

    const startOfCalendar = (d) => {
      const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      // find Monday on or before firstOfMonth
      const day = firstOfMonth.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(firstOfMonth);
      start.setDate(firstOfMonth.getDate() + diffToMonday);
      return start;
    };

    const addDays = (d, days) => {
      const n = new Date(d);
      n.setDate(d.getDate() + days);
      return n;
    };

    const getISOWeekString = (dt) => {
      const date = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      // Thursday in current week decides the year.
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };

    const buildGrid = () => {
      const start = startOfCalendar(viewDate);
      const weeks = [];
      for (let r = 0; r < 6; r++) {
        const days = [];
        for (let c = 0; c < 7; c++) {
          days.push(addDays(start, r * 7 + c));
        }
        weeks.push(days);
      }
      return weeks;
    };

    const weeks = buildGrid();

    const isSameMonth = (d, ref) => d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();

    const selectedWeek = value ? value : '';

    return (
      <div style={{ display: 'inline-block', border: '1px solid #e6e6e6', borderRadius: 6, padding: '6px', background: '#fff', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, fontSize: 12 }}>{'<'}</button>
          <div style={{ fontWeight: 600, fontSize: 12 }}>{viewDate.toLocaleString(undefined, { month: 'short', year: 'numeric' })}</div>
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, fontSize: 12 }}>{'>'}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: '4px', textAlign: 'center', color: '#666' }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ fontWeight: 700, fontSize: 11 }}>{d}</div>)}
        </div>
        <div style={{ marginTop: '6px' }}>
          {weeks.map((week, i) => {
            const weekIso = getISOWeekString(week[0]);
            const isSelected = weekIso === selectedWeek;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: '4px', marginTop: '4px', padding: '2px', background: isSelected ? '#e6f0ff' : 'transparent', borderRadius: 4 }}>
                {week.map((day) => (
                  <div
                    key={day.toISOString()}
                    onClick={() => onChange(getISOWeekString(day))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onChange(getISOWeekString(day)); }}
                    style={{ padding: '6px 2px', borderRadius: 4, cursor: 'pointer', color: isSameMonth(day, viewDate) ? '#222' : '#bbb', background: 'transparent', fontSize: 12 }}
                    title={day.toDateString()}
                  >
                    {day.getDate()}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const [categoryFilter, setCategoryFilter] = useState('');
  // Map displayed filter labels to one or more DB transaction type names
  // Use arrays so a single UI label can match multiple DB values (safer for schema differences)
  const categoryNameMap = {
    'Pay bills': ['Bill Payment', 'Pay bills', 'BillPayment'],
    'Withdrawal': ['Cardless Withdrawal', 'Withdrawal', 'Cash Withdrawal'],
    'Fund Transfer': ['Fund Transfer'],
    'Bank Transfer': ['Bank Transfer'],
  };
  // Reverse map: DB name -> UI label (used when clicking a row's type)
  const dbNameToUILabel = {};
  Object.entries(categoryNameMap).forEach(([ui, arr]) => {
    (arr || []).forEach((db) => {
      dbNameToUILabel[db] = ui;
    });
  });

  useEffect(() => {
    let intervalId;
    const fetchTransactions = async () => {
  console.log('Fetching transactions...');
  setFetchError(null);
  setLoading(true);
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        setLoading(false);
        return;
      }
      const { data: accountData, error: accountErr } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (accountErr) console.error('Supabase accounts select error (Transactions):', accountErr);
      console.debug('Accounts query returned:', accountData);
      if (accountData && accountData.id) {
        let query = supabase
          .from('transactions')
          // only include fields that exist in the database schema
          .select('id, amount, type, type_id, date, transaction_status, description, bank, remaining_balance, recipient_account_number, transaction_types(name)')
          .eq('account_id', accountData.id)
          .order('date', { ascending: false });

        // Week filter via week picker: accept HTML week input (YYYY-Www).
        if (weekDate) {
          // helper: convert ISO week (year, week) to Date for Monday of that week
          const isoWeekToMonday = (year, week) => {
            const jan4 = new Date(year, 0, 4);
            const jan4Day = jan4.getDay() === 0 ? 7 : jan4.getDay();
            const monday1 = new Date(jan4);
            monday1.setDate(jan4.getDate() - (jan4Day - 1));
            const targetMonday = new Date(monday1);
            targetMonday.setDate(monday1.getDate() + (week - 1) * 7);
            return targetMonday;
          };

          let start;
          if (weekDate.includes('-W')) {
            const [yearPart, weekPart] = weekDate.split('-W');
            const year = parseInt(yearPart, 10);
            const weekNum = parseInt(weekPart, 10);
            start = isoWeekToMonday(year, weekNum);
          } else {
            // fallback if browser provides YYYY-MM-DD
            const selected = new Date(weekDate + 'T00:00:00');
            const day = selected.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            start = new Date(selected);
            start.setDate(selected.getDate() + diffToMonday);
          }
          const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
          const startIso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
          const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString();
          query = query.gte('date', startIso).lte('date', endIso);
        }

        // We'll fetch without a server-side category filter and apply a precise, normalized
        // exact-match filter client-side. This avoids .or syntax/encoding issues and handles

        let txsResponse;
        try {
          txsResponse = await query;
        } catch (e) {
          // supabase client sometimes throws; normalize
          txsResponse = { data: null, error: e };
        }
        const { data: txs, error: txErr } = txsResponse || {};
        if (txErr) {
          // Log structured error info and attempt a reduced fallback query without relation
          try {
            console.error('Supabase transactions select error (Transactions):', JSON.stringify(txErr));
          } catch (e) {
            console.error('Supabase transactions select error (Transactions):', txErr);
          }
          // attempt a simpler query without the relational column which may not exist in some schemas
          try {
            console.debug('Attempting fallback transactions query (no relation)');
            const { data: txs2, error: txErr2 } = await supabase
              .from('transactions')
              // fallback: simpler projection without relations
              .select('id, amount, type, type_id, date, transaction_status, description, bank, remaining_balance, recipient_account_number')
              .eq('account_id', accountData.id)
              .order('date', { ascending: false });
            if (txErr2) {
              try { console.error('Fallback transactions query error:', JSON.stringify(txErr2)); } catch (e) { console.error('Fallback transactions query error:', txErr2); }
              setFetchError(txErr2.message || JSON.stringify(txErr2));
              setTransactions([]);
              setLoading(false);
              return;
            }
            console.debug('Fallback transactions returned', (txs2 || []).length, 'rows');
            setTransactions(txs2 || []);
          } catch (fallbackEx) {
            console.error('Exception during fallback transactions query:', fallbackEx);
            setFetchError(fallbackEx?.message || JSON.stringify(fallbackEx));
            setTransactions([]);
            setLoading(false);
            return;
          }
        } else {
          const raw = txs || [];
          console.debug('Transactions query returned', raw.length, 'rows');
          // continue with normal processing below using `raw`
          // detect expired pending withdrawals (type_id 4 or textual 'Cardless Withdrawal') and mark them Unsuccessful
          try {
            const now = new Date();
            const expired = raw.filter(tx => {
              const isWithdrawal = Number(tx.type_id) === 4 || (tx.transaction_types?.name || tx.type || '').toString().toLowerCase().includes('withdrawal');
              const isPending = (tx.transaction_status || '').toLowerCase() === 'pending';
              if (!isWithdrawal || !isPending) return false;
              // prefer expires_at if present
              if (tx.expires_at) {
                const exp = new Date(tx.expires_at);
                return exp < now;
              }
              // fallback: use date + 10 minutes
              if (tx.date) {
                const dt = new Date(tx.date);
                // fallback expiry for testing: 30 seconds
                return (dt.getTime() + 30 * 1000) < now.getTime();
              }
              return false;
            });
            if (expired.length > 0) {
              const ids = expired.map(e => e.id);
              // update DB to mark them unsuccessful
              await supabase
                .from('transactions')
                .update({ transaction_status: 'Unsuccessful' })
                .in('id', ids);
              // also update the local copy so UI reflects change immediately
              raw.forEach(r => { if (ids.includes(r.id)) r.transaction_status = 'Unsuccessful'; });
            }
          } catch (err) {
            // ignore update errors; UI will still show pending until next refresh
            console.warn('Failed to update expired withdrawals', err);
          }
          if (categoryFilter) {
            const candidates = (categoryNameMap[categoryFilter] && categoryNameMap[categoryFilter].slice()) || [categoryFilter];
            const normalize = (s) => (s || '').toString().trim().toLowerCase();
            const normalizedCandidates = candidates.map(c => normalize(c));
            const filtered = raw.filter((tx) => normalizedCandidates.includes(normalize(tx.transaction_types?.name || tx.type)));
            setTransactions(filtered);
          } else {
            setTransactions(raw);
          }
        }

        
      }
      setLoading(false);
    };
    fetchTransactions();
    // allow immediate refresh when a new transaction was created elsewhere
    const onRefresh = () => fetchTransactions();
    window.addEventListener('transactions:refresh', onRefresh);
    intervalId = setInterval(fetchTransactions, 10000); // auto-refresh every 10s
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('transactions:refresh', onRefresh);
    };
  }, [weekDate, categoryFilter]);

  // Sort transactions based on sortField and sortDirection
  const sortedTransactions = React.useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      if (sortField === 'date') {
        aVal = new Date(a.date || 0).getTime();
        bVal = new Date(b.date || 0).getTime();
      } else if (sortField === 'amount') {
        aVal = Math.abs(a.amount || 0);
        bVal = Math.abs(b.amount || 0);
      } else {
        return 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
    return sorted;
  }, [transactions, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#fafdff', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', overflow: 'hidden' }}>
      <Sidebar activePage="transactions" />
      {/* logout modal is part of shared Sidebar */}
      {/* Main Content */}
  <div style={{ flex: 1, padding: '2vw', background: '#fafdff', marginLeft: '16vw', height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ color: '#1856c9', fontWeight: 700, marginBottom: '2vw' }}>All Transactions</h2>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '2vw', marginBottom: '2vw', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ fontWeight: 500, marginRight: '0.7vw' }}>Date:</label>
            <button
              onClick={() => setShowCalendar(s => !s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
              aria-expanded={showCalendar}
            >
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ fontSize: 13 }}>{weekDate ? weekDate : 'Select date'}</span>
            </button>
            {showCalendar && (
              <div ref={calendarRef} style={{ position: 'absolute', top: '42px', left: 0, zIndex: 120, background: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', padding: 8, borderRadius: 6 }}>
                <CalendarWeekPicker value={weekDate} onChange={(v) => { setWeekDate(v); setShowCalendar(false); }} />
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 500, marginRight: '0.7vw' }}>Category:</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.4vw 1vw', borderRadius: '0.5vw', fontSize: '1vw' }}>
              <option value=''>All</option>
              <option value='Fund Transfer'>Fund Transfer</option>
              <option value='Bank Transfer'>Bank Transfer</option>
              <option value='Pay bills'>Pay bills</option>
              <option value='Withdrawal'>Withdrawal</option>
            </select>
          </div>
        </div>
        {fetchError && (
          <div style={{ color: '#e53935', marginBottom: '1rem' }}>
            Error loading transactions: {fetchError}
          </div>
        )}
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
                <th 
                  onClick={() => handleSort('date')}
                  style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Type</th>
                <th 
                  onClick={() => handleSort('amount')}
                  style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                >
                  Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.7vw', borderBottom: '1px solid #e6edfa', textAlign: 'left' }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx) => {
                const isWithdrawal = Number(tx.type_id) === 4 || (tx.transaction_types?.name || tx.type || '').toString().toLowerCase().includes('withdrawal');
                const signChar = isWithdrawal ? '-' : (tx.amount < 0 ? '-' : '+');
                const amountAbs = Math.abs(tx.amount || 0);
                const amountColor = isWithdrawal ? '#e53935' : (tx.amount < 0 ? '#e53935' : '#43a047');
                return (
                  <tr key={tx.id} onClick={() => setSelectedTx(tx)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTx(tx); }} style={{ borderBottom: '1px solid #f5f7fa', cursor: 'pointer' }}>
                    <td style={{ padding: '0.7vw', color: '#222' }}>{tx.date ? new Date(tx.date).toLocaleString() : ''}</td>
                    <td style={{ padding: '0.7vw', color: '#222' }}>
                      {tx.transaction_types?.name || tx.type || 'Transaction'}
                    </td>
                    <td style={{ padding: '0.7vw', textAlign: 'right', fontWeight: 700, color: amountColor }}>
                      {signChar}{amountAbs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.7vw', color: '#888' }}>{tx.transaction_status || ''}</td>
                    <td style={{ padding: '0.7vw', color: '#888' }}>{tx.id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Transaction details modal */}
        {selectedTx && (
          <Modal isOpen={true} onClose={() => setSelectedTx(null)}>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 12, width: '92%', maxWidth: 820, boxSizing: 'border-box', boxShadow: '0 12px 48px rgba(10,20,60,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0b61ff' }}>Transaction Details</div>
                <button onClick={() => setSelectedTx(null)} style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 700 }}>Close</button>
              </div>
              <div style={{ marginTop: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {(() => {
                  const tx = selectedTx || {};
                  const date = tx.date ? new Date(tx.date).toLocaleString() : '-';
                  const type = (tx.transaction_types && tx.transaction_types.name) || tx.type || '-';
                  const status = tx.transaction_status || '-';
                  const amountRaw = Number(tx.amount || 0);
                  const isDebit = amountRaw < 0 || Number(tx.type_id) === 4 || (type || '').toString().toLowerCase().includes('withdrawal');
                  const sign = isDebit ? '-' : '+';
                  const amount = Math.abs(amountRaw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  const amountColor = isDebit ? '#e53935' : '#43a047';
                  const description = tx.description || tx.note || '-';
                  const reference = tx.id || '-';
                  const bank = tx.bank || '-';
                  const recipientAccount = tx.recipient_account_number || '-';
                  const remaining = tx.remaining_balance !== undefined && tx.remaining_balance !== null ? Number(tx.remaining_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

                  const row = (label, value, valueStyle) => (
                    <div style={{ display: 'flex', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                      <div style={{ flex: '0 0 160px', color: '#64748b', fontWeight: 700 }}>{label}</div>
                      <div style={{ flex: 1, color: valueStyle?.color || '#0f172a' }}>{value}</div>
                    </div>
                  );

                  // Build rows conditionally: only show fields with meaningful values
                  const rowsToShow = [];
                  // Always show these core fields
                  rowsToShow.push(row('Date', date));
                  rowsToShow.push(row('Type', type));
                  rowsToShow.push(row('Status', status));
                  rowsToShow.push(row('Amount', <span style={{ color: amountColor, fontWeight: 800 }}>{sign}{amount}</span>));
                  rowsToShow.push(row('Reference', reference));

                  // Optional fields: only include them when present (not null/empty)
                  if (description && description !== '-') rowsToShow.push(row('Description', description));
                  
                  // Fund Transfer: show recipient account number
                  const isFundTransfer = Number(tx.type_id) === 1 || (type || '').toString().toLowerCase().includes('fund transfer');
                  if (isFundTransfer && recipientAccount !== '-') {
                    rowsToShow.push(row('Recipient Account', recipientAccount));
                  }
                  
                  // Bank Transfer: show recipient account number and bank
                  const isBankTransfer = Number(tx.type_id) === 2 || (type || '').toString().toLowerCase().includes('bank transfer');
                  if (isBankTransfer) {
                    if (recipientAccount !== '-') rowsToShow.push(row('Recipient Account', recipientAccount));
                    if (bank && bank !== '-') rowsToShow.push(row('Bank', bank));
                  }
                  
                  // Bill Payment: show biller and reference number
                  const isBillPayment = Number(tx.type_id) === 3 || (type || '').toString().toLowerCase().includes('bill payment');
                  if (isBillPayment) {
                    if (bank && bank !== '-') rowsToShow.push(row('Biller', bank));
                    if (recipientAccount !== '-') rowsToShow.push(row('Reference Number', recipientAccount));
                  }
                  
                  // Withdrawal: show location
                  const isWithdrawal = Number(tx.type_id) === 4 || (type || '').toString().toLowerCase().includes('withdrawal');
                  if (isWithdrawal && bank && bank !== '-') {
                    rowsToShow.push(row('Location', bank));
                  }

                  if (remaining !== '-') rowsToShow.push(row('Remaining Balance', remaining));

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {rowsToShow.map((r, i) => <div key={i}>{r}</div>)}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Transactions;
