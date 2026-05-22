
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  path: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  size: String, // Store file size
  downloaded: { type: String },
  sharedCount: { type: Number, default: 0 }, // Added sharedCount for 200 status count
  createdAt: { type: Date, default: Date.now },
  expiryTime_default: { type: Date }, 
  recivermail:{ type: String},
});

module.exports = mongoose.model("File", fileSchema);

