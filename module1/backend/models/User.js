// backend/models/User.js
const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  code: { type: String },
  expiresAt: { type: Date },
  verified: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, index: true, sparse: true },
  phone: { type: String, index: true, sparse: true },
  role: { type: String, enum: ['Customer','Retailer','Consumer'], default: 'Customer' },
  passwordHash: { type: String },
  provider: { type: String, default: 'local' },
  socialId: { type: String },
  verified: { type: Boolean, default: false },
  location: {
    address: String,
    lat: Number,
    lng: Number,
    placeId: String
  },
  otp: OtpSchema
}, {
  timestamps: true
});

UserSchema.pre('save', function(next) {
  if (this.email && typeof this.email === 'string') {
    this.email = this.email.toLowerCase().trim();
  }
  return next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
