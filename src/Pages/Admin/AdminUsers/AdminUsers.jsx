import React, { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import './AdminUsers.css';

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
    // superpassword handling - uses admin PIN from localStorage
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

  async function openEdit(userId, accountNumber) {
    setError('');
    setEditLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('username, firstname, middlename, lastname, contact_number, pin').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        setEditUserId(userId);
        setEditAccountNumber(accountNumber || '');
        setEditUsername(data.username || '');
        setEditFirstName(data.firstname || '');
        setEditMiddleName(data.middlename || '');
        setEditLastName(data.lastname || '');
        setEditPassword(''); // Don't load hashed password
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
        password: editPassword ? await hashPassword(editPassword) : undefined,
        pin: editPin || undefined,
      };
      const { data, error } = await supabase.from('users').update(payload).eq('id', editUserId);
      if (error) throw error;
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

  async function performDelete() {
    if (!editUserId) return;
    setError('');
    setDeleteLoading(true);
    try {
      const { error: acctErr } = await supabase.from('accounts').delete().eq('user_id', editUserId);
      if (acctErr) throw acctErr;
      const { error: userErr } = await supabase.from('users').delete().eq('id', editUserId);
      if (userErr) throw userErr;
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
    const s = String(acct);
    if (s.length <= 4) return s;
    return s.replace(/.(?=.{4})/g, '*');
  }

  function generateAccountNumber(length = 8) {
    let s = '';
    while (s.length < length) {
      s += Math.floor(Math.random() * 10).toString();
    }
    if (s[0] === '0') s = (Math.floor(1 + Math.random() * 9)).toString() + s.slice(1);
    return s;
  }

  async function openPreview() {
    setError('');
    setSuccessMsg('');
    if (!firstName.trim() || !lastName.trim() || !/^[0-9]{9}$/.test(contactRest)) {
      setError('Please provide first name, last name and a 9-digit contact number (without the +639 prefix).');
      return;
    }
    const acct = generateAccountNumber(8);
    setPreviewAcctNumber(acct);
    setShowAdd(false);
    setShowConfirm(true);
  }

  async function performCreate(initialAcct) {
    setError('');
    setAdding(true);
    setShowConfirm(false);
    try {
      let finalInserted = null;
      let userId = null;
      let setupToken = null; // Declare setupToken outside the loop
      
      for (let attempt = 0; attempt < 8; attempt++) {
        const acct = attempt === 0 && initialAcct ? initialAcct : generateAccountNumber(8);
        
        // Generate a unique setup token
        setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const userPayload = {
          username: null, // Will be set during account setup
          password: 'TEMP_' + setupToken.substring(0, 10), // Temporary password until user sets their own
          firstname: firstName.trim(),
          middlename: middleName.trim() || null,
          lastname: lastName.trim(),
          contact_number: CONTACT_PREFIX + contactRest,
          pin: '0000', // Temporary PIN until user sets their own
          setup_token: setupToken,
          role: 'user'
        };
        const { data: userData, error: userError } = await supabase.from('users').insert([userPayload]).select('id');
        if (userError) {
          console.error('Failed to insert user', userError);
          throw userError;
        }
        userId = userData && userData[0] && userData[0].id;
        if (!userId) {
          throw new Error('Failed to obtain user id after insert');
        }
        const acctPayload = { user_id: userId, account_number: acct };
        const { data: acctData, error: acctError } = await supabase.from('accounts').insert([acctPayload]);
        if (acctError) {
          const msg = (acctError && acctError.message) || '';
          console.warn('Account insert failed', acctError);
          try {
            await supabase.from('users').delete().eq('id', userId);
          } catch (cleanupErr) {
            console.warn('Failed to cleanup user after account insert failure', cleanupErr);
          }
          if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
            continue;
          }
          throw acctError;
        }
        
        // Send SMS with OTP for account verification
        try {
          // Use production URL
          const setupLink = `https://cache-flow-t8da.vercel.app/setup-account?token=${setupToken}`;
          console.log('Attempting to send SMS to:', CONTACT_PREFIX + contactRest);
          console.log('Setup link:', setupLink);
          
          // Send first message: OTP
          const response = await fetch('http://localhost:3001/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phoneNumbers: [CONTACT_PREFIX + contactRest]
            })
          });

          const responseData = await response.json();
          console.log('OTP SMS Response:', responseData);

          if (response.ok && responseData.otp) {
            console.log('OTP sent successfully:', responseData.otp);
            
            // Wait 3 seconds before sending second message
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Send second message: Setup link (shortened without http://)
            const shortLink = setupLink.replace('http://', '').replace('https://', '');
            const linkResponse = await fetch('http://localhost:3001/api/send-setup-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                phoneNumbers: [CONTACT_PREFIX + contactRest],
                message: `Setup: ${shortLink}`
              })
            });
            
            const linkData = await linkResponse.json();
            console.log('Setup link SMS Response:', linkData);
          } else {
            console.warn('Failed to send OTP SMS:', responseData);
          }
        } catch (smsErr) {
          console.error('SMS sending error:', smsErr);
          // Don't fail the whole operation if SMS fails
        }
        
        finalInserted = acctData;
        setPreviewAcctNumber(acct);
        break;
      }
      if (!finalInserted) throw new Error('Failed to generate a unique account number after several attempts.');
      await loadUsers();
      // Close modal and clear form first
      setShowAdd(false);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setContactRest('');
      
      // Show success message with setup link for admin to share
      const setupLink = `${window.location.origin}/setup-account?token=${setupToken}`;
      setSuccessMsg(`User created! Setup link: ${setupLink}`);
      setShowToast(true);
      
      // Copy link to clipboard
      navigator.clipboard.writeText(setupLink).then(() => {
        console.log('Setup link copied to clipboard');
      }).catch(err => {
        console.warn('Failed to copy to clipboard:', err);
      });
      
      setTimeout(() => { setShowToast(false); setSuccessMsg(''); }, 10000); // Show for 10 seconds
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
            (() => {
              const map = new Map();
              for (const r of rows) {
                if (!map.has(r.user_id)) map.set(r.user_id, r);
              }
              const unique = Array.from(map.values());
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
          <div style={{ position: 'fixed', left: 12, top: 12, background: 'rgba(10,60,255,0.95)', color: '#fff', padding: '6px 10px', borderRadius: 6, zIndex: 99999 }}>Add modal open</div>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990 }}>
          <form
            onSubmit={e => { e.preventDefault(); openPreview(); }}
            style={{ background: '#fff', padding: 24, borderRadius: 10, width: 'min(640px, 92%)' }}>
            <h3 style={{ marginTop: 0 }}>Create user & account</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>First name</label>
                <input className="au-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>Middle name</label>
                <input className="au-input" value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>Last name</label>
                <input className="au-input" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>Contact (9 digits)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center' }}>{CONTACT_PREFIX}</div>
                  <input className="au-input" value={contactRest} onChange={e => setContactRest(e.target.value.replace(/\D/g, '').slice(0,9))} />
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>User will receive an SMS with a setup link to create their password and PIN</div>
              </div>
            </div>
            {error && <div style={{ color: '#d32f2f', marginTop: 10 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => setShowAdd(false)} className="au-btn au-btn-cancel">Cancel</button>
              <button type="submit" disabled={adding} className="au-btn au-btn-primary">{adding ? 'Adding...' : 'Create'}</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* edit modal */}
      {editShow && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Edit user</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="au-label">Username</label>
                <input className="au-input" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
              </div>
              <div>
                <label className="au-label">Account number</label>
                <input className="au-input" value={editAccountNumber} onChange={e => setEditAccountNumber(e.target.value)} />
              </div>
              <div>
                <label className="au-label">First name</label>
                <input className="au-input" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
              </div>
              <div>
                <label className="au-label">Middle name</label>
                <input className="au-input" value={editMiddleName} onChange={e => setEditMiddleName(e.target.value)} />
              </div>
              <div>
                <label className="au-label">Last name</label>
                <input className="au-input" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
              </div>
              <div>
                <label className="au-label">Contact (9 digits)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center' }}>{CONTACT_PREFIX}</div>
                  <input className="au-input" value={editContactRest} onChange={e => setEditContactRest(e.target.value.replace(/\D/g, '').slice(0,9))} />
                </div>
              </div>
              <div>
                <label className="au-label">Password</label>
                <input className="au-input" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
              </div>
              <div>
                <label className="au-label">PIN</label>
                <input className="au-input" value={editPin} onChange={e => setEditPin(e.target.value)} />
              </div>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" onClick={() => { setEditShow(false); setEditUserId(null); }} className="modal-btn modal-cancel">Close</button>
              <button 
                type="button" 
                onClick={() => setShowDeletePassPrompt(true)} 
                className="modal-btn"
                style={{ background: '#d32f2f', color: 'white' }}
              >
                Delete User
              </button>
              <button type="button" onClick={performUpdate} disabled={editLoading} className="modal-btn modal-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation with password prompt */}
      {showDeletePassPrompt && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-card">
            <h3 style={{ color: '#d32f2f' }}>Confirm Delete User</h3>
            <p>This action will permanently delete the user and their account. This cannot be undone.</p>
            <p><strong>User:</strong> {editUsername}</p>
            <p><strong>Account:</strong> {editAccountNumber}</p>
            <div style={{ marginTop: 16 }}>
              <label className="au-label">Enter Superadmin Password</label>
              <input 
                className="au-input" 
                type="password"
                value={deletePassInput} 
                onChange={e => { setDeletePassInput(e.target.value); setDeletePassError(''); }}
                placeholder="Enter superadmin password"
              />
            </div>
            {deletePassError && <div className="modal-error">{deletePassError}</div>}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button 
                type="button" 
                onClick={() => { 
                  setShowDeletePassPrompt(false); 
                  setDeletePassInput(''); 
                  setDeletePassError(''); 
                }} 
                className="modal-btn modal-cancel"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  const hashedInput = await hashPassword(deletePassInput);
                  if (hashedInput === superPassHash) {
                    performDelete();
                  } else {
                    setDeletePassError('Incorrect superadmin password');
                  }
                }}
                disabled={deleteLoading}
                className="modal-btn"
                style={{ background: '#d32f2f', color: 'white' }}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPassPrompt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Enter superpassword</h3>
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
              <button type="button" onClick={() => { setShowPassPrompt(false); setShowPassword(false); }} className="modal-btn modal-cancel">Cancel</button>
              <button type="button" onClick={async () => {
                const hashedInput = await hashPassword(passInput);
                if (hashedInput === superPassHash) {
                  setShowPassPrompt(false);
                  setShowPassword(false);
                  const pending = pendingEdit; setPendingEdit(null);
                  if (pending) openEdit(pending.userId, pending.accountNumber);
                } else {
                  setPassError('Incorrect password');
                }
              }} className="modal-btn modal-primary">Continue</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm create</h3>
            <div>Account number preview: <strong>{previewAcctNumber}</strong></div>
            <div className="modal-actions">
              <button type="button" onClick={() => { 
                setShowConfirm(false); 
                setShowAdd(true); 
              }} className="modal-btn modal-cancel">Cancel</button>
              <button type="button" onClick={() => performCreate(previewAcctNumber)} className="modal-btn modal-primary">Create</button>
            </div>
          </div>
        </div>
      )}

      {showToast && <div className="au-toast">{successMsg}</div>}
    </div>
  );
}
