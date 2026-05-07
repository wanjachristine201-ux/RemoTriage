// src/middlewares/optionalAuth.js
// Attaches req.user if a valid token is present, but doesn't block without one
"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next();
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch {
    // Token invalid — continue as anonymous
  }
  next();
};