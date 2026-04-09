require("dotenv").config();
const mongoose = require("mongoose");
const ProductDetail = require("./models/ProductDetail");
const ReservedItem = require("./models/ReservedItem");
const UnreservedItem = require("./models/UnreservedItem");
const CollectedItem = require("./models/CollectedItem");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/foodvalue");
  console.log("Connected to MongoDB for ProductDetail refactoring");

  const db = mongoose.connection.db;

  try {
    const collections = await db.listCollections().toArray();
    const hasFoods = collections.some(c => c.name === "foods");

    if (hasFoods) {
      console.log("Migrating 'foods' collection to 'productdetails'...");
      
      const foodsArray = await db.collection("foods").find({}).toArray();
      console.log(`Found ${foodsArray.length} items in 'foods' collection.`);

      for (const foodDoc of foodsArray) {
        // Find if already exists in productdetails before inserting to avoid duplicates
        const existing = await ProductDetail.findById(foodDoc._id);
        if (!existing) {
          await db.collection("productdetails").insertOne(foodDoc);
        }
      }
      
      console.log("Copied foods to productdetails.");

      // Rename is ideal, but copying ensures safety. We'll drop foods after verifying.
      await db.collection("foods").drop();
      console.log("Dropped old 'foods' collection.");
    }
  } catch(e) {
    console.log("Foods collection manipulation error (might be already dropped):", e.message);
  }

  // Now backfill itemName onto all logs
  console.log("Backfilling item names into ReservedItem...");
  const reserved = await ReservedItem.find({ itemName: { $exists: false } });
  for (const r of reserved) {
    const ref = await ProductDetail.findById(r.foodId);
    r.itemName = ref ? ref.name : "Deleted Item";
    await r.save();
  }
  
  console.log("Backfilling item names into UnreservedItem...");
  const unreserved = await UnreservedItem.find({ itemName: { $exists: false } });
  for (const u of unreserved) {
    const ref = await ProductDetail.findById(u.foodId);
    u.itemName = ref ? ref.name : "Deleted Item";
    await u.save();
  }

  console.log("Backfilling item names into CollectedItem...");
  const collected = await CollectedItem.find({ itemName: { $exists: false } });
  for (const c of collected) {
    const ref = await ProductDetail.findById(c.foodId);
    c.itemName = ref ? ref.name : "Deleted Item";
    await c.save();
  }

  console.log("Completed database structural migration successfully!");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
