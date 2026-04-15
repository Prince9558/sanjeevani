const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "receiver" },
  mobile: String,
  address: String,

  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  isBlocked: { type: Boolean, default: false },

  otp: String,
  otpExpiry: Date,
  emailOtp: String,
});

module.exports = mongoose.model("User", userSchema);