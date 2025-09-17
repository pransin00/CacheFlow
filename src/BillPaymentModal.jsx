
import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from './supabaseClient';


const staticBillers = [
  { id: 'static-1', name: 'Meralco' },
  { id: 'static-2', name: 'PLDT' },
  { id: 'static-3', name: 'Maynilad' },
  { id: 'static-4', name: 'Globe Telecom' },
  { id: 'static-5', name: 'Smart Communications' },
];

const BillPaymentModal = ({ isOpen, onClose, onSubmit, billers = [], loading }) => {
  const [billerId, setBillerId] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  // Merge static and dynamic billers, avoiding duplicates by name
  const mergedBillers = [...staticBillers, ...billers.filter(b => !staticBillers.some(s => s.name === b.name))];


  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!billerId || !amount || !reference) return;
    setSubmitting(true);
    try {
      // 1. Insert into bill_payments
      const { data: billPayment, error: billError } = await supabase
        .from('bill_payments')
        .insert({
            account_id: window.currentAccountId || 'demo-account', // Replace with actual account id
            biller_id: billerId,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            status: 'completed',
            reference_number: reference,
        });
      if (billError) throw billError;

      // 2. Insert into transactions
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
            account_id: window.currentAccountId || 'demo-account',
            amount: -Math.abs(parseFloat(amount)),
            description: `Bill Payment: ${reference}`,
            date: new Date().toISOString(),
            transaction_status: 'completed',
            type_id: 3, // Bill Payment type
            remaining_balance: null,
            bank: null,
        });
      if (txError) throw txError;

      // 3. Deduct from account balance (if you have a function for this)
      // const { error: acctError } = await supabase.rpc('deduct_balance', {
      //   account_id: window.currentAccountId || 'demo-account',
      //   amount: amount,
      // });
      // if (acctError) throw acctError;

      setSuccess('Bill payment successful!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            <select value={billerId} onChange={e => setBillerId(e.target.value)} required style={{
              width: '100%',
              padding: '1.1rem',
              borderRadius: '12px',
              border: '1.5px solid #D1D5DB',
              fontSize: '1.1rem',
              background: '#F9FAFB',
              color: billerId ? '#222' : '#888',
              marginBottom: 0,
              boxSizing: 'border-box',
              outline: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M5 8L10 13L15 8\' stroke=\'%239CA3AF\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'calc(100% - 1.2rem) center',
              backgroundSize: '22px 22px',
            }}>
              <option value="">Bank Name</option>
              {mergedBillers.map(biller => (
                <option key={biller.id} value={biller.id}>{biller.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1.7rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.05rem', color: '#222' }}>Account Number/Reference Number</label>
            <input type="text" placeholder="00 00 00 00 00" value={reference} onChange={e => setReference(e.target.value)} required style={{ width: '100%', padding: '1.1rem', borderRadius: '12px', border: '1.5px solid #D1D5DB', fontSize: '1.1rem', background: '#F9FAFB', color: '#222', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '2.7rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.05rem', color: '#222' }}>Amount</label>
            <input type="number" placeholder="100,000" min="1" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '1.1rem', borderRadius: '12px', border: '1.5px solid #D1D5DB', fontSize: '1.1rem', background: '#F9FAFB', color: '#222', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginTop: '2.2rem' }}>
            <button type="button" onClick={onClose} style={{ background: '#E5E7EB', color: '#222', border: 'none', borderRadius: '12px', padding: '1.1rem 2.8rem', fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>Cancel</button>
            <button type="submit" disabled={loading || submitting} style={{ background: '#1751C5', color: '#fff', border: 'none', borderRadius: '12px', padding: '1.1rem 2.8rem', fontWeight: 700, fontSize: '1.2rem', cursor: loading || submitting ? 'not-allowed' : 'pointer', opacity: loading || submitting ? 0.7 : 1, fontFamily: 'inherit', transition: 'background 0.2s' }}>{submitting ? 'Processing...' : 'Confirm'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BillPaymentModal;
