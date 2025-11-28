import React from 'react';
import Modal from '../Modal/Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, details }) => {
  // Format name with first letter and asterisks for privacy (like receipt)
  const formatRecipientName = (name) => {
    if (!name) return '';
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === 0) return '';
    
    // Format each word with first letter and asterisks
    return words.map(word => 
      word.charAt(0).toUpperCase() + '*'.repeat(word.length - 1)
    ).join(' ');
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
      }}>Confirm Transfer</div>
      <div style={{ width: '100%', marginBottom: '1.5vw', color: '#222', fontSize: '1vw' }}>
        {details?.bank && <div><b>Bank:</b> {details.bank}</div>}
        <div><b>Account Number:</b> {details?.accountNumber || 'N/A'}</div>
        {details?.accountName && (
          <div><b>Recipient:</b> {formatRecipientName(details.accountName)}</div>
        )}
        <div><b>Amount:</b> {details?.amount || 'N/A'}</div>
        {details?.receiverNumber && <div><b>Receiver's Number:</b> {details.receiverNumber}</div>}
        {details?.remarks && <div><b>Remarks:</b> {details.remarks}</div>}
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
        <button type="button" onClick={onConfirm} style={{
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
        }}>Confirm</button>
      </div>
    </div>
  </Modal>
  );
};

export default ConfirmModal;
