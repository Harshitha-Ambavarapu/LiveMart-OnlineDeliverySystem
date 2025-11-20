// backend/controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Helper: canonical user id & role from req.user
 */
function getUser(req) {
  const u = req.user || {};
  const id = u.id || u._id || u.sub || null;
  const role = String(u.role || '').toLowerCase();
  return { id, role, raw: u };
}

/* --------------------------------------------------
   ADD PRODUCT
   - Wholesaler adds -> pending for retailer
   - Retailer adds  -> approved and in retailer inventory
-------------------------------------------------- */
exports.addProduct = async (req, res) => {
  try {
    const { id: userId, role } = getUser(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { title, description, price, quantity, category } = req.body;
    const images = (req.files || []).map(f => "/uploads/" + f.filename);

    // sizes may be sent as JSON string or array
    let sizes = [];
    if (req.body.sizes) {
      try { sizes = Array.isArray(req.body.sizes) ? req.body.sizes : JSON.parse(req.body.sizes); }
      catch (e) { sizes = []; }
    }

    let status = "pending";
    let visibleToCustomer = false;

    if (role === "retailer") {
      // retailer-added products go directly to retailer inventory (approved)
      status = "approved";
      visibleToCustomer = false;
    }

    const product = new Product({
      title,
      description,
      price: price !== undefined ? Number(price) : 0,
      quantity: quantity !== undefined ? Number(quantity) : 0,
      category,
      sizes,
      images,
      owner: userId,
      // set sourceWholesaler only when a wholesaler creates the product
      sourceWholesaler: role === "wholesaler" ? userId : null,
      status,
      visibleToCustomer,
      deleted: false,
      // explicitly store normalized role as addedBy
      addedBy: role
    });

    await product.save();
    return res.json({ ok: true, product });
  } catch (err) {
    console.error("addProduct", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   LIST PRODUCTS
   view = wholesaler | retailer | customer
-------------------------------------------------- */
exports.listProducts = async (req, res) => {
  try {
    const view = req.query.view;
    const { id: userId, role } = getUser(req);

    if (!view) return res.status(400).json({ error: 'view query param required' });

    let products = [];
if (view === "wholesaler") {
  // Wholesaler sees only products originally added by wholesalers
  // OR items they currently own. Exclude any product whose addedBy is 'retailer'.
  products = await Product.find({
    deleted: false,
    addedBy: { $ne: "retailer" }, // <-- defensive: never include retailer-added items
    $or: [
      { sourceWholesaler: userId },
      { owner: userId }
    ]
  })
  .sort({ createdAt: -1 })
  .lean();
}

     else if (view === "retailer") {
      // Retailer sees:
      // 1) Pending wholesaler products to approve/reject
      // 2) Products they own (their inventory)
      products = await Product.find({
        deleted: false,
        $or: [
          { addedBy: "wholesaler", status: "pending" }, // pending wholesaler items
          { owner: userId } // retailer's own products (includes wholesaler items they approved)
        ]
      }).sort({ createdAt: -1 }).lean();
    } else if (view === "customer") {
      // Customer sees only approved & visible items
      products = await Product.find({
        deleted: false,
        status: "approved",
        visibleToCustomer: true
      }).sort({ createdAt: -1 }).lean();
    } else {
      return res.status(400).json({ error: 'invalid view param' });
    }

    return res.json({ ok: true, products });
  } catch (err) {
    console.error("listProducts", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   RETAILER APPROVES/REJECTS WHOLESALER PRODUCT
   - Approve: retailer becomes owner; can set price/quantity/visible
   - Reject: status = rejected; remains visible in wholesaler dashboard (sourceWholesaler) but not in retailer pending
-------------------------------------------------- */
exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, price, quantity, visibleToCustomer } = req.body;
    const { id: userId, role } = getUser(req);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (role !== "retailer") return res.status(403).json({ error: "Only retailer can approve/reject" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (String(product.addedBy).toLowerCase() !== "wholesaler") {
      return res.status(400).json({ error: "Only wholesaler-added products require approval" });
    }

    if (action === "approve") {
      product.status = "approved";
      product.owner = userId; // transfer ownership to retailer
      if (price !== undefined) product.price = Number(price);
      if (quantity !== undefined) product.quantity = Number(quantity);
      // visibleToCustomer default false unless explicitly true
      product.visibleToCustomer = visibleToCustomer === undefined ? false : !!visibleToCustomer;
      // keep sourceWholesaler unchanged
    } else if (action === "reject") {
      product.status = "rejected";
      product.visibleToCustomer = false;
      // do not change owner/sourceWholesaler
    } else {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    await product.save();
    return res.json({ ok: true, product });
  } catch (err) {
    console.error("updateApproval", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   UPDATE PRODUCT (owner only)
-------------------------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = getUser(req);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Not found" });

    if (String(product.owner) !== String(userId)) {
      return res.status(403).json({ error: "Only owner can edit" });
    }

    ["title", "description", "price", "quantity", "category"].forEach(key => {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    });

    // if images are uploaded, append (caller should handle replacement policy)
    if (req.files && req.files.length) {
      const imgs = (req.files || []).map(f => "/uploads/" + f.filename);
      product.images = product.images.concat(imgs);
    }

    await product.save();
    return res.json({ ok: true, product });
  } catch (err) {
    console.error("updateProduct", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   TOGGLE VISIBILITY (owner only)
-------------------------------------------------- */
exports.toggleVisible = async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    const { id: userId } = getUser(req);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Not found" });

    if (String(product.owner) !== String(userId)) {
      return res.status(403).json({ error: "Only owner can change visibility" });
    }

    product.visibleToCustomer = !!visible;
    await product.save();
    return res.json({ ok: true, product });
  } catch (err) {
    console.error("toggleVisible", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   DELETE PRODUCT (soft delete)
   - allow owner OR sourceWholesaler to delete
-------------------------------------------------- */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = getUser(req);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Not found" });

    const isOwner = String(product.owner) === String(userId);
    const isSourceWholesaler = product.sourceWholesaler && String(product.sourceWholesaler) === String(userId);

    if (!isOwner && !isSourceWholesaler) {
      return res.status(403).json({ error: "Only owner or original wholesaler can delete" });
    }

    product.deleted = true;
    await product.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteProduct", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/* --------------------------------------------------
   GET PRODUCT (view details)
-------------------------------------------------- */
exports.getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true, product: p });
  } catch (err) {
    console.error("getProduct", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};
