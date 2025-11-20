// backend/controllers/authController.js
const User = require('../models/User');
const { generateOTP, otpExpiresInMinutes } = require('../utils/otp');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// ---------------- SMTP SETUP ----------------
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

// ---------------- UTILS ----------------
function minutesFromEnv() {
  const m = Number(process.env.OTP_EXPIRY_MIN);
  return Number.isFinite(m) && m > 0 ? m : 5;
}

// ---------------- REQUEST OTP ----------------
async function requestOtp(req, res) {
  try {
    let { email, role, name, location } = req.body;

    if (!email) return res.status(400).json({ error: 'email required' });
    if (!role) return res.status(400).json({ error: 'role required' });

    const emailLower = String(email).toLowerCase().trim();
    const roleLower = String(role).toLowerCase().trim();

    // Try to find an existing user
    let user = await User.findOne({ email: emailLower }).exec();

    if (!user) {
      // Create NEW user if not exists
      user = new User({
        email: emailLower,
        role: roleLower,
        name,
        location,
        provider: 'local'
      });
    } else {
      // update optional fields if provided
      user.name = name || user.name;
      user.location = location || user.location;
      // keep existing provider/role unless you want to allow overwrites
    }

    // Generate and store a fresh OTP
    const code = String(generateOTP(6));
    const expiresAt = otpExpiresInMinutes(process.env.OTP_EXPIRY_MIN || minutesFromEnv());

    user.otp = { code, expiresAt, verified: false };
    await user.save();

    console.log(`DEBUG OTP for ${user.email}: ${code}`);

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_FROM || `LiveMart <${process.env.SMTP_USER || 'no-reply@livemart.local'}>`,
      to: emailLower,
      subject: 'Your LiveMart OTP Code',
      text: `Hello ${user.name || ''},\n\nYour OTP for LiveMart registration is ${code}.\nIt expires in ${minutesFromEnv()} minutes.\n\nThanks,\nLiveMart`
    };

    if (transporter) {
      try {
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.warn('Error sending OTP email:', mailErr.message);
      }
    }

    return res.json({
      ok: true,
      message: 'OTP sent',
      userId: user._id,
      ...(process.env.DEBUG_OTP === 'true' ? { otp: code } : {})
    });

  } catch (err) {
    console.error('requestOtp error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}

// ---------------- VERIFY OTP ----------------
async function verifyOtp(req, res) {
  try {
    const { userId, code, email } = req.body;

    // allow verification by userId+code OR email+code (frontend may send email)
    if ((!userId && !email) || !code) {
      return res.status(400).json({ error: "userId/email and code required" });
    }

    const query = userId ? { _id: userId } : { email: String(email).toLowerCase().trim() };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ error: "No OTP generated" });
    }

    // Check expiry
    if (user.otp.expiresAt && new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Check match
    if (String(code).trim() !== String(user.otp.code).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark verified and issue a JWT token
    user.otp.verified = true;
    user.verified = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // respond with token and user (lean shape)
    const userResp = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
    };

    return res.json({ ok: true, message: 'OTP verified', token, user: userResp });

  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// ---------------- DEBUG GET USER ----------------
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

// -----------------------------------
// GET /api/auth/me  (return logged-in user)
// -----------------------------------
async function getMe(req, res) {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      ok: true,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location
      }
    });
  } catch (err) {
    console.error('[getMe] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// -----------------------------------
// POST /api/auth/update-role
// -----------------------------------
async function updateRole(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role required' });

    const allowed = ['customer', 'retailer', 'wholesaler'];
    if (!allowed.includes(role.toLowerCase()))
      return res.status(400).json({ error: 'invalid role' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role.toLowerCase();
    await user.save();

    return res.json({
      ok: true,
      message: 'role updated',
      user: { id: user._id, role: user.role }
    });
  } catch (err) {
    console.error('[updateRole] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// ---------------- CHECK EMAIL ----------------
async function checkEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: "email required" });
    }

    const emailLower = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).lean();

    if (user) {
      // return exists + user (useful for frontend decision)
      return res.json({ ok: true, exists: true, user });
    } else {
      return res.json({ ok: true, exists: false });
    }
  } catch (err) {
    console.error("[checkEmail] error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

// ---------------- EXPORTS ----------------
module.exports = {
  requestOtp,
  verifyOtp,
  debugGetUser,
  getMe,
  updateRole,
  checkEmail
};
