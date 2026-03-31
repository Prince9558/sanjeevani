const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "receiver" },
  mobile: String,
  address: String,

  otp: String,
  otpExpiry: Date,
  emailOtp: String,
});

module.exports = mongoose.model("User", userSchema);