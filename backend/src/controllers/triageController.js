// src/controllers/triageController.js
"use strict";

const { v4: uuidv4 } = require("uuid");
const { runTriage } = require("../services/triageEngine");
const { generateGuidance, getOfflineFallbackGuidance } = require("../services/aiService");
const { getNearbyFacilities, getEmergencyReferral, KENYA_EMERGENCY_CONTACTS } = require("../services/facilityService");
const Assessment = require("../models/Assessment");
const logger = require("../utils/logger");
const crypto = require("crypto");

// ── POST /api/v4/triage ──────────────────────────────────────
exports.runTriageAssessment = async (req, res, next) => {
  const requestId = uuidv4();

  try {
    const {
      symptoms, ageGroup, isPregnant, county, season,
      language, lat, lng, requestAI,
    } = req.body;

    // ── DETERMINISTIC TRIAGE (synchronous, no network) ───────
    const triageResult = runTriage({ symptoms, ageGroup, isPregnant, county, season });

    logger.info(
      `[TRIAGE] ${requestId} | Level: ${triageResult.level} | Rule: ${triageResult.ruleId} | ` +
      `County: ${county || "unknown"} | Symptoms: ${symptoms.join(",")}`
    );

    // ── NEARBY FACILITIES ────────────────────────────────────
    let facilityData = null;
    try {
      facilityData = await getNearbyFacilities({
        lat, lng, county,
        facilityType: triageResult.facilityType,
        radiusKm: parseInt(process.env.KMHFR_SEARCH_RADIUS_KM) || 25,
      });
    } catch (fErr) {
      logger.warn(`[FACILITIES] ${requestId} | Fallback: ${fErr.message}`);
      facilityData = getEmergencyReferral(county);
    }

    // ── AI GUIDANCE (non-emergency only, non-blocking) ───────
    // SAFETY RULE: AI is NEVER called for EMERGENCY results
    let aiGuidance = "";
    if (requestAI && triageResult.level !== "EMERGENCY") {
      try {
        aiGuidance = await generateGuidance(triageResult, {
          county, ageGroup, isPregnant, language, symptoms,
        });
        if (!aiGuidance) {
          aiGuidance = getOfflineFallbackGuidance(triageResult.level, language);
        }
      } catch (aiErr) {
        logger.warn(`[AI] ${requestId} | Guidance failed: ${aiErr.message}`);
        aiGuidance = getOfflineFallbackGuidance(triageResult.level, language);
      }
    }

    // ── PERSIST TO DB (non-blocking, best-effort) ────────────
    const ipHash = crypto
      .createHash("sha256")
      .update(req.ip || "unknown")
      .digest("hex")
      .slice(0, 16);

    Assessment.create({
      userId: req.user?._id || null,
      requestId,
      input: { symptoms, ageGroup, isPregnant, county, season, language, channel: "web" },
      triage: {
        level: triageResult.level,
        ruleId: triageResult.ruleId,
        suspect: triageResult.suspect,
        facilityType: triageResult.facilityType,
        callEmergency: triageResult.callEmergency,
      },
      aiGuidance,
      meta: { ipHash },
    }).catch((dbErr) =>
      logger.warn(`[DB] Assessment save failed: ${dbErr.message}`)
    );

    // ── RESPONSE ─────────────────────────────────────────────
    return res.json({
      success: true,
      requestId,
      triage: {
        level: triageResult.level,
        ruleId: triageResult.ruleId,
        suspect: triageResult.suspect,
        reason: triageResult.reason,
        action: triageResult.action,
        callEmergency: triageResult.callEmergency,
        facilityType: triageResult.facilityType,
        protocol: triageResult.protocol,
        otherFindings: triageResult.allMatchedRules,
        disclaimer: triageResult.disclaimer,
        malariaEndemicCounty: triageResult.malariaEndemicCounty,
      },
      aiGuidance: triageResult.level !== "EMERGENCY" ? aiGuidance : null,
      aiSafetyNote: "AI guidance is supplementary only. It cannot override the rule-based triage level.",
      facilities: facilityData,
      emergency: KENYA_EMERGENCY_CONTACTS,
      meta: {
        timestamp: triageResult.timestamp,
        version: triageResult.version,
        engine: triageResult.engine,
        requestId,
        language,
        county,
      },
    });
  } catch (err) {
    logger.error(`[TRIAGE] ${requestId} | Error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v4/triage/:requestId ─────────────────────────────
exports.getAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ requestId: req.params.requestId })
      .select("-meta.ipHash")
      .lean();

    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }

    // Only the owner or admin can view
    if (
      assessment.userId &&
      req.user &&
      assessment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    return res.json({ success: true, assessment });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v4/triage/feedback ─────────────────────────────
exports.submitFeedback = async (req, res, next) => {
  try {
    const { requestId, rating, comment, level } = req.body;

    await Assessment.findOneAndUpdate(
      { requestId },
      { feedback: { rating, comment, ratedAt: new Date() } }
    );

    logger.info(`[FEEDBACK] requestId=${requestId} rating=${rating} level=${level || "unknown"}`);
    return res.json({ success: true, message: "Thank you for your feedback." });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v4/symptoms ─────────────────────────────────────
exports.getSymptoms = (req, res) => {
  const { VALID_SYMPTOMS } = require("../services/triageEngine");
  res.json({ success: true, symptoms: [...VALID_SYMPTOMS], count: VALID_SYMPTOMS.size });
};