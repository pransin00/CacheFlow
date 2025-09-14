import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import logo from './assets/CacheFlow_Logo.png';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
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
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  }}>
    <span style={{ fontSize: '1.3vw' }}>{icon}</span>
    {label}
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;
      const { data } = await supabase
        .from('users')
        .select('firstname, middlename, lastname, username, contact_number')
        .eq('id', user_id)
        .single();
      setUser(data);
    };
    fetchUser();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#fafdff',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    }}>
      {/* Sidebar */}
      <div style={{
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
      }}>
        <img src={logo} alt="CacheFlow Logo" style={{ width: '10vw', margin: '0 0 2vw 2vw', alignSelf: 'flex-start' }} />
        <div style={{ width: '100%', marginTop: '2vw' }}>
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#9776;</span>} label="Overview" active={false} onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#8596;</span>} label="Transactions" />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: '100%', marginBottom: '2vw' }}>
          <SidebarItem icon={<span style={{fontSize:'1.5vw'}}>&#8592;</span>} label={<span style={{color:'#e53935',fontWeight:700}}>Logout</span>} />
        </div>
      </div>
      {/* Main Profile Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2vw' }}>
        <div style={{ fontWeight: 700, fontSize: '2vw', color: '#222', marginBottom: '2vw', marginTop: '1vw', textAlign: 'center' }}>Profile</div>
        <div style={{
          background: '#fff',
          borderRadius: '1.2vw',
          boxShadow: '0 8px 40px rgba(10,60,255,0.10)',
          padding: '3vw 3vw 2vw 3vw',
          minWidth: 350,
          maxWidth: 420,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Profile Picture */}
          <div style={{ position: 'relative', marginBottom: '1vw' }}>
            <span style={{
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
            }}>
              {user?.firstname?.[0] || ''}{user?.lastname?.[0] || ''}
            </span>
            {/* Edit icon overlay */}
            <span style={{
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
            }} title="Edit profile picture">
              <svg width="16" height="16" fill="none" stroke="#1856c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
            </span>
          </div>
          {/* Username (centered, blue) */}
          <div style={{ color: '#1856c9', fontWeight: 500, fontSize: '1.2vw', marginBottom: '1vw', textAlign: 'center' }}>
            {user ? user.username : 'username'}
          </div>
          {/* User details */}
          <div style={{ width: '100%', marginBottom: '2vw' }}>
            <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 2 }}>First Name</div>
            <div style={{ fontWeight: 600, fontSize: '1.1vw', marginBottom: 8 }}>{user?.firstname || ''}</div>
            <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 2 }}>Middle Name</div>
            <div style={{ fontWeight: 600, fontSize: '1.1vw', marginBottom: 8 }}>{user?.middlename || ''}</div>
            <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 2 }}>Last Name</div>
            <div style={{ fontWeight: 600, fontSize: '1.1vw', marginBottom: 8 }}>{user?.lastname || ''}</div>
            <div style={{ color: '#1856c9', fontSize: '0.9vw', fontWeight: 500, marginBottom: 2, marginTop: 12 }}>Phone Number</div>
            <div style={{ fontWeight: 700, fontSize: '1.1vw', marginBottom: 8 }}>{user?.contact_number || ''}</div>
            <hr style={{ border: 'none', borderTop: '1.5px solid #e6edfa', margin: '1vw 0' }} />
          </div>
          <button style={{
            background: '#1856c9',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5vw',
            padding: '1vw 2vw',
            fontWeight: 600,
            fontSize: '1.1vw',
            cursor: 'pointer',
            marginTop: '1vw',
            width: '100%',
            maxWidth: 260,
            boxShadow: '0 2px 8px rgba(24,86,201,0.10)',
          }}>Reset Password</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
