// ============================================================
// RemoTriage v4 — AI Guidance Service
// src/services/aiService.js
//
// SUPPLEMENTARY layer only. The deterministic engine is the
// source of truth. AI guidance is explanatory and supportive —
// it NEVER changes triage.level and is NEVER called for EMERGENCY.
// ============================================================

"use strict";

const logger = require("../utils/logger");

// ── OFFLINE FALLBACK MESSAGES ────────────────────────────────
const FALLBACK_MESSAGES = {
  MODERATE: {
    en: "Please visit a health facility as recommended. A health worker will be able to assess you properly and recommend the right treatment.",
    sw: "Tafadhali tembelea kituo cha afya kama inavyopendekezwa. Mfanyakazi wa afya ataweza kukutathmini vizuri na kupendekeza matibabu sahihi.",
  },
  LOW: {
    en: "Monitor your symptoms and rest well. If your condition changes or worsens, don't hesitate to visit a health facility.",
    sw: "Fuatilia dalili zako na upumzike vizuri. Kama hali yako itabadilika au kuzidi, usisite kutembelea kituo cha afya.",
  },
};

// ── SYSTEM PROMPT ────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are a supportive health information assistant for RemoTriage, a WHO-aligned triage tool used in Kenya.

CRITICAL SAFETY RULES — you MUST follow these without exception:
1. You have already been told the triage level (MODERATE or LOW). You MUST NOT suggest the level should be different, higher, or lower.
2. You MUST NOT diagnose the patient or name a specific disease as a confirmed diagnosis.
3. You MUST NOT recommend specific prescription medications or dosages.
4. You MUST encourage the patient to follow the triage action and see a health worker.
5. You MUST NOT add alarming language for LOW results.
6. Keep your response to 2–3 warm, supportive sentences maximum.
7. Do not use bullet points, headers, or lists — write plain conversational sentences only.
8. Write in the requested language (English or Kiswahili).

Your role: provide a brief, warm, plain-language explanation of why the recommended action makes sense, and offer one simple self-care tip if appropriate for a LOW result.`;
}

// ── BUILD USER PROMPT ────────────────────────────────────────
function buildUserPrompt(triageResult, context) {
  const { county, ageGroup, isPregnant, language, symptoms } = context;
  const lang = language === "sw" ? "Kiswahili" : "English";

  return `Triage level: ${triageResult.level}
Suspected condition: ${triageResult.suspect}
Recommended action: ${triageResult.action?.en || ""}
Patient symptoms: ${symptoms.join(", ")}
Patient details: ${ageGroup}${isPregnant ? ", pregnant" : ""}${county ? `, ${county} county` : ""}

Please write a brief 2–3 sentence supportive message in ${lang} that explains why the patient should follow the recommended action. Remember: do not diagnose, do not change the triage level, do not name specific medicines.`;
}

// ── SANITISE AI RESPONSE ─────────────────────────────────────
// Strip any language that attempts to change the triage level
// or uses diagnostic framing.
function sanitiseResponse(text, triageLevel) {
  if (!text || typeof text !== "string") return "";

  // Block level-downgrade language
  const downgradePhrases = [
    /this (is|seems|appears) (not |un)?serious/i,
    /no need to (go|visit|see)/i,
    /you (don['']t|do not) need (to go|a doctor|hospital)/i,
    /nothing to worry about/i,
    /hakuna wasiwasi/i,
  ];
  for (const pattern of downgradePhrases) {
    if (pattern.test(text)) {
      logger.warn("[AI] Blocked downgrade language in response");
      return "";
    }
  }

  // Block explicit diagnosis language
  const diagnosisPhrases = [
    /you have (malaria|typhoid|meningitis|tuberculosis|HIV|pneumonia)/i,
    /this is definitely/i,
    /diagnosed with/i,
    /una (malaria|typhoid|nimonia)/i,
  ];
  for (const pattern of diagnosisPhrases) {
    if (pattern.test(text)) {
      logger.warn("[AI] Blocked diagnosis language in response");
      return "";
    }
  }

  // Trim and cap length
  return text.trim().slice(0, 800);
}

// ── MAIN FUNCTION ────────────────────────────────────────────
/**
 * Generate supplementary AI guidance for non-EMERGENCY results.
 * Safety contract: NEVER called for EMERGENCY (enforced in triageController).
 *
 * @param {Object} triageResult - result from triageEngine.runTriage()
 * @param {Object} context      - { county, ageGroup, isPregnant, language, symptoms }
 * @returns {Promise<string>}   - guidance text, or empty string on failure
 */
async function generateGuidance(triageResult, context) {
  // Double-check the safety contract
  if (triageResult.level === "EMERGENCY") {
    logger.error("[AI] SAFETY VIOLATION: generateGuidance called for EMERGENCY result — blocked");
    return "";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("[AI] ANTHROPIC_API_KEY not set — using offline fallback");
    return getOfflineFallbackGuidance(triageResult.level, context.language);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildUserPrompt(triageResult, context),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn(`[AI] API returned ${response.status}: ${errText}`);
      return getOfflineFallbackGuidance(triageResult.level, context.language);
    }

    const data = await response.json();
    const raw = data?.content?.[0]?.text || "";
    const sanitised = sanitiseResponse(raw, triageResult.level);

    if (!sanitised) {
      logger.warn("[AI] Response was empty or sanitised — using fallback");
      return getOfflineFallbackGuidance(triageResult.level, context.language);
    }

    return sanitised;
  } catch (err) {
    logger.warn(`[AI] Request failed: ${err.message}`);
    return getOfflineFallbackGuidance(triageResult.level, context.language);
  }
}

// ── OFFLINE FALLBACK ─────────────────────────────────────────
/**
 * Safe, static fallback used when the AI service is unavailable.
 * @param {string} level    - MODERATE | LOW
 * @param {string} language - en | sw
 * @returns {string}
 */
function getOfflineFallbackGuidance(level, language = "en") {
  const lang = language === "sw" ? "sw" : "en";
  const messages = FALLBACK_MESSAGES[level] || FALLBACK_MESSAGES.LOW;
  return messages[lang] || messages.en;
}

module.exports = { generateGuidance, getOfflineFallbackGuidance };
