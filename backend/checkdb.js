require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  try {
    const uri = process.env.MONGO_URI;
    console.log("Checking URI:", uri.replace(/:([^:@]{3,})@/, ':***@'));
    
    await mongoose.connect(uri);
    
    // Get the database name we are connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log("Connected to Database Name:", dbName);
    
    const User = require('./models/User');
    const users = await User.find({}, 'name email').lean();
    console.log("Total Users found in this specific database:", users.length);
    console.log("Here are the users:");
    users.forEach(u => console.log(`- ${u.name} (${u.email})`));
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
