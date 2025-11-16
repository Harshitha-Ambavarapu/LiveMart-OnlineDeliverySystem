// backend/controllers/authController.js
const User = require('../models/User');
const { generateOTP, otpExpiresInMinutes } = require('../utils/otp');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

let transporter;
if (process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  transporter.verify((err) => {
    if (err) console.warn('SMTP verify failed:', err.message || err);
    else console.log('SMTP transporter ready');
  });
}

function minutesFromEnv() {
  const m = Number(process.env.OTP_EXPIRY_MIN);
  return Number.isFinite(m) && m > 0 ? m : 5;
}

async function requestOtp(req, res) {
  try {
    let { email, role, name, location } = req.body;
    if (email) email = String(email).toLowerCase().trim();

    if (!email) return res.status(400).json({ error: 'email required' });
    if (!role) return res.status(400).json({ error: 'role required' });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, role, name, location, provider: 'local' });
    } else {
      if (name) user.name = name;
      if (location) user.location = location;
      user.role = role;
    }

    const code = String(generateOTP(6));
    const expiresAt = otpExpiresInMinutes(process.env.OTP_EXPIRY_MIN || minutesFromEnv());

    user.otp = { code, expiresAt, verified: false };
    await user.save();

    console.log(`DEBUG OTP for ${user.email} : ${code}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `LiveMart <${process.env.SMTP_USER || 'no-reply@livemart.local'}>`,
      to: email,
      subject: 'Your LiveMart OTP Code',
      text: `Hello ${user.name || ''},\n\nYour OTP for LiveMart registration is ${code}.\nIt will expire in ${minutesFromEnv()} minutes.\n\nThanks,\nTeam LiveMart`
    };

    if (transporter) {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
      } catch (mailErr) {
        console.warn('Error sending OTP email (will not block):', mailErr.message || mailErr);
      }
    } else {
      console.log('[requestOtp] SMTP not configured; skipped email send.');
    }

    const resp = { ok: true, message: 'OTP generated and stored', userId: user._id };
    if (process.env.DEBUG_OTP === 'true') resp.otp = code;
    return res.json(resp);
  } catch (err) {
    console.error('requestOtp error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}

async function verifyOtp(req, res) {
  try {
    let { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'missing fields' });

    email = String(email).toLowerCase().trim();
    code = String(code).trim();

    const user = await User.findOne({ email });
    if (!user || !user.otp) return res.status(400).json({ error: 'no OTP requested' });

    console.log('verifyOtp debug - stored:', user.otp, 'received:', code);

    if (user.otp.verified) return res.status(400).json({ error: 'already verified' });

    if (user.otp.expiresAt && new Date(user.otp.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'otp expired' });
    }

    if (String(user.otp.code).trim() !== code) {
      return res.status(400).json({ error: 'invalid code' });
    }

    user.otp.verified = true;
    user.verified = true;
    await user.save();

    // optionally create JWT
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    return res.json({ ok: true, message: 'verified', userId: user._id, token });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}

// debug helper - returns user by email or phone (temporary)
async function debugGetUser(req, res) {
  try {
    const { email, phone } = req.query;
    if (!email && !phone) return res.status(400).json({ error: 'Provide email or phone query param' });
    const query = email ? { email: String(email).toLowerCase().trim() } : { phone: String(phone).trim() };
    const user = await User.findOne(query).lean();
    return res.json({ user });
  } catch (err) {
    console.error('[debugGetUser] error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

module.exports = { requestOtp, verifyOtp, debugGetUser };
