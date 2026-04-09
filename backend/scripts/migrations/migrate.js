require("dotenv").config();
const mongoose = require("mongoose");
const Food = require("./models/Food");
const ReservedItem = require("./models/ReservedItem");
const CollectedItem = require("./models/CollectedItem");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/foodvalue");

  console.log("Connected to MongoDB for migration");

  const foods = await Food.find({ status: { $in: ["reserved", "collected"] } });

  console.log(`Found ${foods.length} items to migrate.`);

  let resCount = 0;
  let colCount = 0;

  for (const food of foods) {
    if (food.status === "reserved" || food.status === "collected") {
      const existingRes = await ReservedItem.findOne({ foodId: food._id });
      if (!existingRes) {
        await ReservedItem.create({
          foodId: food._id,
          donorId: food.donor,
          receiverId: food.reservedBy || food.collectedBy,
          reservedAt: food.reservedAt || food.createdAt,
        });
        resCount++;
      }
    }

    if (food.status === "collected") {
      const existingCol = await CollectedItem.findOne({ foodId: food._id });
      if (!existingCol) {
        await CollectedItem.create({
          foodId: food._id,
          donorId: food.donor,
          receiverId: food.collectedBy,
          collectedAt: food.collectedAt || food.updatedAt,
        });
        colCount++;
      }
    }
  }

  console.log(`Migration Complete: Created ${resCount} ReservedItem logs and ${colCount} CollectedItem logs.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
