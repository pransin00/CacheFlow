import React, { useState } from 'react';
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

  // Show confirmation modal before OTP/processing
  const handleTransfer = async () => {
    setError('');
    if (!bank || !accountNumber || !accountName || !amount || !receiverNumber) {
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
    try {
      // Get sender's phone/contact_number from users table
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', senderUserId)
        .single();
      if (!userData || userErr) {
        setError('No phone number found for sender.');
        return;
      }
      const senderPhone = userData.contact_number;
      if (!senderPhone) {
        setError('No phone number found for sender.');
        return;
      }
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: [senderPhone] })
      });
      const result = await response.json();
      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setShowOtp(true);
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err) {
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
        description: `${typeName} to ${bank} - ${accountNumber} (${accountName}), receiver: ${receiverNumber}, fee: ₱15`,
        transaction_status: 'Success',
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
    // Call onConfirm to update dashboard (refresh)
    if (onConfirm) onConfirm({ refresh: true });
    // Reset fields after success
    setBank('');
    setAccountNumber('');
    setAccountName('');
    setAmount('');
    setReceiverNumber('');
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
  const [receiverNumber, setReceiverNumber] = useState('');

  return (
    <>
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
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Bank</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1vw 2.5vw 1vw 1vw', // extra right padding for icon
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
                {/* Custom dropdown arrow */}
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
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Account Number</label>
              <input
                type="text"
                placeholder={bank ? `Enter ${accountNumberLength}-digit account number` : 'Select a bank first'}
                value={accountNumber}
                maxLength={accountNumberLength}
                onChange={e => {
                  // Only allow numbers
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
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Account Name</label>
              <input
                type="text"
                placeholder="Enter account name"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1.3vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Amount</label>
              <input
                type="text"
                placeholder="100,000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '2vw' }}>
              <label style={{ fontWeight: 500, fontSize: '1vw', color: '#222', marginBottom: '0.5vw', display: 'block', fontFamily: 'inherit' }}>Receiver's Number</label>
              <input
                type="text"
                placeholder="100,000"
                value={receiverNumber}
                onChange={e => setReceiverNumber(e.target.value)}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1vw' }}>
              <button type="button" onClick={onClose} style={{
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
                style={{
                background: '#1856c9',
                color: '#fff',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 3vw',
                fontWeight: 600,
                fontSize: '1.1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(24,86,201,0.10)'
              }}>Confirm</button>
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
          receiverNumber,
        }}
      />
      {/* OTP Modal */}
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
