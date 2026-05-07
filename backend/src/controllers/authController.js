// src/controllers/authController.js
"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// ── POST /api/v4/auth/register ───────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const user = await User.create({ name, email, phone, password });
    const token = signToken(user._id);

    logger.info(`[AUTH] Registered user: ${email}`);

    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v4/auth/login ──────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account deactivated" });
    }

    const token = signToken(user._id);
    logger.info(`[AUTH] Login: ${email}`);

    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v4/auth/me ──────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};