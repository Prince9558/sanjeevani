const express = require("express");
const router = express.Router();
const ProductDetail = require("../models/ProductDetail");
const User = require("../models/User");
const ReservedItem = require("../models/ReservedItem");
const CollectedItem = require("../models/CollectedItem");
const UnreservedItem = require("../models/UnreservedItem");
const { requireAuth } = require("../middleware/auth");

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/admin/overview
router.get("/overview", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const today = startOfToday();

    const [totalCollected, donatedToday, availableCount, reservedCount] =
      await Promise.all([
        ProductDetail.countDocuments({ status: "collected" }),
        ProductDetail.countDocuments({ status: "collected", collectedAt: { $gte: today } }),
        ProductDetail.countDocuments({ status: "available" }),
        ProductDetail.countDocuments({ status: "reserved" }),
      ]);

    const addedNotDonated = await ProductDetail.countDocuments({ status: "available" });

    const [donors, receivers] = await Promise.all([
      User.find({ role: "donor" }).select("email name mobile isBlocked"),
      User.find({ role: "receiver" }).select("email name mobile isBlocked"),
    ]);

    return res.json({
      kpis: {
        totalCollected,
        donatedToday,
        availableCount,
        reservedCount,
        addedNotDonated,
      },
      donors,
      receivers,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch admin overview" });
  }
});

// GET /api/admin/stock
// Returns all food stock items with populated donor/receiver emails.
router.get("/stock", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const items = await ProductDetail.find()
      .populate("donor", "email name mobile")
      .populate("reservedBy", "email name mobile")
      .populate("collectedBy", "email name mobile")
      .lean();

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch admin stock" });
  }
});

// GET /api/admin/logs
// Returns comprehensive logs from all tables
router.get("/logs", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access only" });

    const [added, reserved, collected] = await Promise.all([
      UnreservedItem.find().populate("foodId", "name").populate("donorId", "email").lean(),
      ReservedItem.find().populate("foodId", "name").populate("donorId", "email").populate("receiverId", "email").lean(),
      CollectedItem.find().populate("foodId", "name").populate("donorId", "email").populate("receiverId", "email").lean(),
    ]);

    return res.json({ added, reserved, collected });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// DELETE /api/admin/food/:id
router.delete("/food/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access only" });
    const product = await ProductDetail.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Food item not found" });

    await ProductDetail.findByIdAndDelete(req.params.id);
    return res.json({ message: "Food item deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete food item" });
  }
});

// PUT /api/admin/user/:id/toggle-block
router.put("/user/:id/toggle-block", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access only" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Cannot block admin user" });

    user.isBlocked = !user.isBlocked;
    await user.save();
    
    return res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (err) {
    return res.status(500).json({ message: "Failed to toggle block status" });
  }
});

module.exports = router;
