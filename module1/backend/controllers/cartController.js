// backend/controllers/cartController.js
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

function getUserId(req) {
  return req.user?.id || req.user?._id || null;
}

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const cart = await Cart.findOne({ user: userId }).populate('items.product').lean();
    return res.json({ ok: true, cart: cart || { user: userId, items: [] } });
  } catch (err) {
    console.error('getCart', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/cart/add   body: { productId, quantity }
exports.addToCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.findById(productId).lean();
    if (!product || product.deleted) return res.status(404).json({ error: 'Product not found' });

    // get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // find existing item
    const itemIndex = cart.items.findIndex(it => String(it.product) === String(productId));
    if (itemIndex >= 0) {
      // increment quantity (but keep reasonable cap)
      cart.items[itemIndex].quantity = Math.min(1000, cart.items[itemIndex].quantity + qty);
      // Optionally update price snapshot
      cart.items[itemIndex].priceAtAdd = product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty,
        priceAtAdd: product.price
      });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    return res.json({ ok: true, cart: populated });
  } catch (err) {
    console.error('addToCart', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/cart/item/:productId   body: { quantity }
exports.updateItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { productId } = req.params;
    const { quantity } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const idx = cart.items.findIndex(it => String(it.product) === String(productId));
    if (idx === -1) return res.status(404).json({ error: 'Item not found in cart' });

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      // remove item if 0 or invalid
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Math.min(1000, qty);
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    return res.json({ ok: true, cart: populated });
  } catch (err) {
    console.error('updateItem', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/cart/item/:productId
exports.removeItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { productId } = req.params;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(it => String(it.product) !== String(productId));
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    return res.json({ ok: true, cart: populated });
  } catch (err) {
    console.error('removeItem', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    await Cart.findOneAndUpdate({ user: userId }, { items: [] }, { upsert: true });
    return res.json({ ok: true, cart: { user: userId, items: [] } });
  } catch (err) {
    console.error('clearCart', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
