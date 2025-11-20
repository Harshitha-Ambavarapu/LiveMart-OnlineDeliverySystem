/**
 * Script: migrate_roles.js
 * Purpose: Normalize role values in User collection
 * Run: node scripts/migrate_roles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../module1/backend/models/User');   // correct path for your 
project

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const map = {
      Customer: 'customer',
      Retailer: 'retailer',
      Consumer: 'wholesaler',
      Wholesaler: 'wholesaler'
    };

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const u of users) {
      const current = u.role;
      const normalized = map[current] || String(current || '').toLowerCase();
      if (current !== normalized) {
        u.role = normalized;
        await u.save();
        console.log(`Updated ${u._id} : ${current} -> ${normalized}`);
      }
    }

    console.log("Role migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
})();

