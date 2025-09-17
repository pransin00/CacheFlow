import React from 'react';
import Modal from './Modal';

const UnregisteredAccountModal = ({ isOpen, onClose, onContinue, accountNumber }) => (
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
        color: '#e53935',
        marginBottom: '1vw',
        alignSelf: 'flex-start',
        fontFamily: 'inherit',
      }}>Account Not Registered</div>
      <div style={{ width: '100%', marginBottom: '1.5vw', color: '#222', fontSize: '1vw' }}>
        <div><b>Account Number:</b> {accountNumber}</div>
        <div style={{ marginTop: '1vw' }}>
          The account number is not registered. Would you still like to continue?
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
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
        <button type="button" onClick={onContinue} style={{
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
        }}>Continue Anyway</button>
      </div>
    </div>
  </Modal>
);

export default UnregisteredAccountModal;
