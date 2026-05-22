const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
  email: { type: String, required: true },  // ✅ No unique: true
  receiverEmail: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  originalname: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Guest", guestSchema);
