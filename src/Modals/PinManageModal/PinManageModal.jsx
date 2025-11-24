import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const PinField = ({ value, onChange, label, error, showPin, toggleShowPin }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
      {label}:
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={showPin ? "text" : "password"}
        maxLength="4"
        value={value}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          if (val.length <= 4) onChange(val);
        }}
        style={{
          width: '100%',
          padding: '0.8rem',
          paddingRight: '3rem',
          borderRadius: '8px',
          border: `1px solid ${error ? '#ff4444' : '#ddd'}`,
          fontSize: '1rem',
          boxSizing: 'border-box',
          textAlign: 'center',
          letterSpacing: '0.5rem',
        }}
      />
      <button
        type="button"
        onClick={toggleShowPin}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
        }}
        aria-label="Toggle PIN visibility"
      >
        {showPin ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
    {error && (
      <div style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
        {error}
      </div>
    )}
  </div>
);

const PinManageModal = ({ onClose, currentPin, onSuccess }) => {
  const [mode, setMode] = useState('verify'); // verify, change
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const handleVerify = async () => {
    if (oldPin !== currentPin) {
      setError('Incorrect PIN');
      return;
    }
    setMode('change');
    setError('');
  };

  const handleChange = async () => {
    if (newPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      const user_id = localStorage.getItem('user_id');
      const { error: updateError } = await supabase
        .from('users')
        .update({ pin: newPin })
        .eq('id', user_id);

      if (updateError) throw updateError;

      onSuccess(newPin);
      onClose();
    } catch (err) {
      setError('Failed to update PIN. Please try again.');
    }
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
        width: '88%',
        maxWidth: '620px',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#0a3cff' }}>
          {mode === 'verify' ? 'Verify Current PIN' : 'Change PIN'}
        </h2>

        {mode === 'verify' ? (
          <PinField
            label="Current PIN"
            value={oldPin}
            onChange={setOldPin}
            error={error}
            showPin={showOldPin}
            toggleShowPin={() => setShowOldPin(!showOldPin)}
          />
        ) : (
          <>
            <PinField
              label="New PIN"
              value={newPin}
              onChange={setNewPin}
              error={error && error.includes('4 digits') ? error : ''}
              showPin={showNewPin}
              toggleShowPin={() => setShowNewPin(!showNewPin)}
            />
            <PinField
              label="Confirm New PIN"
              value={confirmPin}
              onChange={setConfirmPin}
              error={error && error.includes('match') ? error : ''}
              showPin={showConfirmPin}
              toggleShowPin={() => setShowConfirmPin(!showConfirmPin)}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.8rem 1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={mode === 'verify' ? handleVerify : handleChange}
            style={{
              padding: '0.8rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: '#0a3cff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {mode === 'verify' ? 'Verify' : 'Change PIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinManageModal;
