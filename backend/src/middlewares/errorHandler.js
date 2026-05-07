// src/middlewares/errorHandler.js
"use strict";

const logger = require("../utils/logger");
const { KENYA_EMERGENCY_CONTACTS } = require("../services/facilityService");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error(`[ERROR] ${req.method} ${req.path} | ${statusCode} | ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, error: "Token expired" });
  }

  // Duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }

  res.status(statusCode).json({
    success: false,
    error: isProduction ? "An internal error occurred. Please try again." : err.message,
    ...(statusCode >= 500 && { emergency: KENYA_EMERGENCY_CONTACTS }),
  });
};