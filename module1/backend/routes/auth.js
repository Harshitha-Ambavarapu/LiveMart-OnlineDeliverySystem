// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');

// controllers - make sure these exist and export the named functions
const { requestOtp, verifyOtp, debugGetUser } = require('../controllers/authController');

// ---- OTP endpoints ----
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

// optional debug endpoint to inspect stored users during development
// (remove or protect in production)
if (typeof debugGetUser === 'function') {
  router.get('/debug-user', debugGetUser);
}

// helper to build front-end redirect base
const getFrontendBase = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// ---- Google OAuth routes ----
// Initiate Google auth (redirects user to Google consent)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route Google will redirect to after consent
// NOTE: we log incoming query (code / error) to help debugging token exchange issues.
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

      console.log('[auth/google/callback] success for user', req.user._id);
      return res.redirect(`${getFrontendBase()}/social-login-success#token=${token}`);
    } catch (err) {
      console.error('[auth/google/callback] final handler error:', err);
      return res.redirect(`${getFrontendBase()}/login`);
    }
  }
);

// ---- Facebook OAuth routes ----
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

      console.log('[auth/facebook/callback] success for user', req.user._id);
      return res.redirect(`${getFrontendBase()}/social-login-success#token=${token}`);
    } catch (err) {
      console.error('[auth/facebook/callback] final handler error:', err);
      return res.redirect(`${getFrontendBase()}/login`);
    }
  }
);

module.exports = router;
