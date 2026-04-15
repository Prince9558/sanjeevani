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
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const user = await User.create({
      name: name || "",
      email,
      mobile,
      address: address || "",
      password: hashedPassword,
      role: role || "receiver",
      isVerified: false,
      verificationToken
    });

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationToken}`;
    
    await sendEmail({
      email,
      subject: "Verify Your Email - Sanjeevani",
      message: `Click the following link to verify your email address:<br/><br/><a href="${verifyLink}" style="color: #0066cc; text-decoration: none;">${verifyLink}</a><br/><br/>This is an automated message, please do not reply.`
    });

    return res.json({ message: "Registration successful. Please check your email to verify your account." });

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

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked by the admin." });
    }

    if (user.isVerified === false) {
      if (!user.verificationToken) {
        // Legacy user who registered before verification system: auto-verify them
        user.isVerified = true;
        await user.save();
      } else {
        return res.status(400).json({ message: "Please verify your email before logging in. Check your inbox for the verification link." });
      }
    }

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


// ================= VERIFY EMAIL =================
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification link." });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ message: "Email successfully verified." });
  } catch (err) {
    console.error("Verification Error:", err);
    return res.status(500).json({ message: "Verification failed" });
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


// ================= FEEDBACK =================
const ProductDetail = require("../models/ProductDetail");

router.post('/feedback', requireAuth, async (req, res) => {
  const { feedback, toEmail, foodId } = req.body;
  if (!feedback) return res.status(400).json({ message: "Feedback is required" });

  try {
    const userEmail = req.user.email;
    if (!userEmail) return res.status(400).json({ message: "No user email found" });

    if (foodId) {
      const food = await ProductDetail.findById(foodId);
      if (food) {
        if (food.feedbackGiven) {
          return res.status(400).json({ message: "Feedback has already been submitted for this item in the past." });
        }
        food.feedbackGiven = true;
        await food.save();
      }
    }

    if (toEmail) {
      await sendEmail({
        email: toEmail,
        subject: "New feedback regarding your donation - Sanjeevani",
        message: `A receiver has provided feedback regarding a donation they picked up from you.<br/><br/><strong>Feedback:</strong><br/>${feedback}`
      });
    }

    await sendEmail({
      email: userEmail,
      subject: "Thank You for Your Feedback - Food Value",
      message: `Your feedback has been received and recorded. We highly appreciate your input, thank you for making Food Value a better place!`
    });

    return res.json({ message: "Feedback successfully registered and forwarded to the donor." });
  } catch (err) {
    console.error("Feedback error:", err);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
});

module.exports = router;