const mongoose = require("mongoose");
require("dotenv").config();
const ProductDetail = require("./models/ProductDetail");
const UnreservedItem = require("./models/UnreservedItem");
const ReservedItem = require("./models/ReservedItem");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://user:pass@... (replace if needed, but dotenv handles it)");
    console.log("Connected to MongoDB.");

    const products = await ProductDetail.find({});
    let unreservedDeletedCount = 0;
    let reservedDeletedCount = 0;

    for (const p of products) {
      if (p.status === "reserved" || p.status === "collected") {
        const result = await UnreservedItem.deleteOne({ foodId: p._id });
        unreservedDeletedCount += result.deletedCount;
      }
      if (p.status === "collected") {
        const result = await ReservedItem.deleteOne({ foodId: p._id });
        reservedDeletedCount += result.deletedCount;
      }
    }

    console.log(`Cleaned up logs for existing records.`);
    console.log(`Removed ${unreservedDeletedCount} invalid records from UnreservedItem (Available logs).`);
    console.log(`Removed ${reservedDeletedCount} invalid records from ReservedItem logs.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
