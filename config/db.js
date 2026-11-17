const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI environment variable is not defined.');
    console.warn('⚠️  Please set MONGODB_URI in your .env file or hosting environment (e.g., Render).');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'taskmanagement',
      serverSelectionTimeoutMS: 8000
    });

    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
};

const getStatus = () => ({
  connected: isConnected && mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  dbName: mongoose.connection.name || 'taskmanagement'
});

module.exports = { connectDB, getStatus };
