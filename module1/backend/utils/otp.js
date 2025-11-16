// backend/utils/otp.js
// Minimal OTP helpers used by authController.js
// - generateOTP(length) -> returns numeric string (e.g. "123456")
// - otpExpiresInMinutes(minutes) -> returns Date object minutes from now

function generateOTP(length = 6) {
  length = Number(length) || 6;
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

function otpExpiresInMinutes(minutes = 5) {
  const m = Number(minutes) && minutes > 0 ? Number(minutes) : 5;
  const d = new Date();
  d.setMinutes(d.getMinutes() + m);
  return d;
}

module.exports = {
  generateOTP,
  otpExpiresInMinutes
};
