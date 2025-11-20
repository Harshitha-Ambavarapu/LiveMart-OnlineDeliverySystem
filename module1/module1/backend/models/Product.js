// backend/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  category: { type: String, default: '' },
  images: { type: [String], default: [] },

  // Who added the product initially (wholesaler | retailer) — required for new workflow
  addedBy: { type: String, enum: ['wholesaler', 'retailer'], required: true },

  // ID of original wholesaler (if a wholesaler added it). This must remain even if owner is transferred.
  sourceWholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Current owner (seller) — starts as the creator, may change to retailer on approval
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // workflow status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // controls whether product is visible on the customer-facing page
  visibleToCustomer: { type: Boolean, default: false },

  // soft-delete flag
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
