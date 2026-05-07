// src/controllers/facilityController.js
"use strict";

const { getNearbyFacilities, getEmergencyReferral, KENYA_EMERGENCY_CONTACTS } = require("../services/facilityService");
const logger = require("../utils/logger");

// ── GET /api/v4/facilities ───────────────────────────────────
exports.getFacilities = async (req, res, next) => {
  const { county, type = "all", lat, lng, radius } = req.query;

  if (!county) {
    return res.status(400).json({ success: false, error: "county query parameter is required" });
  }

  try {
    const data = await getNearbyFacilities({
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      county,
      facilityType: type,
      radiusKm: radius ? parseInt(radius) : 25,
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    logger.error(`[FACILITIES] ${err.message}`);
    next(err);
  }
};

// ── GET /api/v4/emergency ────────────────────────────────────
exports.getEmergency = (req, res) => {
  res.json({
    success: true,
    emergency: KENYA_EMERGENCY_CONTACTS,
    message: "In a life-threatening emergency, call 0800 723 253 immediately.",
  });
};