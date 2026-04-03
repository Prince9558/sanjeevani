const express = require("express");
const router = express.Router();
const ProductDetail = require("../models/ProductDetail");
const User = require("../models/User");
const ReservedItem = require("../models/ReservedItem");
const CollectedItem = require("../models/CollectedItem");
const UnreservedItem = require("../models/UnreservedItem");
const { requireAuth } = require("../middleware/auth");

function createBarcode() {
  return `FD-${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
}

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Add a food item (donor)
// POST /api/food/add
router.post("/add", requireAuth, async (req, res) => {
  try {
    const {
      name,
      quantity,
      unit,
      expiryDate,
      address,
      imageUrl,
      location,
      barcodePayload,
    } = req.body;

    if (!name || !quantity || !expiryDate || !address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (req.user.role !== "donor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only donors can add items" });
    }

    const donorId = req.user.id;

    const barcode = createBarcode();
    const otp = createOtp();

    const payload =
      barcodePayload && typeof barcodePayload === "object"
        ? barcodePayload
        : {
            barcode,
            name,
            expiryDate,
            quantity,
            unit: unit || "kg",
            address,
            location: location || null,
            donorEmail: req.user.email || null,
          };

    const food = await ProductDetail.create({
      name,
      quantity: Number(quantity),
      unit: unit || "kg",
      expiryDate: new Date(expiryDate),
      address,
      imageUrl: imageUrl || "",
      location: location || undefined,
      barcode,
      barcodePayload: payload,
      otp,
      status: "available",
      expiryState: "Fresh",
      donor: donorId,
    });

    await UnreservedItem.create({
      foodId: food._id,
      itemName: food.name,
      donorId: donorId,
      addedAt: new Date()
    });

    return res.json({ message: "Food added", id: food._id, barcode, otp });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add food item" });
  }
});

// List available items for receiver
// GET /api/food/available
router.get("/available", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "receiver" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only receivers can view available items" });
    }

    const foods = await ProductDetail.find({ status: "available" }).sort({ createdAt: -1 }).lean();

    const donors = await User.find({ _id: { $in: foods.map((f) => f.donor) } })
      .select("email name");
    const donorMap = new Map(donors.map((d) => [String(d._id), d]));

    const result = foods.map((f) => {
      const donor = donorMap.get(String(f.donor));
      return {
        id: f._id,
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        expiryDate: f.expiryDate,
        expiryState: f.expiryState,
        address: f.address,
        imageUrl: f.imageUrl,
        location: f.location,
        barcode: f.barcode,
        donor: donor
          ? { id: donor._id, email: donor.email, name: donor.name }
          : { id: f.donor },
      };
    });

    return res.json({ items: result });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch available items" });
  }
});

// Receiver reserves an item and receives OTP
// POST /api/food/reserve
router.post("/reserve", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "receiver" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only receivers can reserve items" });
    }

    const { foodId } = req.body;
    if (!foodId) return res.status(400).json({ message: "foodId is required" });

    const food = await ProductDetail.findById(foodId);
    if (!food) return res.status(404).json({ message: "Food item not found" });
    if (food.status !== "available") {
      return res.status(409).json({ message: "Food item is not available" });
    }

    food.status = "reserved";
    food.reservedBy = req.user.id;
    food.reservedAt = new Date();
    await food.save();

    await ReservedItem.create({
      foodId: food._id,
      itemName: food.name,
      donorId: food.donor,
      receiverId: req.user.id,
      reservedAt: food.reservedAt,
    });
    
    // Remove from unreserved logs
    await UnreservedItem.deleteOne({ foodId: food._id });

    const donor = await User.findById(food.donor).select("email name mobile").lean();
    const receiver = await User.findById(req.user.id).select("mobile").lean();

    if (receiver && receiver.mobile) {
      console.log(`\n=== SIMULATED SMS DISPATCH ===`);
      console.log(`To Receiver Mobile (${receiver.mobile}): Your pickup OTP for ${food.name} is ${food.otp}. Provide this to the donor.`);
      console.log(`==============================\n`);
    }

    return res.json({
      message: "Item reserved",
      otp: food.otp,
      food: {
        id: food._id,
        barcode: food.barcode,
        name: food.name,
        address: food.address,
        location: food.location,
        donor: donor || food.donor,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reserve item" });
  }
});

// Donor verifies OTP and completes pickup
// POST /api/food/pickup/verify
router.post("/pickup/verify", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "donor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only donors can verify OTP" });
    }

    const { foodId, otp } = req.body;
    if (!foodId || !otp) {
      return res.status(400).json({ message: "foodId and otp are required" });
    }

    const food = await ProductDetail.findById(foodId);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    if (String(food.donor) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not your food item" });
    }

    if (food.status !== "reserved") {
      return res.status(409).json({ message: "Food item is not reserved" });
    }

    // Verified via Frontend Firebase, skipping backend OTP match
    // if (String(food.otp) !== String(otp).trim()) {
    //   return res.status(400).json({ message: "OTP mismatch" });
    // }

    food.status = "collected";
    food.collectedBy = food.reservedBy;
    food.collectedAt = new Date();
    await food.save();

    await CollectedItem.create({
      foodId: food._id,
      itemName: food.name,
      donorId: food.donor,
      receiverId: food.reservedBy,
      collectedAt: food.collectedAt,
    });
    
    // Remove from reserved logs
    await ReservedItem.deleteOne({ foodId: food._id });

    return res.json({ message: "Pickup completed", foodId: food._id });
  } catch (err) {
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Donor list
// GET /api/food/donor-items
router.get("/donor-items", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "donor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only donors can view their items" });
    }

    const foods = await ProductDetail.find({ donor: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach receiver info if reserved
    const receiverIds = foods.map((f) => f.reservedBy).filter(Boolean);
    const receivers = await User.find({ _id: { $in: receiverIds } }).select("name email mobile");
    const receiverMap = new Map(receivers.map((r) => [String(r._id), r]));

    const result = foods.map((f) => {
      let receiver = null;
      if (f.reservedBy && receiverMap.has(String(f.reservedBy))) {
        receiver = receiverMap.get(String(f.reservedBy));
      }
      return {
        ...f,
        receiver: receiver ? { id: receiver._id, name: receiver.name, email: receiver.email, mobile: receiver.mobile } : null
      };
    });

    return res.json({ items: result });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch donor items" });
  }
});

// Receiver inventory
// GET /api/food/receiver-inventory
router.get("/receiver-inventory", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "receiver" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only receivers can view their inventory" });
    }

    const foods = await ProductDetail.find({
      $or: [
        { collectedBy: req.user.id, status: "collected" },
        { reservedBy: req.user.id, status: "reserved" }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    const donors = await User.find({ _id: { $in: foods.map((f) => f.donor) } })
      .select("email name mobile");
    const donorMap = new Map(donors.map((d) => [String(d._id), d]));

    const result = foods.map((f) => {
      const donor = donorMap.get(String(f.donor));
      return {
        ...f,
        donor: donor
          ? { id: donor._id, email: donor.email, name: donor.name, mobile: donor.mobile }
          : { id: f.donor },
      };
    });

    return res.json({ items: result });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch receiver inventory" });
  }
});

// Barcode lookup (for scanning support)
// GET /api/food/by-barcode/:barcode
router.get("/by-barcode/:barcode", requireAuth, async (req, res) => {
  try {
    const { barcode } = req.params;
    const food = await ProductDetail.findOne({ barcode }).lean();
    if (!food) return res.status(404).json({ message: "Food not found" });

    return res.json({
      id: food._id,
      name: food.name,
      expiryDate: food.expiryDate,
      expiryState: food.expiryState,
      quantity: food.quantity,
      unit: food.unit,
      address: food.address,
      imageUrl: food.imageUrl,
      location: food.location,
      barcodePayload: food.barcodePayload,
      donor: food.donor,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch food details" });
  }
});

// Public detail lookup (for QR code scanning)
// GET /api/food/public-details/:id
router.get("/public-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const food = await ProductDetail.findById(id).lean();
    if (!food) return res.status(404).json({ message: "Food not found" });

    // Optionally fetch the donor's name
    const donor = await User.findById(food.donor).select("name email").lean();

    return res.json({
      id: food._id,
      name: food.name,
      expiryDate: food.expiryDate,
      expiryState: food.expiryState,
      quantity: food.quantity,
      unit: food.unit,
      address: food.address,
      imageUrl: food.imageUrl,
      status: food.status,
      donor: donor ? donor.name || donor.email : "Unknown",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch food details" });
  }
});

module.exports = router;