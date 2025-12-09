import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { locations } from '../../utils/locations';
import { supabase } from '../../utils/supabaseClient';
import useOtp from '../../hooks/useOtp';

const smallMarkerHtml = (type, hasCardless) => `
  <div style="
    background: ${type === 'Branch' ? '#0a3cff' : '#4CAF50'};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    border: 2px solid white;
  ">
    ${type === 'Branch' ? '🏦' : '🏧'}
    ${hasCardless ? '<span style="position: absolute; top: -4px; right: -4px; background: #FFD700; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></span>' : ''}
  </div>`;

const CardlessWithdrawalModal = ({ onClose, atmName, onGenerate }) => {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [pinError, setPinError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Locations that support cardless withdrawal
  const cardlessLocations = locations.filter(l => l.hasCardless);

  const [selectedLocation, setSelectedLocation] = useState(() => {
    // try to find by atmName, otherwise fallback to first cardless location
    const found = cardlessLocations.find(l => l.name === atmName);
    return found || cardlessLocations[0] || null;
  });

  useEffect(() => {
    // if atmName changes externally, update selection
    if (atmName) {
      const found = cardlessLocations.find(l => l.name === atmName);
      if (found) setSelectedLocation(found);
    }
  }, [atmName]);

  // Check for existing withdrawal code on mount
  useEffect(() => {
    const storedWithdrawal = localStorage.getItem('cf_active_withdrawal');
    if (storedWithdrawal) {
      try {
        const data = JSON.parse(storedWithdrawal);
        const expiresAt = new Date(data.expiresAt).getTime();
        const now = Date.now();
        
        if (now < expiresAt) {
          // Still valid, restore the withdrawal
          const secondsLeft = Math.floor((expiresAt - now) / 1000);
          setGeneratedCode(data.code);
          setWithdrawalAmount(data.amount);
          setTimeRemaining(secondsLeft);
          setTransactionId(data.transactionId);
          
          // Update selected location if stored
          if (data.locationName) {
            const found = cardlessLocations.find(l => l.name === data.locationName);
            if (found) setSelectedLocation(found);
          }
        } else {
          // Expired, clear it
          localStorage.removeItem('cf_active_withdrawal');
        }
      } catch (e) {
        console.error('Failed to parse stored withdrawal:', e);
        localStorage.removeItem('cf_active_withdrawal');
      }
    }
  }, []);

  // sender info & balance
  const senderUserId = localStorage.getItem('user_id');
  const [senderBalance, setSenderBalance] = useState(null);
  const { send: otpSend, resend: otpResend, verify: otpVerify, resendDisabled, resendTimer, lockRemaining } = useOtp({ prefix: 'cf_cw' });

  useEffect(() => {
    const fetchBalance = async () => {
      if (!senderUserId) return setSenderBalance(null);
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('user_id', senderUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data && data.balance !== undefined) setSenderBalance(data.balance);
        else setSenderBalance(null);
      } catch (err) {
        setSenderBalance(null);
      }
    };
    fetchBalance();
  }, [senderUserId, selectedLocation]);

  // Countdown timer for generated code
  useEffect(() => {
    if (timeRemaining === null) return;
    
    if (timeRemaining <= 0) {
      // Time expired - already handled in interval callback
      localStorage.removeItem('cf_active_withdrawal');
      handleClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time expired - mark as Unsuccessful and refund balance
          if (transactionId && withdrawalAmount) {
            (async () => {
              try {
                const userId = localStorage.getItem('user_id');
                if (!userId) return;

                // Get current account balance
                const { data: accData, error: accErr } = await supabase
                  .from('accounts')
                  .select('id, balance')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (accErr || !accData) {
                  console.error('Failed to fetch account for balance refund:', accErr);
                  return;
                }

                const newBalance = accData.balance + withdrawalAmount;

                // Refund account balance
                await supabase
                  .from('accounts')
                  .update({ balance: newBalance })
                  .eq('id', accData.id);

                // Update transaction status to Unsuccessful
                await supabase
                  .from('transactions')
                  .update({ 
                    transaction_status: 'Unsuccessful',
                    remaining_balance: newBalance
                  })
                  .eq('id', transactionId);

                window.dispatchEvent(new CustomEvent('transactions:refresh'));
              } catch (err) {
                console.error('Failed to process unsuccessful withdrawal:', err);
              }
            })();
          }
          localStorage.removeItem('cf_active_withdrawal');
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, transactionId, withdrawalAmount]);

  // amount validity computations
  const amtVal = parseFloat(amount || '0');
  const amountValid = amount && !isNaN(amtVal) && amtVal > 0;
  const insufficient = senderBalance !== null && amountValid && amtVal > senderBalance;

  const handleGenerate = () => {
    // clear previous errors
    setAmountError('');
    setPinError('');
    setError('');

    let hasError = false;
    if (!amount) {
      setAmountError('Amount is required');
      hasError = true;
    }
    if (!pin) {
      setPinError('PIN is required');
      hasError = true;
    }
    if (hasError) return;

    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    // Verify PIN before generating withdrawal code
    (async () => {
      try {
        const requestedAmt = parseFloat(amount) || 0;
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
          setError('No user found. Please log in again.');
          return;
        }

        // Fetch account data
        const { data: accData, error: accErr } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (accErr || !accData) {
          console.error('Failed to fetch account', accErr);
          setError('No account found for current user.');
          return;
        }

        const accountId = accData.id;
        const accBalance = accData.balance;

        if (accBalance < requestedAmt) {
          setError('Insufficient balance.');
          return;
        }

        // Verify PIN against database
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('pin')
          .eq('id', userId)
          .single();
        
        if (userErr) {
          console.error('Failed to fetch user PIN', userErr);
          setPinError('Unable to verify PIN.');
          return;
        }
        
        const storedPin = userData?.pin ?? null;
        if (!storedPin) {
          setPinError('No PIN is set on your account. Please set a PIN in your profile.');
          return;
        }
        
        if (String(storedPin) !== String(pin)) {
          setPinError('Incorrect PIN.');
          return;
        }

        // PIN is correct, generate withdrawal code
        const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const fullPayload = [{
          account_id: accountId,
          amount: -(requestedAmt),
          type_id: 4,
          type: 'Cardless Withdrawal',
          date: new Date().toISOString(),
          transaction_status: 'Pending',
          bank: selectedLocation?.name || atmName,
          code: withdrawalCode,
          expires_at: expiresAt,
          remaining_balance: accBalance,
          description: `Cardless Withdrawal (requested ₱${requestedAmt.toLocaleString()}) at ${selectedLocation?.name || atmName}`,
        }];

        // Try inserting full payload; if DB rejects unknown columns (e.g. no 'code'), retry reduced payload
        let inserted = null;
        try {
          const res = await supabase.from('transactions').insert(fullPayload).select().single();
          if (res.error) throw res.error;
          inserted = res.data;
        } catch (firstErr) {
          console.warn('Insert pending withdrawal error (full payload):', firstErr);
          const reducedPayload = [{
            account_id: accountId,
            amount: -(requestedAmt),
            type_id: 4,
            type: 'Cardless Withdrawal',
            date: new Date().toISOString(),
            transaction_status: 'Pending',
            bank: selectedLocation?.name || atmName,
            description: `Cardless Withdrawal (requested ₱${requestedAmt.toLocaleString()}) at ${selectedLocation?.name || atmName}`,
          }];
          try {
            const res2 = await supabase.from('transactions').insert(reducedPayload).select().single();
            if (res2.error) throw res2.error;
            inserted = res2.data;
          } catch (secondErr) {
            console.error('Insert pending withdrawal error (reduced payload):', secondErr);
            throw secondErr;
          }
        }

        setGeneratedCode(withdrawalCode);
        setWithdrawalAmount(requestedAmt);
        setTimeRemaining(10 * 60); // 10 minutes in seconds
        setTransactionId(inserted.id);
        
        // Store in localStorage for persistence
        const withdrawalData = {
          code: withdrawalCode,
          amount: requestedAmt,
          expiresAt: expiresAt,
          locationName: selectedLocation?.name || atmName,
          transactionId: inserted.id,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('cf_active_withdrawal', JSON.stringify(withdrawalData));
        
        onGenerate?.(selectedLocation, inserted);
        window.dispatchEvent(new CustomEvent('transactions:refresh'));

      } catch (err) {
        console.error('Exception inserting pending withdrawal:', err);
        setError(`Failed to record pending withdrawal: ${err.message}`);
      }
    })();

    /*
    // validate amount
    const amt = parseFloat(amount || '0');
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (senderBalance !== null && amt > senderBalance) {
      setError('Insufficient balance for this withdrawal.');
      return;
    }

    const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // insert a pending transaction into the DB with a 10-minute expiry
    (async () => {
      try {
  // Short expiry for testing: 30 seconds
  const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

        // store a pending transaction. We don't deduct balance yet; processing will do that when code redeemed.
        const requestedAmt = parseFloat(amount) || 0;

        // fetch full sender account row - require account to insert and to validate PIN
        const userId = localStorage.getItem('user_id');
        let accountId = null;
        let accBalance = null;
        let accRow = null;
        if (userId) {
          const { data: accData, error: accErr } = await supabase
            .from('accounts')
            .select('id, balance')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (accErr) {
            console.error('Failed to fetch account for PIN check', accErr);
          }
          if (accData) {
            accountId = accData.id;
            accBalance = accData.balance;
            accRow = accData;
          }
        }

        if (!accountId) {
          setError('No account found for current user. Please ensure you have an account set up.');
          return;
        }

        // fetch the PIN from the users table and verify it server-side via Supabase
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('pin')
          .eq('id', userId)
          .single();
        if (userErr) {
          console.error('Failed to fetch user PIN', userErr);
          setError('Unable to verify PIN.');
          return;
        }
        const storedPin = userData?.pin ?? null;
        if (!storedPin) {
          setError('No PIN is set on your account. Unable to verify PIN.');
          return;
        }
        if (String(storedPin) !== String(pin)) {
          setError('Incorrect PIN.');
          return;
        }

        // Pending withdrawal should record the negative amount (requested) per user request
        const fullPayload = [{
          account_id: accountId,
          amount: -(requestedAmt),
          type_id: 4,
          type: 'Cardless Withdrawal',
          date: new Date().toISOString(),
          transaction_status: 'Pending',
          // save the selected location name in the bank column for easier lookup
          bank: selectedLocation?.name || atmName,
          code: withdrawalCode,
          expires_at: expiresAt,
          remaining_balance: accBalance,
          description: `Cardless Withdrawal (requested
        }];

        // Try inserting full payload; if DB rejects unknown columns, retry reduced payload.
        let inserted = null;
        try {
          const res = await supabase.from('transactions').insert(fullPayload).select().single();
          if (res.error) throw res.error;
          inserted = res.data;
        } catch (firstErr) {
          console.error('Insert pending withdrawal error (full payload):', firstErr);
          // attempt reduced payload without optional columns
          const reducedPayload = [{
            account_id: accountId,
            // store negative amount even in reduced payload so withdrawals show as debits
            amount: -(requestedAmt),
            type_id: 4,
            type: 'Cardless Withdrawal',
            date: new Date().toISOString(),
            transaction_status: 'Pending',
            // also include bank in reduced payload
            bank: selectedLocation?.name || atmName,
            description: `Cardless Withdrawal (requested ₱${requestedAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) at ${selectedLocation?.name || atmName}`,
          }];
          try {
            const res2 = await supabase.from('transactions').insert(reducedPayload).select().single();
            if (res2.error) throw res2.error;
            inserted = res2.data;
          } catch (secondErr) {
            console.error('Insert pending withdrawal error (reduced payload):', secondErr);
            const msg2 = secondErr?.message || JSON.stringify(secondErr);
            setError(`Failed to record pending withdrawal: ${msg2}`);
            return;
          }
        }

        setGeneratedCode(withdrawalCode);
        console.log('Inserted pending withdrawal:', inserted);
        // notify parent with the selected location and the inserted transaction
        onGenerate?.(selectedLocation, inserted);
        // notify any listeners (Transactions page) to refresh immediately
        try {
          window.dispatchEvent(new CustomEvent('transactions:refresh'));
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error('Exception inserting pending withdrawal:', err);
        const msg = err?.message || JSON.stringify(err);
        setError(`Failed to record pending withdrawal: ${msg}`);
      }
    })();
    */
  };

  const handleClaimWithdrawal = async () => {
    // Mark transaction as Successful and deduct balance (user claimed the withdrawal)
    if (transactionId && withdrawalAmount) {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        // Get current account balance
        const { data: accData, error: accErr } = await supabase
          .from('accounts')
          .select('id, balance')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (accErr || !accData) {
          console.error('Failed to fetch account for balance deduction:', accErr);
          return;
        }

        const newBalance = accData.balance - withdrawalAmount;

        // Deduct balance
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', accData.id);

        // Update transaction status to Successful
        await supabase
          .from('transactions')
          .update({ 
            transaction_status: 'Successful',
            remaining_balance: newBalance
          })
          .eq('id', transactionId);

        window.dispatchEvent(new CustomEvent('transactions:refresh'));
        
        // Show success message
        setSuccessMessage('Withdrawal claimed successfully!');
        setShowSuccessModal(true);
      } catch (err) {
        console.error('Failed to update transaction status to Successful:', err);
      }
    }
    // Clear localStorage and close
    localStorage.removeItem('cf_active_withdrawal');
    setGeneratedCode(null);
    setTimeRemaining(null);
    setTransactionId(null);
    setWithdrawalAmount(null);
    handleClose();
  };

  const handleCancelWithdrawal = async () => {
    if (transactionId) {
      try {
        // Update transaction status to "Cancelled"
        await supabase
          .from('transactions')
          .update({ transaction_status: 'Cancelled' })
          .eq('id', transactionId);

        window.dispatchEvent(new CustomEvent('transactions:refresh'));
        
        // Show cancellation message
        setSuccessMessage('Withdrawal cancelled successfully.');
        setShowSuccessModal(true);
      } catch (err) {
        console.error('Failed to cancel transaction:', err);
      }
    }
    // Clear localStorage and reset state
    localStorage.removeItem('cf_active_withdrawal');
    setGeneratedCode(null);
    setTimeRemaining(null);
    setTransactionId(null);
    setWithdrawalAmount(null);
    setAmount('');
    setPin('');
    setError('');
    setAmountError('');
    setPinError('');
  };

  const handleClose = () => {
    // Don't clear generated code state if it exists - it should persist
    // Only clear input fields
    try {
      if (!generatedCode) {
        // Only clear form fields if no code is generated
        setAmount('');
        setPin('');
        setError('');
        setAmountError('');
        setPinError('');
      }
      // Note: We don't clear generatedCode, timeRemaining, or withdrawalAmount
      // They should persist in localStorage until expired
    } catch (e) {}
    if (typeof onClose === 'function') onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '1.25rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '760px',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ marginTop: 0 }}>Cardless Withdrawal - {selectedLocation?.name || atmName}</h2>

        {!generatedCode ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* shared input style so select, amount and pin match */}
            {/* keep this inside render so styles are colocated with JSX */}
            {null}
            {/* Left: form */}
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Branch / ATM
                </label>
                {/* shared style object applied to select/input so sizes match */}
                <select
                  value={selectedLocation?.id || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const loc = cardlessLocations.find(l => l.id === id);
                    setSelectedLocation(loc || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    height: '44px',
                    boxSizing: 'border-box'
                  }}
                >
                  {cardlessLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} · {loc.type}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Amount (₱)
                  <input
                    type="text"
                    placeholder="0.00"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const firstDot = v.indexOf('.');
                      if (firstDot !== -1) {
                        v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
                        const parts = v.split('.');
                        parts[1] = (parts[1] || '').slice(0, 2);
                        v = parts[0] + (parts[1] !== '' ? '.' + parts[1] : '');
                      }
                      setAmount(v);
                      if (amountError) setAmountError('');
                    }}
                    onKeyDown={(e) => {
                      const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Enter'];
                      if (allowed.includes(e.key)) return;
                      if (e.key === '.') {
                        if (amount.includes('.')) e.preventDefault();
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      height: '44px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {amountError && <div style={{ color: '#e53935', marginTop: '0.35vw', fontSize: '0.9rem', fontWeight: 600 }}>{amountError}</div>}
                </label>

                {senderBalance !== null && amount && (() => {
                  const amt = parseFloat(amount);
                  if (!isNaN(amt) && amt > senderBalance) {
                    return <div style={{ color: '#e53935', marginTop: '0.35vw', fontSize: '0.9rem', fontWeight: 600 }}>Insufficient balance — Current: ₱{senderBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
                  }
                  return null;
                })()}
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  PIN:
                  <input
                    type="password"
                    maxLength="4"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); if (pinError) setPinError(''); }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      marginTop: '0.25rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      height: '44px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {pinError && <div style={{ color: '#e53935', marginTop: '0.35vw', fontSize: '0.9rem', fontWeight: 600 }}>{pinError}</div>}
                </label>
              </div>

              {error && (
                <div style={{ color: 'red', marginBottom: '0.75rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '0.5rem 0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    background: 'white'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!amountValid || insufficient}
                  style={{
                    padding: '0.5rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#0a3cff',
                    color: 'white',
                    cursor: (!amountValid || insufficient) ? 'not-allowed' : 'pointer',
                    opacity: (!amountValid || insufficient) ? 0.6 : 1
                  }}
                >
                  Generate Code
                </button>
              </div>
            </div>

            {/* Right: small map + details */}
            <div style={{ width: 260, minWidth: 220, boxSizing: 'border-box' }}>
              {selectedLocation ? (
                <>
                  <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{selectedLocation.name}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedLocation.address}</div>
                  <div style={{ width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
                    <MapContainer
                      center={selectedLocation.position}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={selectedLocation.position}
                        icon={divIcon({
                          className: '',
                          html: smallMarkerHtml(selectedLocation.type, selectedLocation.hasCardless),
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      />
                    </MapContainer>
                  </div>
                </>
              ) : (
                <div style={{ color: '#666' }}>No branch selected</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '1.5rem 0',
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '8px'
            }}>
              {generatedCode}
            </div>
            {withdrawalAmount && (
              <div style={{
                fontSize: '1.1rem',
                marginBottom: '0.5rem',
                color: '#666'
              }}>
                Amount: ₱{withdrawalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            {timeRemaining !== null && (
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: timeRemaining <= 60 ? '#e53935' : '#4CAF50',
                marginBottom: '1rem'
              }}>
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')} remaining
              </div>
            )}
            <p style={{ marginBottom: '1rem' }}>
              Your withdrawal code is valid for 10 minutes.<br />
              Proceed to the selected ATM/branch to withdraw, then click "Claimed" below.<br/>
              <small style={{ color: '#666' }}>If not claimed within 10 minutes, the withdrawal will be automatically cancelled.</small>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={handleCancelWithdrawal}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel Withdrawal
              </button>
              <button
                onClick={handleClaimWithdrawal}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Claimed
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#0a3cff',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Exit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>✓</div>
            <h3 style={{ marginBottom: '1rem', color: '#4CAF50' }}>Success</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>{successMessage}</p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (successMessage.includes('claimed')) {
                  window.location.reload();
                } else {
                  // Just close the modal for cancellation
                  setShowSuccessModal(false);
                }
              }}
              style={{
                padding: '0.5rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                background: '#4CAF50',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '1rem'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardlessWithdrawalModal;
