
import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import { supabase } from '../../utils/supabaseClient';
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
    if (!isOpen) setSuccess('');
  }, [isOpen]);
  const [accountNumber, setAccountNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [senderBalance, setSenderBalance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [pendingDetails, setPendingDetails] = useState(null);
  const [recipientInitials, setRecipientInitials] = useState('');
  const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
  const [unregisteredDetails, setUnregisteredDetails] = useState(null);

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
    setError('');
    setSuccess('');
    setShowConfirm(false);
    setShowOtp(false);
    setSentOtp('');
    setOtpError('');
    setPendingDetails(null);
    setShowUnregisteredModal(false);
    setUnregisteredDetails(null);
  };

  const handleTransfer = async () => {
    setError('');
    if (!accountNumber || !amount || isNaN(Number(amount.replace(/,/g, '')))) {
      setError('Please enter a valid account number and amount.');
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
    // Check if recipient account exists and get masked name
    const { data: recipientData, error: recipientErr } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('account_number', accountNumber.replace(/\s/g, ''))
      .single();

    let maskedName = '';
    let recipientExists = !!recipientData && !recipientErr;
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

    const transferAmount = parseFloat(amount.replace(/,/g, ''));
    if (senderAccount.balance < transferAmount) {
      setError('Insufficient balance.');
      return;
    }

    if (!recipientExists) {
      setUnregisteredDetails({
        accountNumber: accountNumber.replace(/\s/g, ''),
        amount: transferAmount,
        remarks,
      });
      setShowUnregisteredModal(true);
      return;
    }

    setPendingDetails({
      accountNumber: accountNumber.replace(/\s/g, ''),
      maskedName,
      amount: transferAmount,
      remarks,
    });
    setShowConfirm(true);
  };

  // After user confirms, process transfer directly (OTP DISABLED)
  const handleConfirm = async () => {
    setShowConfirm(false);
    setPendingTransfer(true);
    const tx = await processTransfer();
    setPendingTransfer(false);
    if (tx) {
      setSuccessTx(tx);
      setShowSuccess(true);
    }
    setPendingDetails(null);
  };

  /*
  // After user confirms, send OTP to the sender's phone (logged-in user) and show OTP modal
  const handleConfirm = async () => {
  setShowConfirm(false);
  setOtpError('');
  setLoading(true); // Start loading before OTP request
  try {
      // Get sender's account using logged-in user_id
      const { data: senderAccount, error: senderErr } = await supabase
        .from('accounts')
        .select('user_id')
        .eq('user_id', senderUserId)
        .single();
      console.log('DEBUG: senderUserId:', senderUserId, 'senderAccount:', senderAccount, 'error:', senderErr);
      if (!senderAccount || senderErr) {
        setError('Sender account not found.');
        return;
      }
      // Get sender's phone/contact_number from users table
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('contact_number')
        .eq('id', senderUserId)
        .single();
      console.log('DEBUG: userData:', userData, 'userErr:', userErr);
      if (!userData || userErr) {
        setError('No phone number found for sender.');
        return;
      }
      const senderPhone = userData.contact_number;
      console.log('DEBUG: senderPhone:', senderPhone);
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
      setLoading(false); // Stop loading after response
      if (response.ok && result.otp) {
        setSentOtp(result.otp);
        setShowOtp(true);
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err) {
      setLoading(false); // Stop loading on error
      setError('Failed to connect to OTP server.');
    }
  };
  */

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
    setPendingTransfer(true);
    const tx = await processTransfer();
    setPendingTransfer(false);
    if (tx) {
      setSuccessTx(tx);
      setShowSuccess(true);
    }
    setPendingDetails(null);
  };

  const processTransfer = async () => {
    setError('');
    setSuccess('');
    // Hide all modals except processing
    setShowConfirm(false);
    setShowOtp(false);
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
  const amtVal = parseFloat(amount || '0');
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
          onContinue={() => {
            setShowUnregisteredModal(false);
            setPendingDetails({
              accountNumber: unregisteredDetails?.accountNumber,
              maskedName: '',
              amount: unregisteredDetails?.amount,
              remarks: unregisteredDetails?.remarks,
              unregistered: true
            });
            setShowConfirm(true);
          }}
        />
      )}
    <>
      {/* Main Fund Transfer Modal (hidden during processing/success) */}
      <Modal isOpen={isOpen && !pendingTransfer && !showSuccess} onClose={onClose}>
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
                }}
                disabled={loading}
                style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginTop: '0.3vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box' }}
              />
              {/* realtime insufficient balance warning */}
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
                onChange={e => setRemarks(e.target.value)}
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
              <button type="submit" disabled={loading || pendingTransfer || !amountValid || insufficient} style={{
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
      <ConfirmModal
        isOpen={showConfirm && !pendingTransfer && !showSuccess}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        details={{
          accountNumber: pendingDetails?.accountNumber,
          accountName: pendingDetails?.maskedName,
          amount: pendingDetails?.amount,
          remarks: pendingDetails?.remarks
        }}
      />
      {/* Show loading spinner before OTP modal if loading */}
      {loading && !showOtp && !pendingTransfer && !showSuccess && (
        <ProcessingModal isOpen={true} />
      )}
      <OtpModal
        isOpen={showOtp && !pendingTransfer && !showSuccess}
        onClose={() => setShowOtp(false)}
        onVerify={handleOtpVerify}
        error={otpError}
      />
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
