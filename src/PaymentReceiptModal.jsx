import React from 'react';
import Modal from './Modal';

const PaymentReceiptModal = ({ isOpen, transaction, onClose }) => (
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
      <div style={{ fontWeight: 700, fontSize: '2vw', color: '#43a047', marginBottom: '1vw', textAlign: 'center' }}>Payment Successful!</div>
      <div style={{ marginBottom: '1vw', color: '#222', fontWeight: 500, textAlign: 'center' }}>
        <div><b>Biller:</b> {transaction?.bank}</div>
        <div><b>Reference:</b> {transaction?.recipient_account_number}</div>
        <div><b>Amount:</b> ₱{Math.abs(transaction?.amount)?.toLocaleString()}</div>
        <div><b>Date:</b> {transaction?.date ? new Date(transaction.date).toLocaleString() : ''}</div>
        {transaction?.description && <div><b>Remarks:</b> {transaction.description}</div>}
        <div><b>Status:</b> {transaction?.transaction_status}</div>
        <div><b>Transaction #:</b> {transaction?.id}</div>
      </div>
    </div>
  </Modal>
);

export default PaymentReceiptModal;
