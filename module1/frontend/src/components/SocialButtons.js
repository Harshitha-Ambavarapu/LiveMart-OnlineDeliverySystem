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
   <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>

      {/* GOOGLE BUTTON */}
      <button
        className="social-btn google-btn"
        onClick={() => openPopup("google")}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png
"
          alt="google"
          style={{ width: 20, height: 20 }}
        />
        Continue with Google
      </button>

      {/* FACEBOOK BUTTON */}
      <button
        className="social-btn fb-btn"
        onClick={() => openPopup("facebook")}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
          alt="facebook"
          style={{ width: 20, height: 20 }}
        />
        Continue with Facebook
      </button>
    </div>
  );
}