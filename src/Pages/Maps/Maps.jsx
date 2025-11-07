import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import logo from '../../assets/CacheFlow_Logo.png';
import logoutIcon from '../../assets/logout.png';
import Sidebar from '../../share/Sidebar/Sidebar';
import CardlessWithdrawalModal from '../../Modals/CardlessWithdrawalModal/CardlessWithdrawalModal.jsx';
import { locations } from '../../utils/locations';
import './Maps.css';

// use shared Sidebar for navigation

const Maps = () => {
  const navigate = useNavigate();
  const [selectedAtm, setSelectedAtm] = useState(null);

  return (
    <div className="maps-root">
      <Sidebar activePage="maps" />

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
