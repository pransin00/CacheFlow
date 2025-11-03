import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import logo from './assets/CacheFlow_Logo.png';
import logoutIcon from './assets/logout.png';
import CardlessWithdrawalModal from './CardlessWithdrawalModal.jsx';
import { locations } from './locations';

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
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

const Maps = () => {
  const navigate = useNavigate();

  const [selectedAtm, setSelectedAtm] = useState(null);

  // locations imported from src/locations.js

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
          <SidebarItem 
            icon={<span style={{fontSize:'1.5vw'}}>&#9776;</span>} 
            label="Overview" 
            onClick={() => navigate('/dashboard')}
          />
          <SidebarItem 
            icon={<span style={{fontSize:'1.5vw'}}>&#8596;</span>} 
            label="Transactions" 
            onClick={() => navigate('/transactions')}
          />
          <SidebarItem 
            icon={<span style={{fontSize:'1.5vw'}}>&#128205;</span>} 
            label="Maps" 
            active 
            onClick={() => navigate('/maps')}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: '100%', marginBottom: '2vw' }}>
          <SidebarItem 
            icon={<img src={logoutIcon} alt="Logout" style={{width:'1.5vw',height:'1.5vw',objectFit:'contain'}} />} 
            label={<span style={{color:'#e53935',fontWeight:700}}>Logout</span>}
            onClick={() => {
              localStorage.removeItem('user_id');
              window.location.href = '/login';
            }}
          />
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer 
          center={[14.0702, 120.6290]} // Nasugbu coordinates
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
                html: `<div style="
                  background: ${location.type === 'Branch' ? '#0a3cff' : '#4CAF50'};
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 16px;
                  border: 2px solid white;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                ">
                  ${location.type === 'Branch' ? '🏦' : '🏧'}
                  ${location.hasCardless ? '<span style="position: absolute; top: -5px; right: -5px; background: #FFD700; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></span>' : ''}
                </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })}
            >
              <Popup>
                <div style={{ padding: '15px', minWidth: '250px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#0a3cff' }}>{location.name}</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#666' }}>{location.address}</p>
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: location.type === 'ATM' ? '#e3f0ff' : '#e6edfa',
                      color: location.type === 'ATM' ? '#1976d2' : '#1856c9',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginRight: '5px'
                    }}>
                      {location.type}
                    </span>
                    {location.hasCardless && (
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginRight: '5px'
                      }}>
                        Cardless Withdrawal ✨
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e8f5e9',
                    color: '#43a047',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {location.status}
                  </div>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    <strong>Hours:</strong> {location.hours}
                  </p>
                  {location.hasCardless && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAtm(location);
                      }}
                      style={{
                        background: '#0a3cff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginTop: '12px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}
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

      {/* Cardless Withdrawal Modal */}
      {selectedAtm && (
        <CardlessWithdrawalModal
          atmName={selectedAtm.name}
          onClose={() => setSelectedAtm(null)}
          onGenerate={() => {
            // Here you would typically handle the withdrawal code generation
            // and potentially store it in your backend
          }}
        />
      )}
    </div>
  );
};

export default Maps;