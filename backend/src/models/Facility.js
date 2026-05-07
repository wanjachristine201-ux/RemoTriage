// src/models/Facility.js
"use strict";

const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    county: { type: String, required: true, trim: true, index: true },
    subcounty: { type: String, trim: true },
    level: {
      type: String,
      enum: ["L2", "L3", "L4", "L5", "L6"],
      required: true,
    },
    type: {
      type: String,
      enum: ["hospital", "health_centre", "dispensary", "clinic"],
      default: "hospital",
    },
    services: [String], // e.g. ["maternity", "emergency", "tb", "hiv"]
    phone: { type: String, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    isPublic: { type: Boolean, default: true },
    is24Hours: { type: Boolean, default: false },
    kmhfrCode: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for nearby queries
facilitySchema.index({ location: "2dsphere" });
facilitySchema.index({ county: 1, level: 1 });

module.exports = mongoose.model("Facility", facilitySchema);