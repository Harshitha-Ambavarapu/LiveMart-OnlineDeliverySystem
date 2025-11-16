import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import API from './services/api';

function SocialLoginSuccess() {
  const [token, setToken] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [role, setRole] = React.useState('Customer');
  const [status, setStatus] = React.useState('Processing...');

  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/token=([^&]+)/);
    if (match) {
      const tok = decodeURIComponent(match[1]);
      setToken(tok);
      localStorage.setItem('token', tok);
      try {
        const payload = JSON.parse(atob(tok.split('.')[1]));
        setUserId(payload.id || payload._id);
        if (payload.role && ['Customer','Retailer','Consumer'].includes(payload.role)) {
          setStatus('Logged in successfully.');
          setTimeout(()=> window.location.href='/', 1000);
          return;
        }
        setStatus('Please choose your role');
      } catch (e) {
        console.error('JWT decode error', e);
        setStatus('Could not decode token — please re-login.');
      }
    } else {
      setStatus('No token found in URL.');
    }
  }, []);

  const submitRole = async () => {
    if (!userId) return setStatus('User id not found.');
    try {
      const res = await API.post('/auth/set-role', { userId, role });
      localStorage.setItem('token', res.data.token); // updated token
      setStatus('Role saved. Redirecting...');
      setTimeout(()=> window.location.href='/', 800);
    } catch (err) {
      console.error(err);
      setStatus(err?.response?.data?.msg || 'Error saving role');
    }
  };

  return (
    <div style={{padding:20}}>
      <h3>{status}</h3>
      {status === 'Please choose your role' && (
        <div>
          <label>Select role</label>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            <option>Customer</option>
            <option>Retailer</option>
            <option>Consumer</option>
          </select>
          <div style={{marginTop:12}}>
            <button onClick={submitRole}>Save role</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/social-login-success" element={<SocialLoginSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

