// ============================================================
// RemoTriage v4 — Server Entry Point
// server.js
// ============================================================

"use strict";

require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./config/database");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`✅ RemoTriage v4 running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`   API: http://localhost:${PORT}/api/v4`);
      logger.info(`   Health: http://localhost:${PORT}/api/v4/health`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received — shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

start();