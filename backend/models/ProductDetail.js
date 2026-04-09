const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ["kg", "g", "packet", "piece", "plate", "litre"], default: "kg" },
    expiryDate: { type: Date, required: true },
    address: { type: String, required: true },
    imageUrl: { type: String, default: "" },

    foodType: { type: String, enum: ["Cooked", "Uncooked"], default: "Cooked" },
    cookedTime: { type: Date, default: null },


    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Barcode/QR storage so scanning can fetch details
    barcode: { type: String, unique: true, index: true },
    barcodePayload: { type: Object },

    // Security & lifecycle
    otp: { type: String, required: true },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reservedAt: { type: Date, default: null },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    collectedAt: { type: Date, default: null },
    feedbackGiven: { type: Boolean, default: false },

    // Flow status
    status: { type: String, enum: ["available", "reserved", "collected"], default: "available" },

    // Shelf expiry label (does NOT affect flow status)
    expiryState: { type: String, default: "Fresh" },

    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductDetail", foodSchema);