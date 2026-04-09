require("dotenv").config();
const mongoose = require("mongoose");
const Food = require("./models/Food");
const UnreservedItem = require("./models/UnreservedItem");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/foodvalue");
  console.log("Connected to MongoDB for Unreserved migration");

  const foods = await Food.find({});
  let count = 0;

  for (const food of foods) {
    const existing = await UnreservedItem.findOne({ foodId: food._id });
    if (!existing) {
      await UnreservedItem.create({
        foodId: food._id,
        donorId: food.donor,
        addedAt: food.createdAt || new Date(),
      });
      count++;
    }
  }

  console.log(`Migration Complete: Created ${count} UnreservedItem logs.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
