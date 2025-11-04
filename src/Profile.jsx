import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import logo from './assets/CacheFlow_Logo.png';
import PinManageModal from './PinManageModal';
import ResetPassword from './ResetPassword';

const SidebarItem = ({ icon, label, active, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onClick) onClick();
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1vw',
        padding: '0.8vw 2vw',
        fontWeight: active ? 700 : 500,
        fontSize: '1.1vw',
        color: active ? '#0a3cff' : '#888',
        background: active ? '#e6edfa' : 'none',
        borderRadius: '0.7vw',
        marginBottom: '0.7vw',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'background-color 0.2s, color 0.2s',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: '1.3vw' }}>{icon}</span>
      {label}
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;
      try {
        const { data } = await supabase
          .from('users')
          .select('firstname, middlename, lastname, username, contact_number, pin')
          .eq('id', user_id)
          .single();
        setUser(data || null);
      } catch (err) {
        console.error('fetch user error', err);
      }
    };
    fetchUser();
  }, []);

  const handlePinSuccess = (newPin) => {
    setUser((prev) => ({ ...(prev || {}), pin: newPin }));
  };

  const openPinModal = () => setShowPinModal(true);
  const closePinModal = () => setShowPinModal(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#fafdff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '16vw',
          minWidth: 180,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(10,60,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '2vw 0 2vw 0',
          gap: '1vw',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <img
          src={logo}
          alt="CacheFlow Logo"
          style={{ width: '10vw', margin: '0 0 2vw 2vw', alignSelf: 'flex-start' }}
        />
        <div style={{ width: '100%', marginTop: '2vw' }}>
          <SidebarItem
            icon={<span style={{ fontSize: '1.5vw' }}>&#9776;</span>}
            label="Overview"
            active={false}
            onClick={() => navigate('/dashboard')}
          />
          <SidebarItem
            icon={<span style={{ fontSize: '1.5vw' }}>&#8596;</span>}
            label="Transactions"
            onClick={() => navigate('/transactions')}
          />
          <SidebarItem
            icon={<span style={{ fontSize: '1.5vw' }}>&#128205;</span>}
            label="Maps"
            onClick={() => navigate('/maps')}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: '100%', marginBottom: '2vw' }}>
          <SidebarItem
            icon={<span style={{ fontSize: '1.5vw' }}>&#8592;</span>}
            label={<span style={{ color: '#e53935', fontWeight: 700 }}>Logout</span>}
          />
        </div>
      </div>

      {/* Main Profile Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '2vw' }}>
        <div style={{ height: '1.2rem' }} />

        <div
          style={{
            background: '#fff',
            borderRadius: '1.2vw',
            boxShadow: '0 8px 40px rgba(10,60,255,0.10)',
            padding: '2.5vw 3vw',
            minWidth: 520,
            maxWidth: 760,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            position: 'sticky',
            top: '2.5vw',
            /* center the card horizontally */
            alignSelf: 'center',
            margin: '0 auto',
            zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1.6vw', color: '#222', marginBottom: '1.2vw', textAlign: 'left' }}>Profile</div>

          <div style={{ position: 'relative', marginBottom: '1vw' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: '#1856c9',
                color: '#fff',
                fontWeight: 700,
                fontSize: 44,
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(24,86,201,0.15)',
                userSelect: 'none',
                border: '3px solid #fff',
              }}
            >
              {user?.firstname?.[0] || ''}{user?.lastname?.[0] || ''}
            </span>

            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#fff',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                cursor: 'pointer',
                border: '1.5px solid #e6edfa',
              }}
              title="Edit profile picture"
            >
              <svg width="16" height="16" fill="none" stroke="#1856c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
            </span>
          </div>

          <div style={{ color: '#1856c9', fontWeight: 500, fontSize: '1.2vw', marginBottom: '1vw', textAlign: 'center' }}>
            {user ? user.username : 'username'}
          </div>

          <div style={{ width: '100%', marginBottom: '1.4vw', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', alignItems: 'start' }}>
            <div>
              <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 6 }}>First Name</div>
              <div style={{ fontWeight: 600, fontSize: '1.05vw' }}>{user?.firstname || ''}</div>
            </div>

            <div>
              <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 6 }}>Last Name</div>
              <div style={{ fontWeight: 600, fontSize: '1.05vw' }}>{user?.lastname || ''}</div>
            </div>

            <div>
              <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 6 }}>Middle Name</div>
              <div style={{ fontWeight: 600, fontSize: '1.05vw' }}>{user?.middlename || ''}</div>
            </div>

            <div>
              <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 6 }}>Phone Number</div>
              <div style={{ fontWeight: 700, fontSize: '1.05vw' }}>{user?.contact_number || ''}</div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1.5px solid #e6edfa', margin: '0.6rem 0 1rem 0' }} />

          <div style={{ marginTop: '1vw' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5vw'
            }}>
              <div>
                <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: '0.5vw' }}>PIN Code</div>
                <div style={{ fontWeight: 600, fontSize: '1.1vw', letterSpacing: '0.2em' }}>{user?.pin ? '••••' : 'Not set'}</div>
              </div>

              <button
                onClick={openPinModal}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #1856c9',
                  color: '#1856c9',
                  borderRadius: '0.5vw',
                  padding: '0.5vw 1vw',
                  fontWeight: 600,
                  fontSize: '0.9vw',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5vw'
                }}
              >
                <span style={{ fontSize: '1.2vw' }}>🔒</span>
                {user?.pin ? 'Change PIN' : 'Set PIN'}
              </button>
            </div>

            <div style={{ color: '#666', fontSize: '0.8vw', marginTop: '0.5vw' }}>Your PIN is used for cardless withdrawals and secure transactions</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1.5px solid #e6edfa', margin: '1vw 0' }} />

          <div style={{ display: 'flex', gap: '1vw', width: '100%', maxWidth: 260 }}>
            <button onClick={() => setShowResetModal(true)} style={{
              background: '#1856c9',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5vw',
              padding: '1vw 2vw',
              fontWeight: 600,
              fontSize: '1.1vw',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 8px rgba(24,86,201,0.10)',
            }}>Reset Password</button>
          </div>
        </div>
      </div>

      {/* PIN Management Modal */}
      {showPinModal && (
        <PinManageModal
          currentPin={user?.pin}
          onClose={closePinModal}
          onSuccess={handlePinSuccess}
        />
      )}
      {showResetModal && (
        <ResetPassword
          onClose={() => setShowResetModal(false)}
          onSuccess={(newPass) => { /* optionally show toast */ }}
        />
      )}
    </div>
  );
};

export default Profile;
