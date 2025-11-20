// frontend/src/components/OTPModal.js
import React from 'react';

export default function OTPModal({ open, onClose, onVerify, otpId, userId }) {
  const [otp, setOtp] = React.useState('');

  React.useEffect(()=> {
    if (!open) setOtp('');
  }, [open]);

  if (!open) return null;

  const backdropStyle = {
    position: 'fixed', inset: 0, background: 'rgba(10,15,20,0.55)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex: 9999
  };

  const modalStyle = {
    width: '420px', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
    background: '#fff'
  };

  const headerStyle = {
    padding: '18px 20px', background: 'linear-gradient(90deg,#00C2A8,#007BFF)', color:'#fff', fontWeight:700, textAlign:'center'
  };

  const handleVerify = () => {
    const trimmed = String(otp || '').trim();
    if (!trimmed) return;
    console.log('[OTPModal] verifying', { otp: trimmed, otpId, userId });
    onVerify({ otp: trimmed, otpId, userId });
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>Enter OTP</div>
        <div style={{padding:20}}>
          <p style={{marginTop:0,color:'#444'}}>A 6-digit OTP was sent to the email you provided. Enter it below.</p>
          <input
            autoFocus
            value={otp}
            onChange={e=>setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            style={{width:'100%', padding:'12px 14px', fontSize:16, borderRadius:8, border:'1px solid #ddd'}}
          />
          <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:14}}>
            <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={!String(otp || '').trim()}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
