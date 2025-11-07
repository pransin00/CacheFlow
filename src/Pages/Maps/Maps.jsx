import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import logo from '../../assets/CacheFlow_Logo.png';
import logoutIcon from '../../assets/logout.png';
import CardlessWithdrawalModal from '../../Modals/CardlessWithdrawalModal/CardlessWithdrawalModal.jsx';
import { locations } from '../../utils/locations';
import './Maps.css';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    className={`maps-sidebar-item ${active ? 'active' : ''}`}
  >
    <span className="maps-sidebar-icon">{icon}</span>
    {label}
  </div>
);

const Maps = () => {
  const navigate = useNavigate();
  const [selectedAtm, setSelectedAtm] = useState(null);

  return (
    <div className="maps-root">
      <div className="maps-sidebar">
        <img src={logo} alt="CacheFlow Logo" className="maps-logo" />
        <div className="maps-items">
          <SidebarItem icon={<span className="menu-icon">&#9776;</span>} label="Overview" onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<span className="menu-icon">&#8596;</span>} label="Transactions" onClick={() => navigate('/transactions')} />
          <SidebarItem icon={<span className="menu-icon">&#128205;</span>} label="Maps" active onClick={() => navigate('/maps')} />
        </div>
        <div style={{ flex: 1 }} />
        <div className="maps-logout">
          <SidebarItem 
            icon={<img src={logoutIcon} alt="Logout" className="icon-img" />} 
            label={<span className="logout-label">Logout</span>}
            onClick={() => { localStorage.removeItem('user_id'); window.location.href = '/login'; }}
          />
        </div>
      </div>

      <div className="maps-container">
        <MapContainer 
          center={[14.0702, 120.6290]}
          zoom={15}
          style={{ height: '100vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map(location => (
            <Marker 
              key={location.id} 
              position={location.position}
              icon={divIcon({
                className: '',
                html: `<div style="background: ${location.type === 'Branch' ? '#0a3cff' : '#4CAF50'}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${location.type === 'Branch' ? '🏦' : '🏧'}${location.hasCardless ? '<span style="position: absolute; top: -5px; right: -5px; background: #FFD700; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></span>' : ''}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })}
            >
              <Popup>
                <div className="popup">
                  <h3 className="popup-title">{location.name}</h3>
                  <p className="popup-address">{location.address}</p>
                  <div className="popup-tags">
                    <span className={`tag ${location.type === 'ATM' ? 'tag-atm' : 'tag-branch'}`}>{location.type}</span>
                    {location.hasCardless && <span className="tag tag-cardless">Cardless Withdrawal ✨</span>}
                  </div>
                  <div className="popup-status">{location.status}</div>
                  <p className="popup-hours"><strong>Hours:</strong> {location.hours}</p>
                  {location.hasCardless && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAtm(location); }}
                      className="btn-generate"
                    >
                      Generate Withdrawal Code
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {selectedAtm && (
        <CardlessWithdrawalModal
          atmName={selectedAtm.name}
          onClose={() => setSelectedAtm(null)}
          onGenerate={() => {}}
        />
      )}
    </div>
  );
};

export default Maps;
