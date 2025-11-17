// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Item from "./models/Item.js";
import UserActivity from "./models/UserActivity.js";

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/livemart";
const PORT = process.env.PORT || 5000;

// 🔵 DISTANCE CALCULATION (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}


mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB connect error:", err));

/**
 * SEARCH route (supports keyword, price, qty, stock, location)
 * Also logs keyword to user activity if userId provided
 */
// SMART SEARCH + FILTER
app.get("/api/search", async (req, res) => {
  try {
    const { keyword, minPrice, maxPrice, inStock, quantity } = req.query;

    let query = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock) {
      query.inStock = inStock === "true";
    }

    if (quantity) {
      query.quantity = { $gte: Number(quantity) };
    }

    const results = await Item.find(query);
    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOCATION-BASED SHOP FILTER
app.get("/api/nearby", async (req, res) => {
  try {
    const { lat, lon, maxDistance } = req.query;

    if (!lat || !lon || !maxDistance) {
      return res.status(400).json({ error: "Missing lat, lon or maxDistance" });
    }

    const items = await Item.find();

    const nearbyItems = items.filter((item) => {
      if (!item.shopLocation) return false;

      const distance = getDistance(
        Number(lat),
        Number(lon),
        item.shopLocation.lat,
        item.shopLocation.lon
      );

      return distance <= Number(maxDistance);
    });

    res.json(nearbyItems);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/log-order
 * Body: { userId, itemId, itemName }
 * Records an order into user's orderHistory
 */
app.post("/api/log-order", async (req, res) => {
  try {
    const { userId, itemId, itemName } = req.body;
    if (!userId || !itemId) return res.status(400).json({ error: "userId and itemId required" });

    await UserActivity.findOneAndUpdate(
      { userId },
      { $push: { orderHistory: { itemId, itemName, date: new Date() } } },
      { upsert: true }
    );

    res.json({ message: "Order logged" });
  } catch (err) {
    console.error("Log order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/recommend?userId=...
 * Very simple recommendation: get last few search keywords & order names and return matching items
 */
app.get("/api/recommend", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json([]);

    const user = await UserActivity.findOne({ userId }).lean();
    if (!user) return res.json([]);

    const lastSearches = (user.searchHistory || []).slice(-10);
    const lastOrders = (user.orderHistory || []).slice(-10).map(o => o.itemName);
    const keywords = [...lastSearches, ...lastOrders].filter(Boolean);

    if (keywords.length === 0) return res.json([]);

    // Build OR regex filters from keywords (case-insensitive)
    const orFilters = keywords.map(k => ({ name: { $regex: k, $options: "i" } }));

    const recommendations = await Item.find({ $or: orFilters }).limit(20);
    res.json(recommendations);
  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/discounts
 * Return items with discountPercent >= threshold (default 10)
 */
app.get("/api/discounts", async (req, res) => {
  try {
    const threshold = Number(req.query.min || 10);
    const items = await Item.find({ discountPercent: { $gte: threshold } }).sort({ discountPercent: -1 });
    res.json(items);
  } catch (err) {
    console.error("Discounts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Basic test route
app.get("/", (req, res) => res.send("LiveMART backend OK"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


