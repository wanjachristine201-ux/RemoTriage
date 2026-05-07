// src/middlewares/validate.js
"use strict";

const Joi = require("joi");

// ── VALID SYMPTOM IDs (must match triageEngine) ──────────────
const VALID_SYMPTOMS = [
  "fever", "high_fever", "mild_fever", "chills", "night_sweats",
  "difficulty_breathing", "cough", "mild_cough", "persistent_cough", "chest_pain",
  "severe_headache", "mild_headache", "stiff_neck", "convulsions",
  "altered_consciousness", "confusion", "blurred_vision", "lethargy",
  "abdominal_pain", "severe_abdominal_pain", "diarrhea", "vomiting",
  "cannot_drink", "no_urination",
  "fatigue", "weight_loss", "recurrent_infections", "face_swelling",
  "runny_nose", "sore_throat", "vaginal_bleeding", "not_feeding",
];

// ── TRIAGE SCHEMA ────────────────────────────────────────────
const triageSchema = Joi.object({
  symptoms: Joi.array()
    .items(Joi.string().valid(...VALID_SYMPTOMS))
    .min(1)
    .required()
    .messages({
      "array.base": "Symptoms must be an array",
      "array.min": "At least one symptom is required",
      "any.required": "Symptoms are required",
    }),

  ageGroup: Joi.string()
    .valid("infant", "child", "adult", "elderly")
    .default("adult"),

  isPregnant: Joi.boolean().default(false),

  county: Joi.string().max(50).allow("").default(""),

  season: Joi.string()
    .valid("rainy", "dry")
    .default("dry"),

  language: Joi.string()
    .valid("en", "sw")
    .default("en"),

  lat: Joi.number()
    .min(-90)
    .max(90)
    .allow(null),

  lng: Joi.number()
    .min(-180)
    .max(180)
    .allow(null),

  requestAI: Joi.boolean().default(true),
});

// ── AUTH SCHEMAS ─────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),

  email: Joi.string()
    .email()
    .lowercase()
    .required(),

  phone: Joi.string()
    .pattern(/^\+?[0-9]{9,15}$/)
    .optional(),

  password: Joi.string()
    .min(8)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required(),

  password: Joi.string().required(),
});

// ── FEEDBACK SCHEMA ──────────────────────────────────────────
const feedbackSchema = Joi.object({
  requestId: Joi.string().uuid().required(),

  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required(),

  comment: Joi.string()
    .max(500)
    .allow("")
    .optional(),

  level: Joi.string()
    .valid("LOW", "MODERATE", "HIGH", "EMERGENCY")
    .optional(),
});

// ── VALIDATION MIDDLEWARE FACTORY ────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Request body is missing",
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.details.map((d) => ({
          message: d.message,
          path: d.path,
        })),
      });
    }

    req.body = value; // sanitized + validated
    next();
  };
}

// ── EXPORTS ──────────────────────────────────────────────────
module.exports = {
  validate,
  schemas: {
    triage: triageSchema,
    register: registerSchema,
    login: loginSchema,
    feedback: feedbackSchema,
  },
};