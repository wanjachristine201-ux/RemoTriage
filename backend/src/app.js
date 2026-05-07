// ============================================================
// RemoTriage v4 — Express App
// src/app.js
// ============================================================

"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const triageRoutes = require("./routes/triage");
const authRoutes = require("./routes/auth");
const facilityRoutes = require("./routes/facilities");
const ussdRoutes = require("./routes/ussd");
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");

const app = express();
const rawCorsOrigin = process.env.CORS_ORIGIN || "*";
const corsOrigin = rawCorsOrigin === "*"
  ? "*"
  : rawCorsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);

// ── SECURITY MIDDLEWARE ─────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize()); // Block NoSQL injection
app.use(cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── RATE LIMITING ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// ── PARSING ─────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // Required for USSD

// ── LOGGING ─────────────────────────────────────────────────
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.url === "/api/v4/health",
}));

// ── ROUTES ──────────────────────────────────────────────────
const API = "/api/v4";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/triage`, triageRoutes);
app.use(`${API}/facilities`, facilityRoutes);
app.use(`${API}/ussd`, ussdRoutes);

// ── HEALTH CHECK ────────────────────────────────────────────
app.get(`${API}/health`, (req, res) => {
  res.json({
    status: "ok",
    service: "RemoTriage API",
    version: "4.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    engine: "RemoTriage-Deterministic-v4",
    ai: process.env.ANTHROPIC_API_KEY ? "configured" : "not_configured",
    db: require("mongoose").connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ── 404 HANDLER ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ── GLOBAL ERROR HANDLER ────────────────────────────────────
app.use(errorHandler);

module.exports = app;