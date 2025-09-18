import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import OtpLogin from './OtpLogin';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Maps from './Maps';
import Transactions from './Transactions';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<OtpLogin />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/transactions" element={<Transactions />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/maps" element={<Maps />} />
      </Routes>
    </Router>
  );
}

export default App;
