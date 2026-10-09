const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGODB_URI from the environment.
 * Logs success or throws on failure so the caller (server.js) can handle it.
 */
async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
}

module.exports = connectDB;
