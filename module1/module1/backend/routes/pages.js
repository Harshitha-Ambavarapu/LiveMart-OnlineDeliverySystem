// backend/routes/pages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const pageCtrl = require('../controllers/pageController');

router.get('/customer', auth, roleCheck('customer'), pageCtrl.customerDashboard);
router.get('/retailer', auth, roleCheck('retailer'), pageCtrl.retailerDashboard);
router.get('/wholesaler', auth, roleCheck('wholesaler'), pageCtrl.wholesalerDashboard);

module.exports = router;
