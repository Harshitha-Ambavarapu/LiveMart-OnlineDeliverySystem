// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../middleware/auth');

// 🔥 FIXED IMPORT — all controller functions
const {
  requestOtp,
  verifyOtp,
  checkEmail,
  debugGetUser,
  getMe,
  updateRole
} = require('../controllers/authController');

// ---- OTP endpoints ----
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', auth, getMe);
router.post('/update-role', auth, updateRole);
router.post('/check-email', checkEmail);

// optional debug endpoint
if (typeof debugGetUser === 'function') {
  router.get('/debug-user', debugGetUser);
}

// helper
const getFrontendBase = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// ---- Google OAuth ----
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('[REQ] GET /api/auth/google/callback', { qs: req.query });
    next();
  },
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${getFrontendBase()}/login`
  }),
  (req, res) => {
    try {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role, email: req.user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      return res.redirect(`${getFrontendBase()}/social-login-success#token=${token}`);
    } catch (err) {
      console.error('[auth/google/callback] final handler error:', err);
      return res.redirect(`${getFrontendBase()}/login`);
    }
  }
);

// ---- Facebook OAuth ----
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
  '/facebook/callback',
  (req, res, next) => {
    console.log('[REQ] GET /api/auth/facebook/callback', { qs: req.query });
    next();
  },
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${getFrontendBase()}/login`
  }),
  (req, res) => {
    try {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role, email: req.user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      return res.redirect(`${getFrontendBase()}/social-login-success#token=${token}`);
    } catch (err) {
      console.error('[auth/facebook/callback] final handler error:', err);
      return res.redirect(`${getFrontendBase()}/login`);
    }
  }
);

module.exports = router;
