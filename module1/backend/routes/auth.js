// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { requestOtp, verifyOtp, debugGetUser } = require('../controllers/authController');

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

// debug endpoint (temporary)
router.get('/debug-user', debugGetUser);

// social auth (unchanged)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login` }), (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: req.user._id, role: req.user.role, email: req.user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectBase}/social-login-success#token=${token}`);
  } catch (err) {
    console.error('[auth/google/callback] error', err);
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectBase}/login`);
  }
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login` }), (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: req.user._id, role: req.user.role, email: req.user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectBase}/social-login-success#token=${token}`);
  } catch (err) {
    console.error('[auth/facebook/callback] error', err);
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectBase}/login`);
  }
});

module.exports = router;

