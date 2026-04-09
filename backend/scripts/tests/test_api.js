const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/foodvalue");
  const Food = require("./models/Food");
  const food = await Food.findOne({ status: "reserved" }).lean();
  if (!food) {
    console.log("No reserved food found in DB.");
    process.exit(0);
  }
  
  const userId = food.reservedBy;
  console.log(`Found reserved item for user: ${userId}`);
  
  const token = jwt.sign(
    { id: String(userId), role: "receiver", email: "test@test.com" },
    process.env.JWT_SECRET || "sanjeevani_secret",
    { expiresIn: "10m" }
  );
  
  console.log("Token generated. Pinging localhost:5000/api/food/receiver-inventory...");
  
  const req = http.get("http://localhost:5000/api/food/receiver-inventory", {
    headers: { "Authorization": `Bearer ${token}` }
  }, (res) => {
    let raw = "";
    res.on("data", chunk => raw += chunk);
    res.on("end", () => {
      const data = JSON.parse(raw);
      const items = data.items || [];
      const reservedCount = items.filter(i => i.status === "reserved").length;
      console.log(`API returned ${items.length} total items.`);
      console.log(`API returned ${reservedCount} reserved items.`);
      
      if (reservedCount === 0) {
        console.log("\n[WARNING] Data mismatch! The DB has reserved items, but the API returned 0.");
        console.log("This means the node server running on port 5000 is still executing the old code (cached).");
      } else {
         console.log("\n[SUCCESS] The API correctly returned reserved items.");
      }
      process.exit(0);
    });
  });
  
  req.on("error", (e) => {
    console.log("Failed to connect to localhost:5000: " + e.message);
    process.exit(1);
  });
}

run().catch(console.error);
