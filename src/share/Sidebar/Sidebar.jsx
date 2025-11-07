import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/CacheFlow_Logo.png';
import logoutIcon from '../../assets/logout.png';
import './Sidebar.css';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    className={`sidebar-item ${active ? 'active' : ''}`}
  >
    <span className="sidebar-icon">{icon}</span>
    {label}
  </div>
);

const Sidebar = ({ activePage }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    window.location.href = '/login';
  };

  return (
    <>
      <div className="sidebar-root">
        <img src={logo} alt="CacheFlow Logo" className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}} />
        <div className="sidebar-items">
          <SidebarItem 
            icon={<span className="menu-icon">&#9776;</span>} 
            label="Overview" 
            active={activePage === 'dashboard'} 
            onClick={() => navigate('/dashboard')} 
          />
          <SidebarItem 
            icon={<span className="menu-icon">&#8596;</span>} 
            label="Transactions" 
            active={activePage === 'transactions'} 
            onClick={() => navigate('/transactions')} 
          />
          <SidebarItem 
            icon={<span className="menu-icon">&#128205;</span>} 
            label="Maps" 
            active={activePage === 'maps'} 
            onClick={() => navigate('/maps')} 
          />
        </div>
        <div className="sidebar-bottom">
          <div onClick={() => setShowLogoutModal(true)}>
            <SidebarItem 
              icon={<img src={logoutIcon} alt="Logout" className="icon-img" />} 
              label={<span className="logout-label">Logout</span>} 
            />
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal">
            <div className="logout-title">Are you sure you want to log out?</div>
            <div className="logout-actions">
              <button onClick={handleLogout} className="btn-logout">Log out</button>
              <button onClick={() => setShowLogoutModal(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
