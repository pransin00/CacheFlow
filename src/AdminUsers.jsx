import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
    // --- component state (moved up so hooks are declared before functions that use them) ---
    const [showAdd, setShowAdd] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    // fixed Philippine mobile prefix and editable 9-digit suffix
    const CONTACT_PREFIX = '+639';
    const [contactRest, setContactRest] = useState('');
    const [adding, setAdding] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [previewAcctNumber, setPreviewAcctNumber] = useState('');
    const [showToast, setShowToast] = useState(false);
    // edit user modal state
    const [editShow, setEditShow] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editFirstName, setEditFirstName] = useState('');
    const [editMiddleName, setEditMiddleName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editContactRest, setEditContactRest] = useState('');
    const [editAccountNumber, setEditAccountNumber] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editPin, setEditPin] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    // deletion states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeletePassPrompt, setShowDeletePassPrompt] = useState(false);
    const [deletePassInput, setDeletePassInput] = useState('');
    const [deletePassError, setDeletePassError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    // superpassword handling (stored in localStorage; default 'admin12345')
    const SUPERPASS_KEY = 'admin_superpassword';
    const DEFAULT_SUPERPASS = 'admin12345';
    const [superPass, setSuperPass] = useState(() => localStorage.getItem(SUPERPASS_KEY) || DEFAULT_SUPERPASS);
    const [showPassPrompt, setShowPassPrompt] = useState(false);
    const [passInput, setPassInput] = useState('');
    const [passError, setPassError] = useState('');
    const [pendingEdit, setPendingEdit] = useState(null); // {userId, accountNumber}
    const [showSetPass, setShowSetPass] = useState(false);
    const [currentPassInput, setCurrentPassInput] = useState('');
    const [newPassInput, setNewPassInput] = useState('');
    const [confirmNewPassInput, setConfirmNewPassInput] = useState('');
    const [passChangeLoading, setPassChangeLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      // Fetch accounts with user_id and account_number
      const { data, error } = await supabase
        .from('accounts')
        .select('user_id, account_number')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error('Failed to load users/accounts', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  // open edit modal and load user data
  async function openEdit(userId, accountNumber) {
    setError('');
    setEditLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('username, firstname, middlename, lastname, contact_number').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        setEditUserId(userId);
        setEditAccountNumber(accountNumber || '');
        setEditUsername(data.username || '');
        setEditFirstName(data.firstname || '');
        setEditMiddleName(data.middlename || '');
        setEditLastName(data.lastname || '');
        setEditPassword(data.password || '');
        setEditPin(data.pin || '');
        const cn = (data.contact_number || '').toString();
        if (cn.startsWith(CONTACT_PREFIX)) setEditContactRest(cn.slice(CONTACT_PREFIX.length));
        else setEditContactRest(cn.replace(/\D/g, '').slice(-9));
        setEditShow(true);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Failed to load user for edit', err);
      setError('Failed to load user');
    } finally {
      setEditLoading(false);
    }
  }

  // perform update
  async function performUpdate() {
    if (!editUserId) return;
    setError('');
    if (!/^[0-9]{9}$/.test(editContactRest)) {
      setError('Contact must be 9 digits (without the +639 prefix)');
      return;
    }
    setEditLoading(true);
    try {
      const payload = {
        username: editUsername.trim(),
        firstname: editFirstName.trim(),
        middlename: editMiddleName.trim() || null,
        lastname: editLastName.trim(),
        contact_number: CONTACT_PREFIX + editContactRest,
        password: editPassword || undefined,
        pin: editPin || undefined,
      };
      const { data, error } = await supabase.from('users').update(payload).eq('id', editUserId);
      if (error) throw error;
      // reload and close
      await loadUsers();
      setEditShow(false);
      setSuccessMsg('User updated successfully.');
      setShowToast(true);
      setTimeout(() => { setShowToast(false); setSuccessMsg(''); }, 3000);
    } catch (err) {
      console.error('Failed to update user', err);
      setError('Failed to update user: ' + (err.message || err));
    } finally {
      setEditLoading(false);
    }
  }

  // perform deletion of user and their accounts (called after deleting password verification)
  async function performDelete() {
    if (!editUserId) return;
    setError('');
    setDeleteLoading(true);
    try {
      // delete accounts for the user first
      const { error: acctErr } = await supabase.from('accounts').delete().eq('user_id', editUserId);
      if (acctErr) throw acctErr;

      // then delete the user row
      const { error: userErr } = await supabase.from('users').delete().eq('id', editUserId);
      if (userErr) throw userErr;

      // reload and close
      await loadUsers();
      setEditShow(false);
      setShowDeletePassPrompt(false);
      setSuccessMsg('User and account deleted successfully.');
      setShowToast(true);
      setTimeout(() => { setShowToast(false); setSuccessMsg(''); }, 3000);
    } catch (err) {
      console.error('Failed to delete user/account', err);
      setError('Failed to delete user/account: ' + (err.message || err));
    } finally {
      setDeleteLoading(false);
      setDeletePassInput('');
    }
  }

  function maskAccount(acct) {
    if (!acct) return '-';
    // show only last 4 characters, replace previous chars with *
    const s = String(acct);
    if (s.length <= 4) return s;
    return s.replace(/.(?=.{4})/g, '*');
  }


  // generate a random numeric account number with the specified length (default 8 digits)
  function generateAccountNumber(length = 8) {
    // ensure numeric string of given length
    let s = '';
    while (s.length < length) {
      s += Math.floor(Math.random() * 10).toString();
    }
    // avoid leading zero by forcing first digit 1-9 if first char is '0'
    if (s[0] === '0') s = (Math.floor(1 + Math.random() * 9)).toString() + s.slice(1);
    return s;
  }

  // preview step: validate and create a preview account number before asking for confirmation
  async function openPreview() {
    setError('');
    setSuccessMsg('');
    // basic validation: require first/last/username and a 9-digit contact suffix
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !/^[0-9]{9}$/.test(contactRest)) {
      setError('Please provide username, first name, last name and a 9-digit contact number (without the +639 prefix).');
      return;
    }

    // pre-check username uniqueness
    try {
      const uname = username.trim();
      const { data: existingUsers, error: existsErr } = await supabase.from('users').select('id').eq('username', uname).limit(1);
      if (existsErr) {
        console.warn('Username existence check failed', existsErr);
      }
      if (existingUsers && existingUsers.length > 0) {
        setError('Username already exists. Choose another username.');
        return;
      }
    } catch (e) {
      console.warn('Username check error', e);
    }

    // generate a preview account number and show confirmation modal
    const acct = generateAccountNumber(8);
    setPreviewAcctNumber(acct);
    setShowConfirm(true);
  }

  // perform the actual create operation (called from confirm modal)
  async function performCreate(initialAcct) {
    setError('');
    setAdding(true);
    setShowConfirm(false);
    try {
      let finalInserted = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const acct = attempt === 0 && initialAcct ? initialAcct : generateAccountNumber(8);

        // create user first
        const userPayload = {
          username: username.trim(),
          password: username.trim(), // password same as username per request
          firstname: firstName.trim(),
          middlename: middleName.trim() || null,
          lastname: lastName.trim(),
          contact_number: CONTACT_PREFIX + contactRest,
        };

        const { data: userData, error: userError } = await supabase.from('users').insert([userPayload]).select('id');
        if (userError) {
          console.error('Failed to insert user', userError);
          throw userError;
        }
        const userId = userData && userData[0] && userData[0].id;
        if (!userId) {
          throw new Error('Failed to obtain user id after insert');
        }

        // now create account referencing the new user
        const acctPayload = { user_id: userId, account_number: acct };
        const { data: acctData, error: acctError } = await supabase.from('accounts').insert([acctPayload]);
        if (acctError) {
          // if duplicate account number, clean up the created user and retry
          const msg = (acctError && acctError.message) || '';
          console.warn('Account insert failed', acctError);
          try {
            await supabase.from('users').delete().eq('id', userId);
          } catch (cleanupErr) {
            console.warn('Failed to cleanup user after account insert failure', cleanupErr);
          }
          if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
            // try again with a new account number
            continue;
          }
          throw acctError;
        }

        finalInserted = acctData;
        // set the preview/account shown in the success message
        setPreviewAcctNumber(acct);
        break;
      }

      if (!finalInserted) {
        // detection: check if user & account exist
        try {
          const uname = username.trim();
          const foundUser = await supabase.from('users').select('id').eq('username', uname).limit(1).maybeSingle();
          if (foundUser && foundUser.data && foundUser.data.id) {
            const { data: foundAcct } = await supabase.from('accounts').select('account_number').eq('user_id', foundUser.data.id).limit(1);
            if (foundAcct && foundAcct.length > 0) {
              setPreviewAcctNumber(foundAcct[0].account_number);
              finalInserted = foundAcct;
            }
          }
        } catch (detectErr) {
          console.warn('Detection query failed', detectErr);
        }
      }

      if (!finalInserted) throw new Error('Failed to generate a unique account number after several attempts.');

      // reload and show success
      await loadUsers();
      setShowAdd(false);
  setFirstName('');
  setMiddleName('');
  setLastName('');
  setContactRest('');
      setUsername('');
      setSuccessMsg('User and account created successfully.');
      setShowToast(true);
      // auto-hide toast
      setTimeout(() => {
        setShowToast(false);
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error('Failed to add account', err);
      setError('Failed to add account: ' + (err.message || err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search by user id or account number"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e6eefc', width: 360 }}
        />
        <div style={{ color: '#666', fontSize: 13 }}>{rows.length} total accounts</div>
        </div>
        <div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#0a3cff', color: '#fff', border: 'none' }}>Add user</button>
        </div>
      </div>
      {loading && <div style={{ color: '#666' }}>Loading...</div>}
      {error && <div style={{ color: '#d32f2f' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ marginTop: 8 }}>
          {rows.length === 0 ? (
            <div style={{ color: '#666' }}>No users/accounts found.</div>
          ) : (
            // dedupe by user_id, keep the first (latest) account per user
            (() => {
              const map = new Map();
              for (const r of rows) {
                if (!map.has(r.user_id)) map.set(r.user_id, r);
              }
              const unique = Array.from(map.values());
              // apply search filter
              const term = (searchTerm || '').toString().trim().toLowerCase();
              const filtered = term
                ? unique.filter(u => (u.user_id || '').toString().toLowerCase().includes(term) || (u.account_number || '').toString().toLowerCase().includes(term))
                : unique;

              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eef2ff' }}>
                  <th style={{ padding: '6px 8px', width: '40%' }}>User ID</th>
                  <th style={{ padding: '6px 8px', width: '40%' }}>Account Number</th>
                  <th style={{ padding: '6px 8px', width: '20%' }} aria-label="actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={`${r.user_id}-${i}`} style={{ borderBottom: '1px dashed #f6f8ff' }}>
                    <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 13 }}>{r.user_id}</td>
                    <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 13 }}>{maskAccount(r.account_number)}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <button onClick={() => { setPendingEdit({ userId: r.user_id, accountNumber: r.account_number }); setPassError(''); setPassInput(''); setShowPassPrompt(true); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e6eefc', background: '#fff' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              );
            })()
          )}
        </div>
      )}

      {showAdd && (
        <div>
          {/* debug banner to verify modal state (will only show when modal is requested) */}
          <div style={{ position: 'fixed', left: 12, top: 12, background: 'rgba(10,60,255,0.95)', color: '#fff', padding: '6px 10px', borderRadius: 6, zIndex: 99999 }}>Add modal open</div>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990 }}>
          <form
            onSubmit={e => { e.preventDefault(); openPreview(); }}
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 10,
              // responsive width: at most 720px, otherwise 92% of viewport
              width: 'min(720px, 92%)',
              minWidth: 520,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add user</h3>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Password will be set automatically to the username.</div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Middle Name</label>
              <input value={middleName} onChange={e => setMiddleName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Contact Number</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ padding: '8px 10px', background: '#f3f6ff', borderRadius: 6, border: '1px solid #e6eefc', color: '#0b3cff' }}>{CONTACT_PREFIX}</div>
                <input
                  value={contactRest}
                  onChange={e => {
                    // only digits, max 9 chars
                    const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setContactRest(v);
                  }}
                  maxLength={9}
                  inputMode="tel"
                  placeholder="XXXXXXXXX"
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }}
                />
              </div>
            </div>

            {error && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={openPreview} disabled={adding} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>{adding ? 'Working...' : 'Preview'}</button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* confirmation modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100002 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(640px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Confirm new account</h3>
            <div style={{ marginBottom: 10 }}>
              <div><strong>Username:</strong> {username}</div>
              <div><strong>Name:</strong> {firstName} {middleName ? middleName + ' ' : ''}{lastName}</div>
              <div><strong>Contact:</strong> {CONTACT_PREFIX}{contactRest}</div>
              <div style={{ marginTop: 8 }}><strong>Account number (preview):</strong> <span style={{ fontFamily: 'monospace' }}>{previewAcctNumber}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowConfirm(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Back</button>
              <button type="button" onClick={() => performCreate(previewAcctNumber)} disabled={adding} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>{adding ? 'Creating...' : 'Confirm & Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* password prompt before editing */}
      {showPassPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100005 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(420px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Enter superpassword to edit</h3>
            <div style={{ marginBottom: 8 }}>
              <input value={passInput} onChange={e => setPassInput(e.target.value)} type="password" placeholder="Superpassword" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            {passError && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{passError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowPassPrompt(false); setPendingEdit(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={async () => {
                // verify
                if (passInput === (localStorage.getItem(SUPERPASS_KEY) || DEFAULT_SUPERPASS)) {
                  setShowPassPrompt(false);
                  const p = pendingEdit; setPendingEdit(null);
                  if (p) await openEdit(p.userId, p.accountNumber);
                } else {
                  setPassError('Incorrect password');
                }
              }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>Continue</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>Need to change the superpassword? <button onClick={() => { setShowPassPrompt(false); setShowSetPass(true); }} style={{ color: '#0a3cff', background: 'transparent', border: 'none', padding: 0 }}>Change it</button></div>
          </div>
        </div>
      )}

      {/* set/change superpassword modal */}
      {showSetPass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100006 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(520px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Change superpassword</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Current superpassword</label>
              <input value={currentPassInput} onChange={e => setCurrentPassInput(e.target.value)} type="password" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>New superpassword</label>
              <input value={newPassInput} onChange={e => setNewPassInput(e.target.value)} type="password" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Confirm new password</label>
              <input value={confirmNewPassInput} onChange={e => setConfirmNewPassInput(e.target.value)} type="password" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            {passError && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{passError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowSetPass(false); setPassError(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={async () => {
                setPassError('');
                const current = localStorage.getItem(SUPERPASS_KEY) || DEFAULT_SUPERPASS;
                if (currentPassInput !== current) { setPassError('Current password incorrect'); return; }
                if (!newPassInput || newPassInput !== confirmNewPassInput) { setPassError('New passwords do not match'); return; }
                setPassChangeLoading(true);
                try {
                  localStorage.setItem(SUPERPASS_KEY, newPassInput);
                  setSuperPass(newPassInput);
                  setShowSetPass(false);
                  setCurrentPassInput(''); setNewPassInput(''); setConfirmNewPassInput('');
                } finally { setPassChangeLoading(false); }
              }} disabled={passChangeLoading} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>{passChangeLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* edit user modal (opened after superpassword verification) */}
      {editShow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100007 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(640px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Edit user</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Account Number (read-only)</label>
              <div style={{ padding: '8px 10px', background: '#f7f9ff', borderRadius: 6, border: '1px solid #e6eefc', fontFamily: 'monospace' }}>{editAccountNumber}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>First Name</label>
                <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Middle Name</label>
                <input value={editMiddleName} onChange={e => setEditMiddleName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Last Name</label>
                <input value={editLastName} onChange={e => setEditLastName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Username</label>
                <input value={editUsername} onChange={e => setEditUsername(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Password</label>
                <input value={editPassword} onChange={e => setEditPassword(e.target.value)} type="password" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Pin</label>
                <input value={editPin} onChange={e => setEditPin(e.target.value)} inputMode="numeric" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Contact Number</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ padding: '8px 10px', background: '#f3f6ff', borderRadius: 6, border: '1px solid #e6eefc', color: '#0b3cff' }}>{CONTACT_PREFIX}</div>
                  <input value={editContactRest} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0,9); setEditContactRest(v); }} maxLength={9} inputMode="tel" placeholder="XXXXXXXXX" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
                </div>
              </div>
            </div>

            {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div>
                <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={deleteLoading} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#e53935', color: '#fff' }}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setEditShow(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
                <button type="button" onClick={performUpdate} disabled={editLoading} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#0a3cff', color: '#fff' }}>{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* delete confirmation modal (Are you sure?) */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100008 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(520px, 92%)' }}>
            <h3 style={{ marginTop: 0, color: '#e53935' }}>Are you sure?</h3>
            <div style={{ marginBottom: 12 }}>This will permanently delete the user and all associated accounts. This action cannot be undone.</div>
            {error && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={() => { setShowDeleteConfirm(false); setShowDeletePassPrompt(true); setDeletePassInput(''); setDeletePassError(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#e53935', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* password prompt for deletion */}
      {showDeletePassPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100009 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, width: 'min(420px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Enter superpassword to delete</h3>
            <div style={{ marginBottom: 8 }}>
              <input value={deletePassInput} onChange={e => setDeletePassInput(e.target.value)} type="password" placeholder="Superpassword" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefc' }} />
            </div>
            {deletePassError && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{deletePassError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowDeletePassPrompt(false); setDeletePassInput(''); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbeafe', background: '#fff' }}>Cancel</button>
              <button type="button" onClick={async () => {
                const current = localStorage.getItem(SUPERPASS_KEY) || DEFAULT_SUPERPASS;
                if (deletePassInput === current) {
                  setDeletePassError('');
                  await performDelete();
                } else {
                  setDeletePassError('Incorrect password');
                }
              }} disabled={deleteLoading} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#e53935', color: '#fff' }}>{deleteLoading ? 'Deleting...' : 'Continue'}</button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {showToast && successMsg && (
        <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 100003 }}>
          <div style={{ background: '#0a3cff', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(10,60,255,0.12)' }}>
            <div style={{ fontWeight: 600 }}>{successMsg}</div>
            {previewAcctNumber && <div style={{ fontFamily: 'monospace', marginTop: 6 }}>Account: {previewAcctNumber}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

