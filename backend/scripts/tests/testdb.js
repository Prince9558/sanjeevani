require('dotenv').config();
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;

async function testConnection() {
  try {
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB.");
    
    // Test write
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await TestModel.create({ name: 'test_connection' });
    console.log("Successfully wrote a test document.");
    
    process.exit(0);
  } catch (err) {
    console.error("Connection/write failed:");
    console.error(err);
    process.exit(1);
  }
}

testConnection();
