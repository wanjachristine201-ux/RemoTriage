// src/models/Assessment.js
"use strict";

const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    // Optional — null for anonymous/USSD assessments
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Unique identifier for this request (UUID)
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Input data
    input: {
      symptoms:   { type: [String], required: true },
      ageGroup:   { type: String, enum: ["infant", "child", "adult", "elderly"], default: "adult" },
      isPregnant: { type: Boolean, default: false },
      county:     { type: String, default: "" },
      season:     { type: String, enum: ["rainy", "dry"], default: "dry" },
      language:   { type: String, enum: ["en", "sw"], default: "en" },
      channel:    { type: String, enum: ["web", "ussd", "api"], default: "web" },
    },

    // Triage result (from deterministic engine)
    triage: {
      level:         { type: String, enum: ["LOW", "MODERATE", "EMERGENCY"], required: true },
      ruleId:        { type: String, required: true },
      suspect:       { type: String },
      facilityType:  { type: String },
      callEmergency: { type: Boolean, default: false },
    },

    // AI guidance (supplementary, optional)
    aiGuidance: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // User feedback (filled in later)
    feedback: {
      rating:    { type: Number, min: 1, max: 5 },
      comment:   { type: String, maxlength: 500 },
      ratedAt:   { type: Date },
    },

    // Metadata
    meta: {
      version:   { type: String, default: "4.0.0" },
      engine:    { type: String, default: "RemoTriage-Deterministic-v4" },
      ipHash:    { type: String }, // Store hash only, not raw IP
    },
  },
  {
    timestamps: true,
  }
);

// ── INDEXES ──────────────────────────────────────────────────
assessmentSchema.index({ userId: 1, createdAt: -1 });
assessmentSchema.index({ "triage.level": 1 });
assessmentSchema.index({ "input.county": 1 });
assessmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);