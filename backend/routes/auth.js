const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { requireAuth } = require('../middleware/auth');


// ================= REGISTER =================
router.post('/register', async (req, res) => {
  const { name, email, password, role, mobile, address } = req.body;

  try {
    if (!email || !password || !mobile || !name || !address) {
      return res.status(400).json({ message: "name, email, mobile, address and password are required" });
    }

    if (role === 'admin') {
      return res.status(400).json({ message: "Admin account cannot be created via register" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || "",
      email,
      mobile,
      address: address || "",
      password: hashedPassword,
      role: role || "receiver",
    });

    return res.json({ message: "User registered successfully", id: user._id });

  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
});


// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  // Hardcoded admin login
  if (email === 'admin9558@gmail.com' && password === 'Admin@#001') {
    const token = jwt.sign(
      { id: 'admin-hardcoded', role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, email, role: 'admin' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      name: user.name,
      address: user.address,
    });

  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});


// ================= FORGOT PASSWORD (OTP EMAIL) =================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔐 Generate OTP
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = emailOtp;
    await user.save();

    // 📧 Send Email
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your OTP for password reset is ${emailOtp}. It is valid for 10 minutes.`
    });

    return res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});


// ================= RESET PASSWORD =================
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.emailOtp || user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.emailOtp = undefined;

    await user.save();

    return res.json({ message: "Password reset successfully." });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});


// ================= UPDATE PROFILE =================
router.put('/profile', requireAuth, async (req, res) => {
  const { name, mobile, address } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (mobile !== undefined) user.mobile = mobile;
    if (address !== undefined) user.address = address;

    await user.save();
    return res.json({ message: "Profile updated successfully", name: user.name, mobile: user.mobile, address: user.address });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;