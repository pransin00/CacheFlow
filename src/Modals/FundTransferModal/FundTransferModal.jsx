import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import { supabase } from '../../utils/supabaseClient';
import useOtp from '../../hooks/useOtp';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import UnregisteredAccountModal from '../UnregisteredAccountModal/UnregisteredAccountModal';
import OtpModal from '../OtpModal/OtpModal';
import './FundTransferModal.css';

const ProcessingModal = ({ isOpen }) => (
  <Modal isOpen={isOpen}>
    <div style={{ padding: '2vw', minWidth: 320, textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: '1.5vw', color: '#1856c9', marginBottom: '1vw' }}>Processing Transfer...</div>
      <div style={{ margin: '2vw 0' }}>
        <span className="loader"></span>
      </div>
    </div>
  </Modal>
);

const SuccessModal = ({ isOpen, transaction, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div style={{
      padding: '2.5vw 2.5vw 2vw 2.5vw',
      minWidth: 380,
      maxWidth: 420,
      width: '100%',
      borderRadius: '1.5vw',
      background: '#fff',
      boxShadow: '0 8px 40px rgba(10,60,255,0.10)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      zIndex: 1000
    }}>
      <button onClick={onClose} aria-label="Close" style={{
        position: 'absolute',
        top: '1vw',
        right: '1vw',
        background: 'none',
        border: 'none',
        fontSize: '1.7vw',
        color: '#888',
        cursor: 'pointer',
        fontWeight: 700,
        zIndex: 1001
      }}>&times;</button>
      <div style={{ fontWeight: 700, fontSize: '2vw', color: '#43a047', marginBottom: '1vw', textAlign: 'center' }}>Transfer Successful!</div>
        <div style={{ marginBottom: '1vw', color: '#222', fontWeight: 500, textAlign: 'center' }}>
        <div>
          <b>To:</b>{' '}
          {transaction?.recipient_initials ? (
            <span>{transaction.recipient_initials} — {transaction.recipient_account_number}</span>
          ) : (
            <span>{transaction?.recipient_account_number}</span>
          )}
        </div>
        <div><b>Amount:</b> ₱{Math.abs(transaction?.amount)?.toLocaleString()}</div>
        <div><b>Date:</b> {transaction?.date ? new Date(transaction.date).toLocaleString() : ''}</div>
        {transaction?.description && <div><b>Remarks:</b> {transaction.description}</div>}
        <div><b>Status:</b> {transaction?.transaction_status}</div>
        <div><b>Reference #:</b> {transaction?.id}</div>
      </div>
    </div>
  </Modal>
);

const FundTransferModal = ({ isOpen, onClose, onTransferSuccess }) => {
  // Clear success message when modal is closed or opened for new transfer
  React.useEffect(() => {
    if (!isOpen) {
      try { resetFields(); } catch (e) {}
      setSuccess('');
    }
  }, [isOpen]);
  const [accountNumber, setAccountNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [accountError, setAccountError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [senderBalance, setSenderBalance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [localOtpError, setLocalOtpError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  // use shared OTP hook
  const {
    send: otpSend,
    resend: otpResend,
    verify: otpVerify,
    reset: otpReset,
    sentOtp,
    resendDisabled,
    resendTimer,
    lockRemaining,
    attempts: otpAttempts,
  } = useOtp({ prefix: 'cf_ft', sendEndpoint: 'http://localhost:3001/api/send-otp' });
  const [pendingTransfer, setPendingTransfer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [pendingDetails, setPendingDetails] = useState(null);
  const [recipientInitials, setRecipientInitials] = useState('');
  const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
  const [unregisteredDetails, setUnregisteredDetails] = useState(null);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  const [unverifiedDetails, setUnverifiedDetails] = useState(null);

  // Get sender info from localStorage
  const senderUserId = localStorage.getItem('user_id');

  // Fetch sender balance when modal opens so we can show realtime insufficient balance feedback
  React.useEffect(() => {
    const fetchBalance = async () => {
      if (!isOpen) return;
      if (!senderUserId) return;
      try {
        const { data: senderAcc } = await supabase
          .from('accounts')
          .select('balance')
          .eq('user_id', senderUserId)
          .single();
        if (senderAcc && senderAcc.balance !== undefined) setSenderBalance(senderAcc.balance);
        else setSenderBalance(null);
      } catch (err) {
        setSenderBalance(null);
      }
    };
    fetchBalance();
  }, [isOpen, senderUserId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTransfer();
  };

  const resetFields = () => {
    setAccountNumber('');
    setRemarks('');
    setAmount('');
    setAccountError('');
    setAmountError('');
    setError('');
    setSuccess('');
    setShowConfirm(false);
    setPendingDetails(null);
    setShowUnregisteredModal(false);
    setUnregisteredDetails(null);
    // reset otp hook state for fresh flows
    try { otpReset(); } catch (e) {}
  };

  const handleTransfer = async () => {
    setError('');
    setAccountError('');
    setAmountError('');
    // Validate account number and amount separately to provide specific messages
    const sanitizedAcc = accountNumber ? accountNumber.replace(/\s/g, '') : '';
    // per-field required validation
    let hasError = false;
    if (!sanitizedAcc) {
      setAccountError('Account number is required');
      hasError = true;
    } else if (sanitizedAcc.length < 8) {
      setAccountError('Account number is incomplete. It must be 8 digits.');
      hasError = true;
    } else if (sanitizedAcc.length > 8) {
      setAccountError('Account number must be exactly 8 digits.');
      hasError = true;
    }
    if (amount === null || amount === undefined || amount.toString().trim() === '') {
      setAmountError('Amount is required');
      hasError = true;
    }
    if (hasError) return;
    // Parse amount defensively: accept strings or numbers, strip thousands separators
    const parseAmount = (v) => {
      if (v === null || v === undefined) return NaN;
      const s = String(v).replace(/,/g, '').trim();
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    };
    const parsedAmount = parseAmount(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    const senderUserId = localStorage.getItem('user_id');
    if (!senderUserId) {
      setError('Please log in again.');
      return;
    }
    if (!senderUserId) {
      setError('Sender not found.');
      return;
    }
    // Normalize account number and guard empty
    const sanitized = accountNumber.replace(/\s/g, '');
    if (!sanitized) {
      setAccountError('Please enter a valid account number.');
      return;
    }

    // Check if recipient account exists and get masked name (safer: maybeSingle + catch)
    let recipientData = null;
    try {
      const resp = await supabase
        .from('accounts')
        .select('user_id')
        .eq('account_number', sanitized)
        .maybeSingle();
      recipientData = resp.data;
      if (resp.error) {
        // log for debugging and fall through to unregistered behavior
        console.debug('recipient lookup error', resp.error);
      }
    } catch (err) {
      console.debug('recipient lookup exception', err);
    }

    let maskedName = '';
    let recipientExists = !!recipientData;
    if (recipientExists) {
      // Get recipient's name for masking
      const { data: recipientUser } = await supabase
        .from('users')
        .select('firstname, lastname')
        .eq('id', recipientData.user_id)
        .single();
      if (recipientUser) {
        const firstInitial = recipientUser.firstname.charAt(0);
        const lastInitial = recipientUser.lastname.charAt(0);
        // show masked initials like: I*** R**
        maskedName = `${firstInitial}*** ${lastInitial}**`;
      }
      // No verification check: existing accounts proceed directly to balance check/confirmation
    }

    // Check sender balance
    const { data: senderAccount, error: senderErr } = await supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', senderUserId)
      .single();

    if (!senderAccount || senderErr) {
      setError('Error checking account balance.');
      return;
    }

    const transferAmount = parsedAmount;
    if (senderAccount.balance < transferAmount) {
      setError('Insufficient balance.');
      return;
    }

    // If recipient doesn't exist (or lookup errored), show Unregistered modal now
    if (!recipientExists) {
      setUnregisteredDetails({
        accountNumber: sanitizedAcc,
        amount: transferAmount,
        remarks,
      });
      setShowUnregisteredModal(true);
      return;
    }

    setPendingDetails({
      accountNumber: sanitizedAcc,
      maskedName,
      amount: transferAmount,
      remarks,
    });
    setShowConfirm(true);
  };

  // After user confirms, send OTP to sender and show OTP modal (using shared hook)
  const handleConfirm = async () => {
    setIsConfirming(true);
    setLocalOtpError('');
    try {
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', senderUserId)
        .single();
      if (!userData || userErr) {
        setError('No phone number found for sender.');
        setShowConfirm(false); // Close confirm modal on error
        return;
      }
      const senderPhone = userData.contact_number;
      if (!senderPhone) {
        setError('No phone number found for sender.');
        setShowConfirm(false); // Close confirm modal on error
        return;
      }
      const result = await otpSend([senderPhone]);
      if (result.ok) {
        setShowOtp(true);
        setShowConfirm(false); // Close confirm modal only after OTP is ready
      } else {
        setError(result.message || 'Failed to send OTP.');
        setShowConfirm(false); // Close confirm modal on error
      }
    } catch (err) {
      setError('Failed to connect to OTP server.');
      setShowConfirm(false); // Close confirm modal on error
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    // use shared hook resend
    setLocalOtpError('');
    try {
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', senderUserId)
        .single();
      if (!userData || userErr || !userData.contact_number) {
        setLocalOtpError('No phone number found for sender.');
        return;
      }
      const result = await otpResend([userData.contact_number]);
      if (!result.ok) {
        if (result.locked) setLocalOtpError('Too many attempts. Please wait.');
        else if (result.cooldown) setLocalOtpError('Please wait before resending.');
        else setLocalOtpError(result.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setLocalOtpError('Failed to connect to OTP server.');
    }
  };

  const handleOtpVerify = async (otp) => {
    setLocalOtpError('');
    const result = await otpVerify(otp);
    if (result.ok) {
      setShowOtp(false);
      setPendingTransfer(true);
      const tx = await processTransfer();
      setPendingTransfer(false);
      if (tx) {
        setSuccessTx(tx);
        setShowSuccess(true);
      }
      setPendingDetails(null);
      return;
    }
    if (result.locked) {
      setLocalOtpError(`Too many attempts. Please wait ${result.remaining || 60} seconds.`);
      return;
    }
    setLocalOtpError(result.message || 'Invalid OTP. Please try again.');
    return;
  };


  const processTransfer = async () => {
    setError('');
    setSuccess('');
    // Hide all modals except processing
    setShowConfirm(false);
    setLoading(true);
    // Fetch sender account
    const { data: senderAccount, error: senderErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', senderUserId)
      .single();
    if (!senderAccount || senderErr) {
      setError('Sender account not found.');
      setLoading(false);
      return;
    }
    // Fetch recipient account
    const { data: recipientAccount, error: recErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', accountNumber.replace(/\s/g, ''))
      .single();
    if (!recipientAccount || recErr) {
      setError('Recipient account not found.');
      setLoading(false);
      return;
    }
    const transferAmount = parseFloat(amount.replace(/,/g, ''));
    if (senderAccount.balance < transferAmount) {
      setError('Insufficient balance.');
      setLoading(false);
      return;
    }
    // Deduct from sender
    const { error: updateSenderErr } = await supabase
      .from('accounts')
      .update({ balance: senderAccount.balance - transferAmount })
      .eq('id', senderAccount.id);
    if (updateSenderErr) {
      setError('Failed to update sender balance.');
      setLoading(false);
      return;
    }
    // Add to recipient
    const { error: updateRecErr } = await supabase
      .from('accounts')
      .update({ balance: recipientAccount.balance + transferAmount })
      .eq('id', recipientAccount.id);
    if (updateRecErr) {
      setError('Failed to update recipient balance.');
      setLoading(false);
      return false;
    }
    // Get type_id for 'fund transfer'
    // Always use type_id = 1 for fund transfer
    let typeId = 1;
    // Insert transaction for sender and get the inserted record
    const { data: senderTx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        account_id: senderAccount.id,
        amount: -transferAmount,
        description: remarks,
        date: new Date().toISOString(),
  transaction_status: 'Successfully Completed',
        recipient_account_number: accountNumber.replace(/\s/g, ''),
        type: 'fund transfer',
        type_id: typeId,
        remaining_balance: senderAccount.balance - transferAmount,
      })
      .select()
      .single();
    if (txErr) {
      setError('Failed to record transaction.');
      setLoading(false);
      return false;
    }
    // Insert transaction for recipient
    await supabase
      .from('transactions')
      .insert({
        account_id: recipientAccount.id,
        amount: transferAmount,
        description: remarks,
        date: new Date().toISOString(),
  transaction_status: 'Successfully Completed',
        recipient_account_number: senderAccount.account_number,
        type: 'fund transfer',
        type_id: typeId,
        remaining_balance: recipientAccount.balance + transferAmount,
      });
    setSuccess('Transfer successful!');
    setLoading(false);
    setAccountNumber('');
    setRemarks('');
    setAmount('');
  // attach masked recipient initials to the returned tx so the success modal can display it
  const resultTx = { ...senderTx, recipient_initials: pendingDetails?.maskedName || '' };
  return resultTx;
  };

  // compute amount validity and insufficiency for disabling submit and showing messages
  // use same defensive parser for UI checks
  const parseAmountForUi = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).replace(/,/g, '').trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const amtVal = parseAmountForUi(amount || '0');
  const amountValid = amount && !isNaN(amtVal) && amtVal > 0;
  const insufficient = senderBalance !== null && amountValid && amtVal > senderBalance;

  return (
  <>
      {/* Unregistered Account Modal */}
      {showUnregisteredModal && (
        <UnregisteredAccountModal
          isOpen={showUnregisteredModal}
          accountNumber={unregisteredDetails?.accountNumber}
          onClose={() => setShowUnregisteredModal(false)}
        />
      )}
    <>
      {/* Main Fund Transfer Modal (hidden during processing/success) */}
      <Modal isOpen={isOpen && !pendingTransfer && !showSuccess && !showUnregisteredModal && !showUnverifiedModal && !showConfirm && !showOtp && !loading} onClose={onClose}>
        <div style={{
          padding: '2.5vw 2.5vw 2vw 2.5vw',
          minWidth: 380,
          maxWidth: 420,
          width: '100%',
          borderRadius: '1.5vw',
          background: '#fff',
          boxShadow: '0 8px 40px rgba(10,60,255,0.10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: '2.2vw',
            color: '#1856c9',
            marginBottom: '2vw',
            alignSelf: 'flex-start',
            fontFamily: 'inherit',
          }}>Fund Transfer</div>
          <form style={{ width: '100%' }} onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red', marginBottom: '1vw', fontWeight: 500 }}>{error}</div>}
              {/* Only show success message if not in success modal */}
              {success && !showSuccess && <div style={{ color: 'green', marginBottom: '1vw', fontWeight: 500 }}>{success}</div>}
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Account Number</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="00000000"
                value={accountNumber}
                maxLength={8}
                onChange={e => {
                  // Allow only digits (strip letters and symbols) and limit to 8 characters
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setAccountNumber(digits);
                  if (accountError) setAccountError('');
                }}
                onKeyDown={(e) => {
                  // allow control keys: backspace, tab, arrows, delete
                  const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Enter'];
                  if (allowed.includes(e.key)) return;
                  // Prevent any non-digit key
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                  // Prevent entering more than 8 digits via key presses
                  if (/^[0-9]$/.test(e.key) && accountNumber.length >= 8) {
                    e.preventDefault();
                  }
                }}
                disabled={loading}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
              {accountError && <div style={{ color: '#e53935', marginTop: '0.5vw', fontSize: '0.9vw' }}>{accountError}</div>}
            </div>

            <div style={{ marginBottom: '2vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Amount</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]{0,2}"
                placeholder="0.00"
                value={amount}
                onChange={e => {
                  // allow only digits and one decimal point, limit to 2 decimal places
                  let v = e.target.value.replace(/[^0-9.]/g, '');
                  const firstDot = v.indexOf('.');
                  if (firstDot !== -1) {
                    // remove other dots
                    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
                    // limit decimals to 2
                    const parts = v.split('.');
                    parts[1] = (parts[1] || '').slice(0, 2);
                    v = parts[0] + (parts[1] !== '' ? '.' + parts[1] : '');
                  }
                  setAmount(v);
                  if (amountError) setAmountError('');
                }}
                disabled={loading}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
              {/* realtime insufficient balance warning */}
              {amountError && <div style={{ color: '#e53935', marginTop: '0.5vw', fontSize: '0.9vw' }}>{amountError}</div>}
              {senderBalance !== null && amount && (() => {
                const amt = parseFloat(amount);
                if (!isNaN(amt) && amt > senderBalance) {
                  return <div style={{ color: '#e53935', marginTop: '0.5vw', fontSize: '0.9vw' }}>Insufficient balance — Current: ₱{senderBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
                }
                return null;
              })()}
            </div>
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Remarks</label>
              <input
                type="text"
                placeholder="Enter remarks (optional)"
                value={remarks}
                onChange={e => { setRemarks(e.target.value); }}
                disabled={loading}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
              
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1vw' }}>
              <button type="button" onClick={() => { resetFields(); onClose(); }} disabled={loading} style={{
                background: '#e0e0e0',
                color: '#222',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 3vw',
                fontWeight: 600,
                fontSize: '1.1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}>Cancel</button>
              <button type="submit" disabled={loading || pendingTransfer} style={{
                background: '#1856c9',
                color: '#fff',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 3vw',
                fontWeight: 600,
                fontSize: '1.1vw',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(24,86,201,0.10)',
              }}>{loading ? 'Processing...' : 'Confirm'}</button>
            </div>
          </form>
        </div>
      </Modal>
      {/* Confirmation Modal */}
      {showConfirm && (
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        details={pendingDetails}
        title="Confirm Transfer"
        confirmText="Confirm"
        loading={isConfirming}
      />
      )}
      {/* Unverified Account Modal */}
      {showUnverifiedModal && !pendingTransfer && !showSuccess && !showConfirm && !showOtp && (
        <Modal isOpen={showUnverifiedModal} onClose={() => setShowUnverifiedModal(false)}>
          <div style={{
            padding: '2vw 2vw 1vw 2vw',
            minWidth: 320,
            maxWidth: 400,
            width: '100%',
            borderRadius: '1vw',
            background: '#fff',
            boxShadow: '0 8px 40px rgba(10,60,255,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: '1.5vw',
              color: '#e53935',
              marginBottom: '1vw',
              alignSelf: 'flex-start',
              fontFamily: 'inherit',
            }}>Account Not Verified</div>
            <div style={{ width: '100%', marginBottom: '1.5vw', color: '#222', fontSize: '1vw' }}>
              <div><b>Account Number:</b> {unverifiedDetails?.accountNumber}</div>
              {unverifiedDetails?.maskedName && <div><b>Name:</b> {unverifiedDetails.maskedName}</div>}
              <div style={{ marginTop: '1vw' }}>
                This recipient account is not marked as verified. Sending funds to unverified accounts may be risky. Do you want to continue?
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button type="button" onClick={() => { setShowUnverifiedModal(false); setUnverifiedDetails(null); }} style={{
                background: '#e0e0e0',
                color: '#222',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 2vw',
                fontWeight: 600,
                fontSize: '1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>Cancel</button>
              <button type="button" onClick={() => {
                // continue anyway: set pending details and show confirm
                setShowUnverifiedModal(false);
                setPendingDetails({
                  accountNumber: unverifiedDetails.accountNumber,
                  maskedName: unverifiedDetails.maskedName || '',
                  amount: unverifiedDetails.amount,
                  remarks: unverifiedDetails.remarks,
                });
                setShowConfirm(true);
              }} style={{
                background: '#1856c9',
                color: '#fff',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 2vw',
                fontWeight: 600,
                fontSize: '1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(24,86,201,0.10)'
              }}>Continue Anyway</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Show loading spinner before OTP modal if loading */}
      {loading && !pendingTransfer && !showSuccess && (
        <ProcessingModal isOpen={true} />
      )}
      {showOtp && (
        <OtpModal
          isOpen={showOtp && !pendingTransfer && !showSuccess && !showConfirm && !showUnverifiedModal && !loading}
          onClose={() => setShowOtp(false)}
          onVerify={handleOtpVerify}
          onResend={handleResend}
          resendDisabled={resendDisabled || (lockRemaining && lockRemaining > 0)}
          timer={resendTimer}
          error={localOtpError}
          verifyDisabled={(lockRemaining && lockRemaining > 0)}
          lockRemaining={lockRemaining}
        />
      )}
      
      <ProcessingModal isOpen={pendingTransfer} />
  <SuccessModal isOpen={showSuccess} transaction={successTx} onClose={() => {
      setShowSuccess(false);
      setSuccess(''); // Clear success message when closing success modal
      onClose();
      if (onTransferSuccess) onTransferSuccess();
    }} />
    </>
    </>
  );
};


export default FundTransferModal;
