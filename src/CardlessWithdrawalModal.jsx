import React, { useState } from 'react';

const CardlessWithdrawalModal = ({ onClose, atmName, onGenerate }) => {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = () => {
    if (!amount || !pin) {
      setError('Please fill in all fields');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    const withdrawalCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(withdrawalCode);
    onGenerate?.();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
      }}>
        <h2 style={{ marginTop: 0 }}>Cardless Withdrawal - {atmName}</h2>
        
        {!generatedCode ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Amount (₱):
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginTop: '0.25rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                PIN:
                <input
                  type="password"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginTop: '0.25rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </label>
            </div>

            {error && (
              <div style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#0a3cff',
                  color: 'white'
                }}
              >
                Generate Code
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '2rem 0',
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '8px'
            }}>
              {generatedCode}
            </div>
            <p style={{ marginBottom: '2rem' }}>
              Your withdrawal code is valid for 10 minutes.<br />
              Please proceed to the ATM and follow the instructions.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                background: '#0a3cff',
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardlessWithdrawalModal;