// backend/config/passport.js
// Passport configuration for Google + Facebook
// Updated to accept role via OAuth state and preserve existing user roles.

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  console.log('DEBUG passport loaded');

  // ---------------- GOOGLE STRATEGY ----------------
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true // important: read req.query.state
      },
      // note: with passReqToCallback=true, signature is (req, accessToken, refreshToken, profile, done)
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Try to extract role from state (we JSON-encode { role } in routes/auth.js)
          let roleFromState = null;
          try {
            if (req && req.query && req.query.state) {
              // state can be url-encoded JSON; try to parse
              const raw = req.query.state;
              roleFromState = (typeof raw === 'string') ? JSON.parse(raw).role : null;
            }
          } catch (e) {
            // ignore parse errors
            roleFromState = null;
          }

          // Normalize role to lowercase if present
          if (roleFromState) roleFromState = String(roleFromState).toLowerCase();

          console.log('DEBUG Google profile:', profile.id, 'roleFromState=', roleFromState);

          // find existing social user (by provider + socialId)
          const socialId = profile.id;
          let existing = await User.findOne({ socialId: socialId, provider: 'google' });

          // If social user exists, return them (do not overwrite role)
          if (existing) {
            return done(null, existing);
          }

          // If not found by socialId, try find by email (user may have registered via OTP/local)
          const email = profile.emails && profile.emails[0] && profile.emails[0].value
            ? String(profile.emails[0].value).toLowerCase()
            : null;

          if (email) {
            const byEmail = await User.findOne({ email: email });
            if (byEmail) {
              // attach social fields but preserve existing role
              byEmail.socialId = socialId;
              byEmail.provider = 'google';
              byEmail.verified = true;
              await byEmail.save();
              return done(null, byEmail);
            }
          }

          // No existing user - create a new one. Use roleFromState if provided; default to 'customer'
          const newRole = roleFromState || 'customer';

          const user = new User({
            name: profile.displayName || '',
            email: email || '',
            role: newRole,
            provider: 'google',
            socialId: socialId,
            verified: true,
            location: {}
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          console.error('Google Auth Error:', err);
          return done(err, null);
        }
      }
    )
  );

  // ---------------- FACEBOOK STRATEGY ----------------
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'emails'],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('DEBUG Facebook profile:', profile.id);

          // Attempt to find existing facebook social user
          const socialId = profile.id;
          let existing = await User.findOne({ socialId: socialId, provider: 'facebook' });
          if (existing) return done(null, existing);

          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (email) {
            const byEmail = await User.findOne({ email: String(email).toLowerCase() });
            if (byEmail) {
              byEmail.socialId = socialId;
              byEmail.provider = 'facebook';
              byEmail.verified = true;
              await byEmail.save();
              return done(null, byEmail);
            }
          }

          // Default role for new social accounts
          const user = new User({
            name: profile.displayName || '',
            email: email || '',
            role: 'customer',
            provider: 'facebook',
            socialId,
            verified: true,
            location: {}
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          console.error('Facebook Auth Error:', err);
          return done(err, null);
        }
      }
    )
  );

  // passport serialize/deserialize
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => done(null, user))
      .catch((err) => done(err, null));
  });
};
