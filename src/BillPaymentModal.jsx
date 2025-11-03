import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import OtpModal from './OtpModal';
import { supabase } from './supabaseClient';

const BillPaymentModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [biller, setBiller] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingDetails, setPendingDetails] = useState(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);
  const [senderAccount, setSenderAccount] = useState(null);
  const [senderBalance, setSenderBalance] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!biller || !amount || !reference) return;
    // prevent submitting when insufficient funds
    const payAmount = parseFloat(amount);
    if (senderBalance != null && !isNaN(payAmount) && payAmount > senderBalance) {
      setError('Insufficient balance');
      return;
    }
    setPendingDetails({
      biller,
      reference,
      amount: parseFloat(amount),
    });
    setShowConfirm(true);
  };

  const resetFields = () => {
    setBiller('');
    setReference('');
    setAmount('');
    setError('');
    setSuccess('');
    setShowConfirm(false);
    setShowOtp(false);
    setSentOtp('');
    setOtpError('');
    setPendingDetails(null);
    setShowProcessing(false);
    setShowReceipt(false);
    setReceiptTx(null);
  };

  useEffect(() => {
    // fetch sender account and balance when modal opens
    const fetchAccount = async () => {
      try {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) return;
        const { data: accountData, error: accountErr } = await supabase
          .from('accounts')
          .select('id, balance, account_number')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (accountErr) return;
        setSenderAccount(accountData || null);
        setSenderBalance(accountData?.balance ?? null);
      } catch (err) {
        // ignore fetch errors for now
      }
    };
    if (isOpen) fetchAccount();
    else {
      // reset balance when modal closes
      setSenderAccount(null);
      setSenderBalance(null);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setShowConfirm(false);
    setOtpError('');
    setShowProcessing(true);
    try {
      // Get sender's phone/contact_number from users table
      const user_id = localStorage.getItem('user_id');
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', user_id)
        .single();
      if (!userData || userErr) {
        setError('No phone number found for sender.');
        setShowProcessing(false);
        return;
      }
      const senderPhone = userData.contact_number;
      if (!senderPhone) {
        setError('No phone number found for sender.');
        setShowProcessing(false);
        return;
      }
      // Send OTP via backend API
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: [senderPhone] })
      });
      const result = await response.json();
      setShowProcessing(false);
      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setShowOtp(true);
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err) {
      setShowProcessing(false);
      setError('Failed to connect to OTP server.');
    }
  };

  const handleOtpVerify = async (otp) => {
    setOtpError('');
    if (!sentOtp) {
      setOtpError('No OTP was sent.');
      return;
    }
    if (otp !== sentOtp) {
      setOtpError('Invalid OTP. Please try again.');
      return;
    }
    setShowOtp(false);
    setShowProcessing(true);
    try {
      // Get logged-in user's account id
      const user_id = localStorage.getItem('user_id');
      let accountId = null;
      let senderAccount = null;
      if (user_id) {
        const { data: accountData } = await supabase
          .from('accounts')
          .select('id, balance, account_number')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        accountId = accountData?.id;
        senderAccount = accountData;
      }
      if (!accountId || !senderAccount) throw new Error('Account not found');
      const payAmount = parseFloat(amount);
      if (senderAccount.balance < payAmount) throw new Error('Insufficient balance');
      // Deduct from sender
      const { error: updateSenderErr } = await supabase
        .from('accounts')
        .update({ balance: senderAccount.balance - payAmount })
        .eq('id', accountId);
      if (updateSenderErr) throw updateSenderErr;
      // Insert transaction for sender
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          amount: -payAmount,
          description: `Bill Payment: ${reference}`,
          date: new Date().toISOString(),
          transaction_status: 'Successfully Completed',
          recipient_account_number: reference,
          type: 'bill payment',
          type_id: 3,
          remaining_balance: senderAccount.balance - payAmount,
          bank: biller,
        })
        .select()
        .single();
      if (txError) throw txError;
      setReceiptTx(transaction);
      setShowReceipt(true);
      setSuccess('Bill payment successful!');
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setShowProcessing(false);
      setSubmitting(false);
    }
  };

  // compute amount validity and insufficiency for disabling submit and showing messages
  const amtVal = parseFloat(amount || '0');
  const amountValid = amount && !isNaN(amtVal) && amtVal > 0;
  const insufficient = senderBalance !== null && amountValid && amtVal > senderBalance;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div style={{
          background: '#fff',
          borderRadius: '28px',
          padding: '3.5rem 2.5rem 2.5rem 2.5rem',
          minWidth: 400,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 8px 48px rgba(10,60,255,0.13)',
          margin: '0 auto',
        }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1751C5', fontFamily: 'inherit', lineHeight: 1.1 }}>Payment/Pay Bills</div>
          </div>
          {error && <div style={{ color: '#e53935', marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ color: '#43a047', marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.7rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.05rem', color: '#222' }}>Choose Biller</label>
              <select
                value={biller}
                onChange={e => setBiller(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1.1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #D1D5DB',
                  fontSize: '1.1rem',
                  background: '#F9FAFB',
                  color: biller ? '#222' : '#888',
                  marginBottom: 0,
                  boxSizing: 'border-box',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 8L10 13L15 8' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'calc(100% - 1.2rem) center',
                  backgroundSize: '22px 22px',
                }}
              >
                <option value="">Select Biller</option>
                <option value="Meralco">Meralco</option>
                <option value="PLDT">PLDT</option>
                <option value="Maynilad">Maynilad</option>
                <option value="Globe Telecom">Globe Telecom</option>
                <option value="Smart Communications">Smart Communications</option>
              </select>
            </div>
            <div style={{ marginBottom: '1.7rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.05rem', color: '#222' }}>Account Number/Reference Number</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="00000000"
                value={reference}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setReference(digits);
                }}
                onKeyDown={(e) => {
                  const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Enter'];
                  if (allowed.includes(e.key)) return;
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
                style={{ width: '100%', padding: '1.1rem', borderRadius: '12px', border: '1.5px solid #D1D5DB', fontSize: '1.1rem', background: '#F9FAFB', color: '#222', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '2.7rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.05rem', color: '#222' }}>Amount</label>
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
                    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
                    const parts = v.split('.');
                    parts[1] = (parts[1] || '').slice(0, 2);
                    v = parts[0] + (parts[1] !== '' ? '.' + parts[1] : '');
                  }
                  setAmount(v);
                }}
                onKeyDown={(e) => {
                  const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Enter'];
                  if (allowed.includes(e.key)) return;
                  if (e.key === '.') {
                    // allow dot only if not already present
                    if (amount.includes('.')) e.preventDefault();
                    return;
                  }
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
                style={{ width: '100%', padding: '1.1rem', borderRadius: '12px', border: '1.5px solid #D1D5DB', fontSize: '1.1rem', background: '#F9FAFB', color: '#222', boxSizing: 'border-box', outline: 'none' }}
              />
              {/* realtime insufficient balance warning (match FundTransfer style) */}
              {senderBalance != null && amount && (() => {
                const amt = parseFloat(amount);
                if (!isNaN(amt) && amt > senderBalance) {
                  return <div style={{ color: '#e53935', marginTop: 8, fontWeight: 500 }}>Insufficient balance — Current: ₱{senderBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
                }
                return null;
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginTop: '2.2rem' }}>
              <button type="button" onClick={() => { resetFields(); onClose(); }} style={{ background: '#E5E7EB', color: '#222', border: 'none', borderRadius: '12px', padding: '1.1rem 2.8rem', fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>Cancel</button>
              <button
                type="submit"
                disabled={loading || submitting || !amountValid || insufficient}
                style={{ background: '#1751C5', color: '#fff', border: 'none', borderRadius: '12px', padding: '1.1rem 2.8rem', fontWeight: 700, fontSize: '1.2rem', cursor: loading || submitting ? 'not-allowed' : 'pointer', opacity: loading || submitting ? 0.7 : 1, fontFamily: 'inherit', transition: 'background 0.2s' }}
              >
                {submitting ? 'Processing...' : 'Confirm'}
              </button>
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
          details={{
            bank: biller,
            accountNumber: reference,
            amount,
            remarks: `Bill Payment to ${biller}`,
          }}
        />
      )}
      {/* OTP Modal */}
      {showOtp && (
        <OtpModal
          isOpen={showOtp}
          onClose={() => setShowOtp(false)}
          onVerify={handleOtpVerify}
          error={otpError}
        />
      )}
      {/* Processing Modal */}
      {showProcessing && (
        <Modal isOpen={showProcessing}>
          <div style={{ padding: '2vw', minWidth: 320, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.5vw', color: '#1856c9', marginBottom: '1vw' }}>Processing Payment...</div>
            <div style={{ margin: '2vw 0' }}>
              <span className="loader" style={{ display: 'inline-block', width: 40, height: 40, border: '4px solid #1856c9', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            </div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
          </div>
        </Modal>
      )}
      {/* Receipt Modal */}
      {showReceipt && (
        <Modal isOpen={showReceipt} onClose={() => {
          setShowReceipt(false);
          setReceiptTx(null);
          if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
          }
        }}>
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
            <button onClick={() => {
              setShowReceipt(false);
              setReceiptTx(null);
              if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
              }
            }} aria-label="Close" style={{
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
            <div style={{ fontWeight: 700, fontSize: '2vw', color: '#43a047', marginBottom: '1vw', textAlign: 'center' }}>Payment Successful!</div>
            <div style={{ marginBottom: '1vw', color: '#222', fontWeight: 500, textAlign: 'center' }}>
              <div><b>Biller:</b> {receiptTx?.bank}</div>
              <div><b>Reference:</b> {receiptTx?.recipient_account_number}</div>
              <div><b>Amount:</b> ₱{Math.abs(receiptTx?.amount)?.toLocaleString()}</div>
              <div><b>Date:</b> {receiptTx?.date ? new Date(receiptTx.date).toLocaleString() : ''}</div>
              {receiptTx?.description && <div><b>Remarks:</b> {receiptTx.description}</div>}
              <div><b>Status:</b> {receiptTx?.transaction_status}</div>
              <div><b>Transaction #:</b> {receiptTx?.id}</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default BillPaymentModal;
