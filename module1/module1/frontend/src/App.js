// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import CustomerPage from './pages/CustomerPage';
import RetailerDashboard from './pages/RetailerDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import API from './services/api';

function SocialLoginSuccess() {
  React.useEffect(() => {
    // If the OAuth provider returned token in URL hash as token=..., pick it up.
    const hash = window.location.hash || '';
    const match = hash.match(/token=([^&]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      localStorage.setItem('token', token);
    }

    // call backend to get user info (token must be attached by API interceptors)
    API.get('/api/auth/me')
      .then(res => {
        if (res.data && res.data.user) {
          const user = res.data.user;
          // normalize role and save
          user.role = (user.role || '').toString().toLowerCase();
          localStorage.setItem('user', JSON.stringify(user));
          // redirect based on role
          if (user.role === 'retailer') return window.location.replace('/retailer');
          if (user.role === 'wholesaler') return window.location.replace('/wholesaler');
        }
        // default -> customer
        window.location.replace('/customer');
      })
      .catch(err => {
        console.warn('social login /me failed', err);
        window.location.replace('/customer');
      });
  }, []);

  return <div style={{ padding: 20 }}>Logging you in...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/social-login-success" element={<SocialLoginSuccess />} />
        <Route path="/customer" element={<CustomerPage />} />
        <Route path="/retailer" element={<RetailerDashboard />} />
        <Route path="/wholesaler" element={<WholesalerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
