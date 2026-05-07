// config/database.js
"use strict";

const mongoose = require("mongoose");
const logger = require("../src/utils/logger");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI not set — running without database (triage-only mode)");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
    mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    logger.warn("Continuing without database — triage still works offline");
  }
}

module.exports = connectDB;