import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import logo from '../../assets/CacheFlow_Logo.png';
import Sidebar from '../../share/Sidebar/Sidebar';
import PinManageModal from "../../Modals/PinManageModal/PinManageModal";
import ResetPassword from '../ResetPassword/ResetPassword';
import './Profile.css';

// navigation handled by shared Sidebar component

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
    <div className="profile-root">
      <Sidebar activePage="profile" />

      <div className="profile-main">
        <div style={{ height: '1.2rem' }} />

        <div className="profile-card">
          <div className="profile-title">Profile</div>

          <div className="avatar-row">
            <span className="avatar-circle">{user?.firstname?.[0] || ''}{user?.lastname?.[0] || ''}</span>
            <span className="avatar-edit" title="Edit profile picture">
              <svg width="16" height="16" fill="none" stroke="#1856c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
            </span>
          </div>

          <div className="username">{user ? user.username : 'username'}</div>

          <div className="profile-grid">
            <div>
              <div className="field-label">First Name</div>
              <div className="field-val">{user?.firstname || ''}</div>
            </div>
            <div>
              <div className="field-label">Last Name</div>
              <div className="field-val">{user?.lastname || ''}</div>
            </div>
            <div>
              <div className="field-label">Middle Name</div>
              <div className="field-val">{user?.middlename || ''}</div>
            </div>
            <div>
              <div className="field-label">Phone Number</div>
              <div className="field-val">{user?.contact_number || ''}</div>
            </div>
          </div>

          <hr className="divider" />

          <div className="pin-row">
            <div>
              <div className="field-label">PIN Code</div>
              <div className="field-val pin-val">{user?.pin ? '••••' : 'Not set'}</div>
            </div>

            <button className="btn-pin" onClick={openPinModal}>
              <span className="btn-icon">🔒</span>
              {user?.pin ? 'Change PIN' : 'Set PIN'}
            </button>
          </div>

          <div className="pin-note">Your PIN is used for cardless withdrawals and secure transactions</div>

          <hr className="divider" />

          <div className="reset-row">
            <button className="btn-reset" onClick={() => setShowResetModal(true)}>Reset Password</button>
          </div>
        </div>
      </div>

      {showPinModal && (
        <PinManageModal currentPin={user?.pin} onClose={closePinModal} onSuccess={handlePinSuccess} />
      )}

      {showResetModal && (
        <ResetPassword onClose={() => setShowResetModal(false)} onSuccess={() => {}} />
      )}
    </div>
  );
};

export default Profile;
