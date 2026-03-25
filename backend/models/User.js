const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobile: String,
  password: String,
  role: { type: String, enum: ['admin', 'donor', 'receiver'], default: 'receiver' },
  isVerified: { type: Boolean, default: false },
  mobileOtp: String,
  emailOtp: String
});

module.exports = mongoose.model("User", userSchema);