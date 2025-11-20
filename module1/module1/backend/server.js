// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

// --- Basic config ---
const PORT = Number(process.env.PORT || 5001);
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO || null;

async function start() {
  // Connect to MongoDB (optional - server will still start if no URI, but logs warning)
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    } catch (err) {
      console.warn('MongoDB connect error:', err.message || err);
    }
  } else {
    console.warn('No MONGO_URI provided — skipping DB connect (set MONGO_URI in .env)');
  }

  // Create app (must create BEFORE using it)
  const app = express();

  // Serve uploads directory as static (so images at /uploads/... work)
  const uploadsDir = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Common middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// DEBUG ONLY - remove this after testing
const Product = require('./models/Product');

app.get('/debug/product/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true, product: p });
  } catch (err) {
    console.error('debug/product error', err);
    return res.status(500).json({ error: 'server' });
  }
});

  // Health check
  app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

  // Try to mount route files if they exist. Use try/catch so missing files don't crash server.
  try {
    const productsRoute = require('./routes/products');
    app.use('/api/products', productsRoute);
    console.log('Mounted /api/products');
  } catch (err) {
    console.warn('Could not mount /api/products route:', err.message || err);
  }

  try {
    const authRoute = require('./routes/auth');
    app.use('/api/auth', authRoute);
    console.log('Mounted /api/auth');
  } catch (err) {
    // not fatal
    console.warn('Could not mount /api/auth route:', err.message || err);
  }

  try {
    const pageRoute = require('./routes/pages');
    app.use('/api/pages', pageRoute);
    console.log('Mounted /api/pages');
  } catch (err) {
    // not fatal
    console.warn('Could not mount /api/pages route:', err.message || err);
  }
  
  try {
  const cartRoute = require('./routes/cart');
  app.use('/api/cart', cartRoute);
  console.log('Mounted /api/cart');
} catch (err) {
  console.warn('Could not mount /api/cart route:', err.message || err);
}
  // Fallback: simple 404 for everything else
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler (nice stack in dev)
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Uploads served at: /uploads (folder: ${uploadsDir})`);
  });
}

// start the server
start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
