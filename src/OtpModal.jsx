import React, { useState } from 'react';
import Modal from './Modal';

const OtpModal = ({ isOpen, onClose, onVerify, error, onResend, resendDisabled, timer }) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!otp || otp.length < 4) {
      setLocalError('Please enter a valid OTP.');
      return;
    }
    onVerify(otp);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
          color: '#1856c9',
          marginBottom: '1vw',
          alignSelf: 'flex-start',
          fontFamily: 'inherit',
        }}>Enter OTP</div>
        <form style={{ width: '100%' }} onSubmit={handleSubmit}>
          {(localError || error) && <div style={{ color: 'red', marginBottom: '1vw', fontWeight: 500 }}>{localError || error}</div>}
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={{ width: '100%', padding: '1vw', border: '1.5px solid #d6d6d6', borderRadius: '0.7vw', fontSize: '1.1vw', marginBottom: '1.5vw', outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#222', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.3vw' }}
            maxLength={6}
          />
          {typeof timer === 'number' && <div style={{ color: '#666', marginBottom: '1vw' }}>0:{String(timer).padStart(2, '0')} remaining</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} style={{
                background: '#e0e0e0',
                color: '#222',
                border: 'none',
                borderRadius: '0.7vw',
                padding: '1vw 2vw',
                fontWeight: 600,
                fontSize: '1vw',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}>Cancel</button>
              <button type="button" onClick={onResend} disabled={resendDisabled} style={{
                background: resendDisabled ? '#f3f4f6' : '#fff',
                color: '#222',
                border: '1px solid #d6d6d6',
                borderRadius: '0.7vw',
                padding: '1vw 2vw',
                fontWeight: 600,
                fontSize: '1vw',
                cursor: resendDisabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}>{resendDisabled ? 'Resend' : 'Resend'}</button>
            </div>
            <button type="submit" style={{
              background: '#1856c9',
              color: '#fff',
              border: 'none',
              borderRadius: '0.7vw',
              padding: '1vw 2vw',
              fontWeight: 600,
              fontSize: '1vw',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 6px rgba(24,86,201,0.10)',
            }}>Verify</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default OtpModal;
