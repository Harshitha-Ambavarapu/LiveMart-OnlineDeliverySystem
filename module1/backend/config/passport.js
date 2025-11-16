// backend/config/passport.js

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  console.log("DEBUG passport loaded");

  // ---------------- GOOGLE STRATEGY ----------------
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // MUST MATCH GOOGLE CLOUD EXACTLY
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("DEBUG Google profile:", profile.id);

          // Check if user already exists
          const existing = await User.findOne({
            socialId: profile.id,
            provider: "google",
          });

          if (existing) return done(null, existing);

          // Extract email
          const email =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          // Create user
          const user = new User({
            name: profile.displayName,
            email,
            role: "Customer",
            provider: "google",
            socialId: profile.id,
            verified: true,
            location: {},
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          console.error("Google Auth Error:", err);
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
        profileFields: ["id", "displayName", "emails"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("DEBUG Facebook profile:", profile.id);

          const existing = await User.findOne({
            socialId: profile.id,
            provider: "facebook",
          });

          if (existing) return done(null, existing);

          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;

          const user = new User({
            name: profile.displayName,
            email,
            role: "Customer",
            provider: "facebook",
            socialId: profile.id,
            verified: true,
            location: {},
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          console.error("Facebook Auth Error:", err);
          return done(err, null);
        }
      }
    )
  );

  // passport serialize/deserialize (optional)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => done(null, user))
      .catch((err) => done(err, null));
  });
};
