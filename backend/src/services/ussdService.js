// ============================================================
// RemoTriage v4 — USSD Service
// src/services/ussdService.js
//
// Africa's Talking USSD handler. Multi-step session manager.
// Dial *384# from any Kenyan phone. Works offline, no data cost.
// Responses prefixed CON (continue) or END (terminate session).
// ============================================================

"use strict";

const { runTriage } = require("./triageEngine");
const logger = require("../utils/logger");

// ── COUNTIES (for step 2 selection) ─────────────────────────
const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu",
  "Kiambu", "Nyeri", "Meru", "Machakos", "Kisii",
  "Kakamega", "Kilifi", "Homa Bay", "Migori", "Bungoma",
  "Siaya", "Busia", "Vihiga", "Kakamega", "Turkana",
  "Garissa", "Wajir", "Mandera", "Laikipia", "Narok",
  "Kajiado", "Kericho", "Nyamira", "Nandi", "Trans Nzoia",
];

// ── SYMPTOM GROUPS (for step 3 main menu) ───────────────────
const SYMPTOM_GROUPS = [
  {
    label: "Fever / Homa",
    symptoms: ["fever"],
    followUp: "FEVER_FOLLOWUP",
  },
  {
    label: "Breathing difficulty / Ugumu kupumua",
    symptoms: ["difficulty_breathing"],
    followUp: "BREATHING_FOLLOWUP",
  },
  {
    label: "Unconscious / Seizures",
    symptoms: ["altered_consciousness", "convulsions"],
    followUp: null,
  },
  {
    label: "Diarrhoea / Vomiting",
    symptoms: ["diarrhea", "vomiting"],
    followUp: "GI_FOLLOWUP",
  },
  {
    label: "Cough (2+ weeks) / Night sweats",
    symptoms: ["persistent_cough", "night_sweats"],
    followUp: "TB_FOLLOWUP",
  },
  {
    label: "Pregnancy concern",
    symptoms: ["vaginal_bleeding"],
    followUp: "PREGNANCY_FOLLOWUP",
  },
  {
    label: "Headache / Stiff neck",
    symptoms: ["severe_headache", "stiff_neck"],
    followUp: null,
  },
  {
    label: "General weakness / Other",
    symptoms: ["fatigue"],
    followUp: "GENERAL_FOLLOWUP",
  },
];

// ── FOLLOW-UP QUESTION SETS ──────────────────────────────────
const FOLLOW_UPS = {
  FEVER_FOLLOWUP: {
    question: "How severe is the fever?\n1. High fever (very hot)\n2. Mild fever\n3. Fever + confusion/fits\n0. Back",
    map: {
      "1": ["high_fever", "chills"],
      "2": ["mild_fever"],
      "3": ["high_fever", "confusion", "severe_headache"],
    },
  },
  BREATHING_FOLLOWUP: {
    question: "Any other symptoms?\n1. Chest pain\n2. Loss of consciousness\n3. Breathing difficulty only\n0. Back",
    map: {
      "1": ["chest_pain"],
      "2": ["altered_consciousness"],
      "3": [],
    },
  },
  GI_FOLLOWUP: {
    question: "Can the patient drink fluids?\n1. Yes, drinking normally\n2. Drinking very little\n3. Cannot drink at all\n0. Back",
    map: {
      "1": [],
      "2": [],
      "3": ["cannot_drink", "no_urination"],
    },
  },
  TB_FOLLOWUP: {
    question: "Other symptoms?\n1. Weight loss + night sweats\n2. Recurrent infections\n3. Cough only\n0. Back",
    map: {
      "1": ["weight_loss", "night_sweats"],
      "2": ["weight_loss", "recurrent_infections"],
      "3": [],
    },
  },
  PREGNANCY_FOLLOWUP: {
    question: "Pregnancy symptom?\n1. Heavy bleeding\n2. Severe abdominal pain\n3. Fits / seizures\n0. Back",
    map: {
      "1": ["vaginal_bleeding"],
      "2": ["severe_abdominal_pain"],
      "3": ["convulsions"],
    },
  },
  GENERAL_FOLLOWUP: {
    question: "Main complaint?\n1. Fatigue + weight loss\n2. Fatigue + sore throat / cough\n3. Fatigue only\n0. Back",
    map: {
      "1": ["fatigue", "weight_loss"],
      "2": ["fatigue", "sore_throat", "mild_cough"],
      "3": ["fatigue"],
    },
  },
};

// ── COUNTY SELECTOR (page 1 and 2) ──────────────────────────
function countyMenu(page = 0) {
  const pageSize = 5;
  const start = page * pageSize;
  const slice = COUNTIES.slice(start, start + pageSize);
  let text = "CON Select county (page " + (page + 1) + "):\n";
  slice.forEach((c, i) => {
    text += `${start + i + 1}. ${c}\n`;
  });
  if (start + pageSize < COUNTIES.length) {
    text += `${start + pageSize + 1}. Next page »`;
  }
  return text;
}

// ── FORMAT RESULT FOR USSD (max ~160 chars) ──────────────────
function formatResult(triageResult, county) {
  const { level, suspect, action } = triageResult;
  const shortAction = action?.en?.slice(0, 100) || "Visit a health facility.";

  if (level === "EMERGENCY") {
    return (
      `END 🚨 EMERGENCY\n${suspect}\n\n${shortAction}\n\nCall FREE: 0800 723 253`
    );
  } else if (level === "MODERATE") {
    return (
      `END ⚠️ MODERATE\n${suspect}\n\n${shortAction}\n\nNearest facility: see county referral`
    );
  } else {
    return (
      `END ✅ LOW RISK\n${suspect}\n\n${shortAction}`
    );
  }
}

// ── SESSION STORE ────────────────────────────────────────────
// In-memory store keyed by sessionId. Entries expire after 10 min.
const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000;

function getSession(sessionId) {
  const sess = sessions.get(sessionId);
  if (!sess) return null;
  if (Date.now() - sess.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return sess;
}

function saveSession(sessionId, data) {
  sessions.set(sessionId, { ...data, createdAt: Date.now() });
}

// Periodic cleanup of expired sessions (runs every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [id, sess] of sessions.entries()) {
    if (now - sess.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);

// ── MAIN handleUSSD FUNCTION ─────────────────────────────────
/**
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.text        - accumulated USSD input e.g. "1*2*3"
 * @param {string} params.phoneNumber
 * @param {string} params.networkCode
 * @returns {string} Africa's Talking response (CON ... or END ...)
 */
function handleUSSD({ sessionId, text, phoneNumber, networkCode }) {
  // Parse navigation steps
  const steps = text ? text.split("*").filter(Boolean) : [];
  const step = steps.length; // 0 = fresh session

  logger.info(`[USSD] SID=${sessionId} Step=${step} Input="${text}"`);

  // ── STEP 0: Age group ────────────────────────────────────
  if (step === 0) {
    saveSession(sessionId, {});
    return (
      "CON Welcome to RemoTriage\n" +
      "Safe health guidance — any Kenyan phone.\n\n" +
      "Select age group:\n" +
      "1. Infant (under 1 year)\n" +
      "2. Child (1–12 years)\n" +
      "3. Adult\n" +
      "4. Elderly (60+)"
    );
  }

  const ageInput = steps[0];
  const ageMap = { "1": "infant", "2": "child", "3": "adult", "4": "elderly" };
  const ageGroup = ageMap[ageInput];

  if (!ageGroup) {
    return "END Invalid selection. Please redial *384# and try again.";
  }

  // ── STEP 1: County selection ─────────────────────────────
  if (step === 1) {
    return countyMenu(0);
  }

  const countyInput = parseInt(steps[1], 10);

  // Handle "next page" (value 6 when pageSize=5 => index 5 = page 1)
  if (countyInput === COUNTIES.length + 1 || (countyInput > 5 && step === 2)) {
    return countyMenu(1);
  }

  const county = COUNTIES[countyInput - 1] || "Nairobi";

  // ── STEP 2: Main symptom ─────────────────────────────────
  if (step === 2) {
    let menu = "CON Select main symptom:\n";
    SYMPTOM_GROUPS.forEach((g, i) => {
      menu += `${i + 1}. ${g.label}\n`;
    });
    return menu;
  }

  const symptomGroupInput = parseInt(steps[2], 10);
  const selectedGroup = SYMPTOM_GROUPS[symptomGroupInput - 1];

  if (!selectedGroup) {
    return "END Invalid selection. Please redial *384# and try again.";
  }

  // ── STEP 3: Follow-up question (if exists) ───────────────
  if (step === 3 && selectedGroup.followUp) {
    const followUp = FOLLOW_UPS[selectedGroup.followUp];
    if (followUp) {
      return `CON ${followUp.question}`;
    }
  }

  // ── STEP 4 (or 3 if no follow-up): Run triage ───────────
  let symptoms = [...selectedGroup.symptoms];

  if (selectedGroup.followUp && steps[3]) {
    const followUp = FOLLOW_UPS[selectedGroup.followUp];
    const extraSymptoms = followUp?.map[steps[3]] || [];
    if (steps[3] === "0") {
      // User wants to go back — restart symptom selection
      let menu = "CON Select main symptom:\n";
      SYMPTOM_GROUPS.forEach((g, i) => {
        menu += `${i + 1}. ${g.label}\n`;
      });
      return menu;
    }
    symptoms = [...symptoms, ...extraSymptoms];
  }

  // Pregnancy check for obstetric group
  const isPregnant = selectedGroup.symptoms.includes("vaginal_bleeding") ||
    selectedGroup.symptoms.includes("severe_abdominal_pain");

  // Run the deterministic engine
  try {
    const triageResult = runTriage({
      symptoms,
      ageGroup,
      isPregnant,
      county,
      season: "dry", // USSD doesn't collect season
    });

    logger.info(
      `[USSD] Result | SID=${sessionId} | Level=${triageResult.level} | ` +
      `Rule=${triageResult.ruleId} | Phone=${phoneNumber}`
    );

    return formatResult(triageResult, county);
  } catch (err) {
    logger.error(`[USSD] Triage error: ${err.message}`);
    return "END An error occurred. Please try again: *384#\nHelp: 0800 723 253";
  }
}

module.exports = { handleUSSD };
