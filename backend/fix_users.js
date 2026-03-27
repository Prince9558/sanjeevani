require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Give all users without a role the 'receiver' role.
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'receiver' } }
    );
    
    console.log(`Updated ${result.modifiedCount} users to have the default 'receiver' role.`);
    
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  } catch (err) {
    console.error("DB Error:", err);
  }
};

fixUsers();
