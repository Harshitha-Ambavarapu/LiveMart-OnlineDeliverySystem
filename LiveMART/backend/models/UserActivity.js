import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  searchHistory: { type: [String], default: [] },
  orderHistory: [
    {
      itemId: String,
      itemName: String,
      date: Date
    }
  ]
}, { timestamps: true });

export default mongoose.model("UserActivity", userActivitySchema);
