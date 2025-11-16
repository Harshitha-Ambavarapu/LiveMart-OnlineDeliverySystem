// frontend/src/components/SocialButtons.js
import React from 'react';

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600
};

export default function SocialButtons() {
  const backend = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const openPopup = (path) => {
    const width = 600, height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    window.open(`${backend}/api/auth/${path}`, '_blank', `toolbar=no, location=no, status=no, menubar=no, width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  return (
    <div style={{display:'flex', gap:12}}>
      <button
        style={{ ...btnStyle, background: 'linear-gradient(90deg,#4285F4,#34A853)', color:'#fff' }}
        className="social-btn"
        onClick={() => openPopup('google')}
      >
        <span style={{fontSize:18}}></span> Sign in with Google
      </button>

      <button
        style={{ ...btnStyle, background: 'linear-gradient(90deg,#3b5998,#8b9dc3)', color:'#fff' }}
        onClick={() => openPopup('facebook')}
      >
        <span style={{fontSize:18}}></span> Sign in with Facebook
      </button>
    </div>
  );
}
