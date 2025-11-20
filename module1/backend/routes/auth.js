// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  requestOtp,
  verifyOtp,
  checkEmail,
  debugGetUser,
  getMe,
  updateRole
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const getFrontendBase = () => process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_SUCCESS = getFrontendBase() + (process.env.CLIENT_SUCCESS_PATH || '/social-login-success');
const FRONTEND_FAIL = getFrontendBase() + (process.env.CLIENT_FAIL_PATH || '/login');

// OTP + misc endpoints
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/check-email', checkEmail);
router.get('/me', auth, getMe);
router.post('/update-role', auth, updateRole);
if (typeof debugGetUser === 'function') {
  router.get('/debug-user', debugGetUser);
}

// ---- Google OAuth start -- pass role in state (json encoded) ----
router.get('/google', (req, res, next) => {
  // Accept ?role=retailer or default to 'customer'
  const requestedRole = (req.query.role || 'customer').toLowerCase();
  const state = JSON.stringify({ role: requestedRole });

  console.log('[auth] starting google oauth, role requested=', requestedRole);
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state // state will be available in callback as req.query.state
  })(req, res, next);
});

// ---- Google callback ----
router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('[REQ] GET /api/auth/google/callback', { qs: req.query });
    next();
  },
  passport.authenticate('google', {
    session: false,
    failureRedirect: FRONTEND_FAIL
  }),
  (req, res) => {
    try {
      if (!req.user) {
        console.error('[auth/google/callback] no req.user after passport');
        return res.redirect(FRONTEND_FAIL);
      }

      const jwt = require('jsonwebtoken');
      // Ensure role lowercased and exists
      const role = req.user.role ? String(req.user.role).toLowerCase() : 'customer';

      const token = jwt.sign(
        { id: req.user._id || req.user.id, role: role, email: req.user.email || '' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      const redirectUrl = `${FRONTEND_SUCCESS}#token=${token}`;
      console.log('[auth/google/callback] success redirect to', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('[auth/google/callback] final handler error:', err);
      return res.redirect(FRONTEND_FAIL);
    }
  }
);

// ---- Facebook (keeps previous behavior) ----
router.get('/facebook', (req, res, next) => {
  const requestedRole = (req.query.role || 'customer').toLowerCase();
  const state = JSON.stringify({ role: requestedRole });
  passport.authenticate('facebook', { scope: ['email'], state })(req, res, next);
});

router.get(
  '/facebook/callback',
  (req, res, next) => {
    console.log('[REQ] GET /api/auth/facebook/callback', { qs: req.query });
    next();
  },
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: FRONTEND_FAIL
  }),
  (req, res) => {
    try {
      if (!req.user) return res.redirect(FRONTEND_FAIL);

      const jwt = require('jsonwebtoken');
      const role = req.user.role ? String(req.user.role).toLowerCase() : 'customer';
      const token = jwt.sign({ id: req.user._id || req.user.id, role, email: req.user.email || '' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const redirectUrl = `${FRONTEND_SUCCESS}#token=${token}`;
      console.log('[auth/facebook/callback] success redirect to', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('[auth/facebook/callback] final handler error:', err);
      return res.redirect(FRONTEND_FAIL);
    }
  }
);

module.exports = router;
