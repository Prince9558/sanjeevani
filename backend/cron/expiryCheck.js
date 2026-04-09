const cron = require('node-cron');
const ProductDetail = require('../models/ProductDetail');

cron.schedule('0 0 * * *', async () => {
   const foods = await ProductDetail.find();

   foods.forEach(async (food) => {
      const today = new Date();
      const expiry = new Date(food.expiryDate);

      const diff = (expiry - today) / (1000 * 60 * 60 * 24);

      // Only update expiryState label.
      // Do NOT disturb pickup flow statuses (available/reserved/collected).
      if (diff <= 1 && diff > 0) {
         food.expiryState = "Near Expiry";
      } else if (diff <= 0) {
         food.expiryState = "Expired";
      } else {
         food.expiryState = "Fresh";
      }

      await food.save();
   });

   console.log("Expiry check completed");
});

cron.schedule('*/15 * * * *', async () => {
   const ReservedItem = require('../models/ReservedItem');
   const UnreservedItem = require('../models/UnreservedItem');
   
   const reservedFoods = await ProductDetail.find({ status: "reserved" });
   const now = new Date();

   for (const food of reservedFoods) {
      if (!food.reservedAt) continue;

      const hoursPassed = (now - new Date(food.reservedAt)) / (1000 * 60 * 60);
      const limit = food.foodType === "Cooked" ? 2 : 24;

      if (hoursPassed >= limit) {
         food.status = "available";
         food.reservedBy = undefined;
         food.reservedAt = undefined;
         food.otp = String(Math.floor(100000 + Math.random() * 900000));
         await food.save();

         await ReservedItem.deleteOne({ foodId: food._id });
         await UnreservedItem.create({
            foodId: food._id,
            itemName: food.name,
            donorId: food.donor,
            addedAt: new Date()
         });
         console.log(`Auto-cancelled reservation for food ID: ${food._id}`);
      }
   }
});