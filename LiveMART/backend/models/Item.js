import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  inStock: Boolean,
  discountPercent: { type: Number, default: 0 },
  shopLocation: { lat: Number, lon: Number }
});

export default mongoose.model("Item", itemSchema);
