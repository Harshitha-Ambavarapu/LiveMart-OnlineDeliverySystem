// frontend/src/pages/SocialLoginSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64 decode (URL-safe)
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

export default function SocialLoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || '';
    const m = hash.match(/token=([^&]+)/);
    if (!m) {
      // no token -> go to login
      navigate('/login');
      return;
    }
    const token = decodeURIComponent(m[1]);
    // store token (frontend uses this to call protected APIs)
    localStorage.setItem('token', token);

    // decode payload to decide redirect
    const payload = decodeJwtPayload(token);
    const role = payload && payload.role ? String(payload.role).toLowerCase() : 'customer';

    // ROUTES: update as per your frontend routes
    if (role === 'retailer') {
      navigate('/retailer-dashboard');
    } else if (role === 'wholesaler') {
      navigate('/wholesaler-dashboard');
    } else {
      navigate('/customer'); // customer landing page route
    }
  }, [navigate]);

  return (
    <div style={{ padding: 20 }}>
      <p>Signing you in…</p>
    </div>
  );
}
