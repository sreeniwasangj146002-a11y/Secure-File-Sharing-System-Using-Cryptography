

const mongoose = require("mongoose");
const sendOtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  filename: { type: String, required: true },
  otp: { type: String },
  otpExpiresAt: { type: Date }, // OTP expiry time (1 minute)
  verified: { type: Boolean, default: false },
  downloaded: { type: String, default: "Not Downloaded" },
  expiresAt: { type: Date }, // Initial link expiry (1 minute)
}, { timestamps: true });

// ✅ Index for faster queries
sendOtpSchema.index({ email: 1, filename: 1 });

module.exports = mongoose.model("Sendotp", sendOtpSchema);

