import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { hashPassword } from '../../../utils/hashUtils';
import './AdminTransactionLogs.css';

export default function AdminTransactionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [refSearch, setRefSearch] = useState('');
  // superpassword for viewing details - uses admin PIN from localStorage
  const [superPassHash, setSuperPassHash] = useState(() => {
    // Get the admin PIN (stored during login)
    const adminPin = localStorage.getItem('admin_pin');
    // If no PIN in localStorage, return empty string (user needs to re-login)
    return adminPin || '';
  });
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  // details modal
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [txDetails, setTxDetails] = useState(null);

  useEffect(() => {
    // load all logs initially
    loadLogs('', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buildQuery(base, dateFilter, refFilter) {
    const df = dateFilter !== undefined ? dateFilter : filterDate;
    const rf = refFilter !== undefined ? refFilter : refSearch;
    
    // Filter by reference number if provided
    if (rf && rf.trim()) {
      const searchTerm = rf.trim().toLowerCase();
      // Fetch all and filter client-side for UUID partial match
      let query = base.select('id, date').order('date', { ascending: false }).limit(1000);
      
      if (df) {
        const from = new Date(df + 'T00:00:00');
        const to = new Date(df + 'T23:59:59.999');
        const fromIso = new Date(from.getTime() - from.getTimezoneOffset() * 60000).toISOString();
        const toIso = new Date(to.getTime() - to.getTimezoneOffset() * 60000).toISOString();
        query = query.gte('date', fromIso).lte('date', toIso);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter client-side by reference number
      const filtered = (data || []).filter(row => 
        row.id && row.id.toLowerCase().includes(searchTerm)
      );
      
      return { data: filtered.slice(0, 200), error: null };
    }
    
    // Normal query without reference filter
    let query = base.select('id, date').order('date', { ascending: false }).limit(200);
    
    // Filter by date if provided
    if (df) {
      const from = new Date(df + 'T00:00:00');
      const to = new Date(df + 'T23:59:59.999');
      const fromIso = new Date(from.getTime() - from.getTimezoneOffset() * 60000).toISOString();
      const toIso = new Date(to.getTime() - to.getTimezoneOffset() * 60000).toISOString();
      query = query.gte('date', fromIso).lte('date', toIso);
    }
    
    return query;
  }

  async function loadLogs(dateFilter, refFilter) {
    setLoading(true);
    setError('');
    try {
      const base = supabase.from('transactions');
      const result = await buildQuery(base, dateFilter, refFilter);
      
      // Handle both query objects and direct data results
      if (result.data !== undefined) {
        // Direct data result from client-side filtering
        if (result.error) throw result.error;
        setLogs(result.data || []);
      } else {
        // Query object - execute it
        const { data, error } = await result;
        if (error) throw error;
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Failed to load transaction logs', err.message || err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter(e) {
    e && e.preventDefault();
    await loadLogs();
  }

  function openVerify(txId) {
    setPendingTx(txId);
    setPassInput('');
    setPassError('');
    setShowPassPrompt(true);
  }

  async function loadTransactionDetails(txId) {
    setDetailsLoading(true);
    setTxDetails(null);
    try {
      let { data, error } = await supabase.from('transactions')
        .select('id, date, transaction_status, recipient_account_number, account_id, amount, bank, type, location, transaction_types(name)')
        .eq('id', txId)
        .maybeSingle();

      if (error) {
        console.error('Supabase error on transaction select:', error.message, error.details, error.hint);
        const fallback = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();
        if (fallback.error) {
          console.error('Fallback select failed:', fallback.error.message, fallback.error.details, fallback.error.hint);
          throw error;
        }
        data = fallback.data;
      }

      let enriched = { ...(data || {}) };
      const recipientId = data?.account_id;
      const recipient = data?.recipient_account_number;
      if (recipientId) {
        try {
          const { data: acct, error: acctErr } = await supabase.from('accounts')
            .select('account_number, user_id')
            .eq('id', recipientId)
            .maybeSingle();
          if (!acctErr && acct) {
            enriched.account_number = acct.account_number || '-';
            if (acct.user_id) {
              const { data: user, error: userErr } = await supabase.from('users')
                .select('firstname, middlename, lastname')
                .eq('id', acct.user_id)
                .maybeSingle();
              if (!userErr && user) {
                const parts = [user.firstname, user.middlename, user.lastname].filter(Boolean);
                enriched.account_name = parts.length ? parts.join(' ') : '-';
              } else {
                enriched.account_name = '-';
              }
            } else {
              enriched.account_name = '-';
            }
          } else {
            enriched.account_number = recipient || '-';
            enriched.account_name = '-';
          }
        } catch (e) {
          console.warn('Failed to enrich account info by id', e);
          enriched.account_number = recipient || '-';
          enriched.account_name = '-';
        }
      } else if (recipient) {
        try {
          const { data: acct, error: acctErr } = await supabase.from('accounts')
            .select('account_number, user_id')
            .eq('account_number', recipient)
            .maybeSingle();
          if (!acctErr && acct) {
            enriched.account_number = acct.account_number || recipient;
            if (acct.user_id) {
              const { data: user, error: userErr } = await supabase.from('users')
                .select('firstname, middlename, lastname')
                .eq('id', acct.user_id)
                .maybeSingle();
              if (!userErr && user) {
                const parts = [user.firstname, user.middlename, user.lastname].filter(Boolean);
                enriched.account_name = parts.length ? parts.join(' ') : '-';
              } else {
                enriched.account_name = '-';
              }
            } else {
              enriched.account_name = '-';
            }
          } else {
            enriched.account_number = recipient;
            enriched.account_name = '-';
          }
        } catch (e) {
          console.warn('Failed to enrich account info', e);
          enriched.account_number = recipient;
          enriched.account_name = '-';
        }
      } else {
        enriched.account_number = '-';
        enriched.account_name = '-';
      }

      setTxDetails(enriched || null);
      setShowDetails(true);
    } catch (err) {
      console.error('Failed to load transaction details', err);
      setError('Failed to load transaction details');
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleClear() {
    setFilterDate('');
    setRefSearch('');
    loadLogs('', '');
  }

  return (
    <div className="admin-trans-root">
      <form onSubmit={handleFilter} className="trans-filter">
        <label className="trans-filter-label">Reference Number</label>
        <input 
          className="trans-filter-input" 
          type="text" 
          value={refSearch} 
          onChange={async (e) => { 
            const v = e.target.value; 
            setRefSearch(v); 
            await loadLogs(filterDate, v); 
          }} 
          placeholder="Search by reference number"
        />
        <label className="trans-filter-label">Date</label>
        <input className="trans-filter-input" type="date" value={filterDate} onChange={async (e) => { const v = e.target.value; setFilterDate(v); await loadLogs(v, refSearch); }} />
        <button type="button" onClick={handleClear} className="trans-filter-clear">Clear</button>
      </form>

      {loading && <div className="trans-loading">Loading...</div>}
      {error && <div className="trans-error">{error}</div>}
      {!loading && !error && (
        <div className="trans-list-root">
          {logs.length === 0 ? (
            <div className="trans-empty">No transactions found.</div>
          ) : (
            <table className="trans-table">
              <thead>
                <tr className="trans-table-head">
                  <th className="trans-th-ref">Reference</th>
                  <th className="trans-th-date">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id} className="trans-row" onClick={() => openVerify(row.id)} onKeyDown={(e) => e.key === 'Enter' && openVerify(row.id)} tabIndex={0}>
                    <td className="trans-td-ref">{String(row.id)}</td>
                    <td className="trans-td-date">{row.date ? new Date(row.date).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showPassPrompt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Enter superpassword to view</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 8 }}>Superadmin Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="modal-input" 
                  value={passInput} 
                  onChange={e => setPassInput(e.target.value)} 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter superadmin password"
                  style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {passError && <div className="modal-error" style={{ marginBottom: 16 }}>{passError}</div>}
            <div className="modal-actions">
              <button type="button" onClick={() => { setShowPassPrompt(false); setPendingTx(null); setPassInput(''); setPassError(''); setShowPassword(false); }} className="modal-btn modal-cancel">Cancel</button>
              <button type="button" onClick={async () => {
                // Fetch admin's PIN from database
                const user_id = localStorage.getItem('user_id');
                if (!user_id) {
                  setPassError('Session expired. Please login again.');
                  return;
                }
                
                const { data: adminData, error: adminError } = await supabase
                  .from('users')
                  .select('pin')
                  .eq('id', user_id)
                  .single();
                
                if (adminError || !adminData) {
                  setPassError('Failed to verify. Please try again.');
                  return;
                }
                
                if (passInput === adminData.pin) {
                  setShowPassPrompt(false);
                  setShowPassword(false);
                  const tx = pendingTx; setPendingTx(null);
                  if (tx) await loadTransactionDetails(tx);
                } else {
                  setPassError('Incorrect superpassword');
                }
              }} className="modal-btn modal-primary">Continue</button>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Transaction details</h3>
            {detailsLoading && <div className="trans-loading">Loading...</div>}
            {!detailsLoading && txDetails && (
              <div className="tx-details">
                <div><strong>Reference number:</strong> {txDetails.id}</div>
                <div><strong>Date:</strong> {txDetails.date ? new Date(txDetails.date).toLocaleString() : '-'}</div>
                <div><strong>Transaction status:</strong> {txDetails.transaction_status || '-'}</div>
                <div><strong>Recipient account number:</strong> {txDetails.recipient_account_number || '-'}</div>
                <div><strong>Account number:</strong> {txDetails.account_number || '-'}</div>
                <div><strong>Account name:</strong> {txDetails.account_name || '-'}</div>
                <div><strong>Location:</strong> {txDetails.location || '-'}</div>
                <div><strong>Type:</strong> {txDetails.transaction_types?.name || txDetails.type || '-'}</div>
                <div><strong>Bank:</strong> {txDetails.bank || '-'}</div>
                <div><strong>Amount:</strong> {txDetails.amount != null ? txDetails.amount : '-'}</div>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => { setShowDetails(false); setTxDetails(null); }} className="modal-btn modal-cancel">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
