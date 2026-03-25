const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

router.post('/register', async (req, res) => {
  const { name, email, password, role, mobile } = req.body;

  try {
    if (!email || !password || !mobile) {
      return res.status(400).json({ message: "name, email, mobile and password are required" });
    }

    if (role === 'admin') {
      return res.status(400).json({ message: "Admin account cannot be created via register" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name: name || "",
      email,
      mobile,
      password: hashedPassword,
      role: role || "receiver",
      isVerified: false,
      mobileOtp
    });

    console.log(`\n\n[SIMULATING SMS] To Mobile: ${mobile} -> Your Verify OTP is ${mobileOtp}\n\n`);

    return res.json({ message: "Please verify your mobile number. OTP sent.", id: user._id, email });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post('/verify-mobile', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.mobileOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.mobileOtp = undefined;
    await user.save();
    return res.json({ message: "Mobile verified successfully" });
  } catch(err) {
    return res.status(500).json({ message: "Verification failed" });
  }
});

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

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Please verify your mobile number first", email: user.email });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, email: user.email, role: user.role, mobile: user.mobile });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = emailOtp;
    await user.save();

    console.log(`\n\n[SIMULATING EMAIL] To: ${email} -> Password Reset OTP is ${emailOtp}\n\n`);

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        message: `Your OTP for password reset is ${emailOtp}.`
      });
      return res.json({ message: "OTP sent to your email" });
    } catch (emailError) {
      console.error("Email send error, but continuing for dev:", emailError.message);
      // Even if email fails, return success so frontend can proceed with the logged OTP
      return res.json({ message: "OTP sent to your email (check console if email fails)" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Forgot password failed" });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.emailOtp || user.emailOtp !== otp) return res.status(400).json({ message: "Invalid or expired OTP" });
    if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailOtp = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;