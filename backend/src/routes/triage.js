// src/routes/triage.js
"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/triageController");
const { validate, schemas } = require("../middlewares/validate");
const optionalAuth = require("../middlewares/optionalAuth");

// POST /api/v4/triage — Main triage endpoint (auth optional)
router.post("/", optionalAuth, validate(schemas.triage), ctrl.runTriageAssessment);

// GET /api/v4/triage/symptoms — Return valid symptom IDs
router.get("/symptoms", ctrl.getSymptoms);

// POST /api/v4/triage/feedback — Submit feedback
router.post("/feedback", validate(schemas.feedback), ctrl.submitFeedback);

// GET /api/v4/triage/:requestId — Get assessment by requestId
router.get("/:requestId", optionalAuth, ctrl.getAssessment);

module.exports = router;
