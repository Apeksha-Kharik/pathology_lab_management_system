const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This line "grabs" the link from your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Team Cloud Database Connected!");
  } catch (err) {
    console.log("❌ Connection Failed:", err.message);
  }
};

module.exports = connectDB;