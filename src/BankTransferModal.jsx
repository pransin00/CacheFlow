import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from './supabaseClient';
import ConfirmModal from './ConfirmModal';
import OtpModal from './OtpModal';

const ProcessingModal = ({ isOpen }) => (
  <Modal isOpen={isOpen}>
    <div style={{ padding: '2vw', minWidth: 320, textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: '1.5vw', color: '#1856c9', marginBottom: '1vw' }}>Processing Transfer...</div>
      <div style={{ margin: '2vw 0' }}>
        <span className="loader" style={{ display: 'inline-block', width: 40, height: 40, border: '4px solid #1856c9', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
    </div>
  </Modal>
);

const SuccessModal = ({ isOpen, details, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div style={{
      padding: '2.5vw 2.5vw 2vw 2.5vw',
      minWidth: 520,
      maxWidth: 720,
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
      <div style={{ fontWeight: 700, fontSize: '2vw', color: '#43a047', marginBottom: '1vw', textAlign: 'center' }}>Bank Transfer Successful!</div>
      <div style={{ marginBottom: '1vw', color: '#222', fontWeight: 500, textAlign: 'center' }}>
        <div><b>Bank:</b> {details?.bank}</div>
        <div><b>Account Number:</b> {details?.accountNumber}</div>
        <div><b>Account Name:</b> {details?.accountName}</div>
        <div><b>Amount:</b> ₱{Number(details?.amount)?.toLocaleString()}</div>
        <div><b>Fee:</b> ₱15.00</div>
        <div><b>Date:</b> {details?.date ? new Date(details.date).toLocaleString() : ''}</div>
        <div><b>Reference #:</b> {details?.reference}</div>
      </div>
    </div>
  </Modal>
);

const BankTransferModal = ({ isOpen, onClose, onConfirm }) => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false); // loading before OTP
  // Get sender info from localStorage
  const senderUserId = localStorage.getItem('user_id');

  // Helper: fetch sender account
  const fetchSenderAccount = async () => {
    if (!senderUserId) return null;
    const { data, error } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('user_id', senderUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  };

  const [senderBalance, setSenderBalance] = useState(null);

  useEffect(() => {
    // fetch sender balance when modal opens
    const fetchBalance = async () => {
      if (!isOpen) return;
      const acc = await fetchSenderAccount();
      if (acc && acc.balance !== undefined) setSenderBalance(acc.balance);
      else setSenderBalance(null);
    };
    fetchBalance();
    if (!isOpen) setSenderBalance(null);
  }, [isOpen]);

  // Show confirmation modal before OTP/processing
  const handleTransfer = async () => {
    setError('');
    if (!bank || !accountNumber || !accountName || !amount) {
      setError('Please fill in all fields.');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (accountNumber.length !== accountNumberLength) {
      setError(`Account number must be exactly ${accountNumberLength} digits.`);
      return;
    }
    setShowConfirm(true);
  };

  // After confirm, send OTP
  const handleConfirm = async () => {
    setShowConfirm(false);
    setOtpError('');
    setOtpLoading(true); // show loading spinner before OTP
    try {
      // Get sender's phone/contact_number from users table
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', senderUserId)
        .single();
      if (!userData || userErr) {
        setOtpLoading(false);
        setError('No phone number found for sender.');
        return;
      }
      const senderPhone = userData.contact_number;
      if (!senderPhone) {
        setOtpLoading(false);
        setError('No phone number found for sender.');
        return;
      }
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: [senderPhone] })
      });
      const result = await response.json();
      setOtpLoading(false); // hide loading spinner
      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setShowOtp(true);
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err) {
      setOtpLoading(false);
      setError('Failed to connect to OTP server.');
    }
  };

  // After OTP is entered, validate and process transfer
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
  setProcessing(true);
    // --- original transfer logic below ---
    // Fetch sender account
    const senderAccount = await fetchSenderAccount();
    if (!senderAccount) {
      setProcessing(false);
      setError('Unable to fetch your account.');
      return;
    }
    const totalDeduct = Number(amount) + 15;
    if (senderAccount.balance < totalDeduct) {
      setProcessing(false);
      setError('Insufficient balance for this transfer (including ₱15 fee).');
      return;
    }
    // Get transaction type name for type_id 2
    let typeName = 'Bank Transfer';
    const { data: typeData, error: typeErr } = await supabase
      .from('transaction_types')
      .select('name')
      .eq('id', 2)
      .single();
    if (typeData && typeData.name) typeName = typeData.name;
    // Deduct from sender
    const { error: updateErr } = await supabase
      .from('accounts')
      .update({ balance: senderAccount.balance - totalDeduct })
      .eq('id', senderAccount.id);
    if (updateErr) {
      setProcessing(false);
      setError('Failed to deduct from your account.');
      return;
    }
    // Insert transaction record
    const newBalance = senderAccount.balance - totalDeduct;
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert([{
        account_id: senderAccount.id,
        amount: -totalDeduct,
        type_id: 2, // 2 = Bank Transfer
        type: typeName, // Save the type name
        date: new Date().toISOString(),
        description: `${typeName} to ${bank} - ${accountNumber} (${accountName}), fee: ₱15`,
  transaction_status: 'Successfully Completed',
        bank: bank,
        recipient_account_number: accountNumber,
        remaining_balance: newBalance, // Save the new balance
      }])
      .select()
      .single();
    if (txErr) {
      setProcessing(false);
      setError('Failed to record transaction.');
      return;
    }
    setProcessing(false);
    setSuccess(true);
    setSuccessDetails({
      bank,
      accountNumber,
      accountName,
      amount,
      date: tx.date,
      reference: tx.id,
    });
    // Auto-refresh dashboard after success
    setTimeout(() => {
      if (onConfirm) onConfirm({ refresh: true });
    }, 1200);
    // Reset fields after success
  setBank('');
  setAccountNumber('');
  setAccountName('');
  setAmount('');
  };
  const [bank, setBank] = useState('');
  const bankOptions = [
    '',
    'BDO Unibank',
    'BPI',
    'Metrobank',
    'Land Bank',
    'Security Bank',
    'PNB',
    'China Bank',
    'UnionBank',
    'RCBC',
    'EastWest Bank',
    'UCPB',
    'Other',
  ];
  const [accountNumber, setAccountNumber] = useState('');

  // Map of bank to account number length
  const bankAccountLengths = {
    'BDO Unibank': 10,
    'BPI': 10,
    'Metrobank': 13,
    'Land Bank': 10,
    'Security Bank': 13,
    'PNB': 12,
    'China Bank': 12,
    'UnionBank': 12,
    'RCBC': 10,
    'EastWest Bank': 12,
    'UCPB': 12,
  };

  // Get the required length for the selected bank
  const accountNumberLength = bankAccountLengths[bank] || 20;
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  // receiverNumber removed per request

  // compute amount validity and insufficiency (include ₱15 fee)
  const amtVal = parseFloat(amount || '0');
  const amountValid = amount && !isNaN(amtVal) && amtVal > 0;
  const insufficient = senderBalance !== null && amountValid && (amtVal + 15) > senderBalance;

  const resetFields = () => {
    setBank('');
    setAccountNumber('');
    setAccountName('');
    setAmount('');
    setError('');
    setSuccess(false);
    setSuccessDetails(null);
    setShowConfirm(false);
    setShowOtp(false);
    setSentOtp('');
    setOtpError('');
    setSenderBalance(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div style={{
          padding: '2.5vw 2.5vw 2vw 2.5vw',
          minWidth: 520,
          maxWidth: 720,
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
            fontSize: '2vw',
            color: '#1856c9',
            marginBottom: '2vw',
            alignSelf: 'flex-start',
            fontFamily: 'inherit',
          }}>Bank Transfer</div>
          {error && <div style={{ color: '#e53935', fontSize: '1vw', marginBottom: '1vw', textAlign: 'center' }}>{error}</div>}
    <form style={{ width: '100%' }} onSubmit={e => { e.preventDefault(); handleTransfer(); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.3vw', width: '100%' }}>
        {/* Bank (left) */}
        <div>
          <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Bank</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={bank}
              onChange={e => setBank(e.target.value)}
              style={{
                width: '100%',
                padding: '1vw 2.5vw 1vw 1vw',
                border: '1.5px solid #d6d6d6',
                borderRadius: '0.7vw',
                fontSize: '1.1vw',
                marginTop: '0.3vw',
                outline: 'none',
                fontFamily: 'inherit',
                background: '#fff',
                color: '#222',
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              {bankOptions.map((option, idx) => (
                <option key={idx} value={option} disabled={option === ''} hidden={option === ''}>
                  {option === '' ? 'Select a bank' : option}
                </option>
              ))}
            </select>
            <span style={{
              pointerEvents: 'none',
              position: 'absolute',
              right: '1.2vw',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.3vw',
              color: '#888',
              zIndex: 2,
            }}>
              ▼
            </span>
          </div>
        </div>

        {/* Account Name (right) */}
        <div>
          <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Account Name</label>
          <input
            type="text"
            placeholder="Enter account name"
            value={accountName}
            onChange={e => {
              const v = e.target.value.replace(/[^a-zA-Z\s]/g, '');
              setAccountName(v);
            }}
            style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
          />
        </div>

        {/* Account Number (left) */}
        <div>
          <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Account Number</label>
          <input
            type="text"
            placeholder={bank ? `Enter ${accountNumberLength}-digit account number` : 'Select a bank first'}
            value={accountNumber}
            maxLength={accountNumberLength}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              setAccountNumber(val.slice(0, accountNumberLength));
            }}
            style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
            disabled={!bank}
          />
          {bank && accountNumber && accountNumber.length !== accountNumberLength && (
            <div style={{ color: '#e53935', fontSize: '0.9vw', marginTop: '0.3vw' }}>
              Account number must be exactly {accountNumberLength} digits.
            </div>
          )}
        </div>

        {/* Amount (right) */}
        <div>
          <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Amount</label>
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
            style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
          />
          {senderBalance !== null && amount && (() => {
            const amt = parseFloat(amount);
            if (!isNaN(amt) && (amt + 15) > senderBalance) {
              return <div style={{ color: '#e53935', marginTop: '0.35vw', fontSize: '0.8vw', fontWeight: 500 }}>Insufficient balance for this transfer (including ₱15 fee) — Current: ₱{senderBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
            }
            return null;
          })()}
        </div>
      </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1vw' }}>
              <button type="button" onClick={() => { resetFields(); onClose(); }} style={{
                background: '#e0e0e0',
                color: '#222',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 3vw',
                fontWeight: 600,
                fontSize: '1.1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>Cancel</button>
              <button
                type="submit"
                disabled={processing || otpLoading || !amountValid || insufficient || !accountName || accountNumber.length !== accountNumberLength || !bank}
                style={{
                background: '#1856c9',
                color: '#fff',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 3vw',
                fontWeight: 600,
                fontSize: '1.1vw',
                cursor: processing || otpLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(24,86,201,0.10)',
                opacity: processing || otpLoading || !amountValid || insufficient ? 0.7 : 1,
              }}>
                Confirm
              </button>
            </div>
          </form>
        </div>
      </Modal>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        details={{
          bank,
          accountNumber,
          accountName,
          amount,
        }}
      />
      {/* OTP Modal */}
      {/* Show processing spinner before OTP modal */}
      {otpLoading && (
        <ProcessingModal isOpen={true} />
      )}
      <OtpModal
        isOpen={showOtp}
        onClose={() => setShowOtp(false)}
        onVerify={handleOtpVerify}
        error={otpError}
      />
      {/* Processing Modal */}
      <ProcessingModal isOpen={processing} />
      {/* Success Modal */}
      <SuccessModal isOpen={success} details={successDetails} onClose={() => { setSuccess(false); setSuccessDetails(null); onClose(); }} />
    </>
  );
};

export default BankTransferModal;
