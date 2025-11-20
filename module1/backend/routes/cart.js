// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const cartCtrl = require('../controllers/cartController');
const auth = require('../middleware/auth');

// All cart routes require authentication (customer)
router.get('/', auth, cartCtrl.getCart);
router.post('/add', auth, cartCtrl.addToCart);
router.put('/item/:productId', auth, cartCtrl.updateItem);
router.delete('/item/:productId', auth, cartCtrl.removeItem);
router.delete('/clear', auth, cartCtrl.clearCart);

module.exports = router;
