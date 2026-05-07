// src/controllers/ussdController.js
"use strict";

const { handleUSSD } = require("../services/ussdService");
const logger = require("../utils/logger");

// ── POST /api/v4/ussd ────────────────────────────────────────
// Africa's Talking sends form-encoded POST data
exports.handleRequest = (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text, networkCode } = req.body;

  if (!sessionId) {
    logger.warn("[USSD] Request missing sessionId");
    return res.status(400).send("END Invalid USSD request");
  }

  logger.info(
    `[USSD] Inbound | SID: ${sessionId} | Phone: ${phoneNumber} | ` +
    `Text: "${text}" | Network: ${networkCode}`
  );

  try {
    const response = handleUSSD({ sessionId, text, phoneNumber, networkCode });
    res.set("Content-Type", "text/plain");
    return res.send(response);
  } catch (err) {
    logger.error(`[USSD] Fatal error: ${err.message}`);
    res.set("Content-Type", "text/plain");
    return res.send("END Hitilafu / Error. Jaribu tena / Try again: *384#\nMsaada: 0800 723 253");
  }
};