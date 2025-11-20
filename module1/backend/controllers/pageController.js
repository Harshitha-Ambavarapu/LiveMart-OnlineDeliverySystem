// backend/controllers/pageController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Helper: canonical user id & role from req.user
 */
function getUser(req) {
  const u = req.user || {};
  const id = u.id || u._id || u.sub || null;
  const role = (u.role || '').toString().toLowerCase();
  return { id, role, raw: u };
}

/**
 * Customer dashboard
 * - returns minimal user info + any customer-specific summary you want
 */
exports.customerDashboard = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // fetch user basic profile (lean for performance)
    const user = await User.findById(userId).select('-password').lean();

    return res.json({
      ok: true,
      role: 'customer',
      message: `Welcome ${user?.name || ''}`,
      user,
      // add any customer-specific data here (recent orders, recommendations, etc.)
    });
  } catch (err) {
    console.error('[customerDashboard] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Retailer dashboard
 * - returns retailer profile, their inventory (products they own & addedBy='retailer'),
 *   and a count of pending wholesaler items (optional)
 */
exports.retailerDashboard = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(userId).select('-password').lean();

    // retailer's own products
    const retailerProducts = await Product.find({
      owner: mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId,
      addedBy: 'retailer',
      deleted: false
    }).sort({ createdAt: -1 }).lean();

    // pending wholesaler items to review (for simplicity show all pending wholesaler products)
    const pendingWholesaler = await Product.find({
      addedBy: 'wholesaler',
      status: 'pending',
      deleted: false
    }).sort({ createdAt: -1 }).limit(50).lean();

    return res.json({
      ok: true,
      role: 'retailer',
      message: `Welcome ${user?.name || ''}`,
      user,
      stats: {
        myProductCount: retailerProducts.length,
        pendingWholesalerCount: pendingWholesaler.length
      },
      products: retailerProducts,
      pendingWholesaler
    });
  } catch (err) {
    console.error('[retailerDashboard] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Wholesaler dashboard
 * - returns wholesaler profile and products added by them
 */
exports.wholesalerDashboard = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(userId).select('-password').lean();

    const ownerFilter = mongoose.Types.ObjectId.isValid(userId)
      ? { owner: mongoose.Types.ObjectId(userId) }
      : { owner: userId };

    const wholesalerProducts = await Product.find({
      ...ownerFilter,
      addedBy: 'wholesaler',
      deleted: false
    }).sort({ createdAt: -1 }).lean();

    // optionally include counts for quick UI badges
    const approvedCount = wholesalerProducts.filter(p => p.status === 'approved').length;
    const pendingCount = wholesalerProducts.filter(p => p.status === 'pending').length;

    return res.json({
      ok: true,
      role: 'wholesaler',
      message: `Welcome ${user?.name || ''}`,
      user,
      stats: {
        total: wholesalerProducts.length,
        approved: approvedCount,
        pending: pendingCount
      },
      products: wholesalerProducts
    });
  } catch (err) {
    console.error('[wholesalerDashboard] error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
