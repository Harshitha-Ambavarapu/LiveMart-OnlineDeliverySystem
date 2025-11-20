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

  // role: accept both lowercase and capitalized values,
  // but we'll normalize to lowercase before saving.
  role: {
    type: String,
    enum: [
      'customer','retailer','wholesaler',    // canonical lowercase values
      'Customer','Retailer','Wholesaler'     // also accept capitalized from frontend/JWT
    ],
    default: 'customer'
  },

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
  // normalize role to lowercase so DB stays consistent
  if (this.role && typeof this.role === 'string') {
    this.role = this.role.toLowerCase().trim();
  }
  return next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
