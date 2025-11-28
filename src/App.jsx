import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage/LandingPage';
import OtpLogin from './Pages/OtpLogin/OtpLogin';
import Dashboard from './Pages/Dashboard/Dashboard';
import Profile from './Pages/Profile/Profile';
import Maps from './Pages/Maps/Maps';
import Transactions from './Pages/Transactions/Transactions';
import Admin from './Pages/Admin/Admin';
import SetupAccount from './Pages/SetupAccount/SetupAccount';
import CheckBalance from './Pages/CheckBalance/CheckBalance';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<OtpLogin />} />
        <Route path="/check-balance" element={<CheckBalance />} />
        <Route path="/setup-account" element={<SetupAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
