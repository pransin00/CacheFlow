import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AdminTransactionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  // superpassword for viewing details
  const SUPERPASS_KEY = 'admin_superpassword';
  const DEFAULT_SUPERPASS = 'admin12345';
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [pendingTx, setPendingTx] = useState(null);
  // details modal
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [txDetails, setTxDetails] = useState(null);

  useEffect(() => {
    // load all logs initially
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buildQuery(base, dateFilter) {
    let query = base.select('id, date').order('date', { ascending: false }).limit(200);
    const df = dateFilter !== undefined ? dateFilter : filterDate;
    if (df) {
      // filter for the whole day (normalize to UTC like Transactions.jsx)
      const from = new Date(df + 'T00:00:00');
      const to = new Date(df + 'T23:59:59.999');
      const fromIso = new Date(from.getTime() - from.getTimezoneOffset() * 60000).toISOString();
      const toIso = new Date(to.getTime() - to.getTimezoneOffset() * 60000).toISOString();
      query = query.gte('date', fromIso).lte('date', toIso);
    }
    return query;
  }

  async function loadLogs(dateFilter) {
    setLoading(true);
    setError('');
    try {
      const base = supabase.from('transactions');
      const query = await buildQuery(base, dateFilter);
      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
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

      // If Supabase returns a 400 (bad column/select), capture details and retry with a safe select('*') to inspect available fields.
      if (error) {
        console.error('Supabase error on transaction select:', error.message, error.details, error.hint);
        // retry with a safe select to at least retrieve the raw row (if allowed by RLS/permissions)
        const fallback = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();
        if (fallback.error) {
          // log full fallback error and rethrow the original to be handled by outer catch
          console.error('Fallback select failed:', fallback.error.message, fallback.error.details, fallback.error.hint);
          throw error;
        }
        data = fallback.data;
      }

      // Attempt to enrich with account + account owner name when recipient_account_number exists
      let enriched = { ...(data || {}) };
      const recipientId = data?.account_id;
      const recipient = data?.recipient_account_number;
      if (recipientId) {
        // prefer looking up by account id (transactions.account_id)
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
            // fallback to recipient number if account record not found
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
            // account not found, fallback to recipient string
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
    loadLogs();
  }

  // simple inline native date input will open the browser calendar when clicked

  return (
    <div>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 13, color: '#555' }}>Date</label>
        <input
          type="date"
          value={filterDate}
          onChange={async (e) => { const v = e.target.value; setFilterDate(v); await loadLogs(v); }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e6eefc', background: '#fff', cursor: 'pointer' }}
        />
        <button type="button" onClick={handleClear} style={{ padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #dbeafe' }}>Clear</button>
      </form>

      {loading && <div style={{ color: '#666' }}>Loading...</div>}
      {error && <div style={{ color: '#d32f2f' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ marginTop: 8, color: '#444' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>No transactions found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eef2ff' }}>
                  <th style={{ padding: '6px 8px', width: '60%' }}>Reference</th>
                  <th style={{ padding: '6px 8px', width: '40%' }}>Date</th>
                </tr>
              </thead>
                  <tbody>
                    {logs.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px dashed #f6f8ff', cursor: 'pointer' }} onClick={() => openVerify(row.id)} onKeyDown={(e) => e.key === 'Enter' && openVerify(row.id)} tabIndex={0}>
                        <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 13 }}>{String(row.id)}</td>
                        <td style={{ padding: '8px 8px' }}>{row.date ? new Date(row.date).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          )}
        </div>
      )}

      {/* superpassword prompt before showing details */}
      {showPassPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100010 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(420px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Enter superpassword to view</h3>
            <div style={{ marginBottom: 8 }}>
              <input value={passInput} onChange={e => setPassInput(e.target.value)} type="password" placeholder="Superpassword" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            {passError && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{passError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowPassPrompt(false); setPendingTx(null); setPassInput(''); setPassError(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={async () => {
                const current = localStorage.getItem(SUPERPASS_KEY) || DEFAULT_SUPERPASS;
                if (passInput === current) {
                  setShowPassPrompt(false);
                  const tx = pendingTx; setPendingTx(null);
                  if (tx) await loadTransactionDetails(tx);
                } else {
                  setPassError('Incorrect password');
                }
              }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* details modal */}
      {showDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100011 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(640px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Transaction details</h3>
            {detailsLoading && <div style={{ color: '#666' }}>Loading...</div>}
            {!detailsLoading && txDetails && (
              <div style={{ fontSize: 14, color: '#222' }}>
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => { setShowDetails(false); setTxDetails(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
