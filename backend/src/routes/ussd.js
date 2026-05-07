// src/routes/ussd.js
"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/ussdController");

router.post("/", ctrl.handleRequest);

module.exports = router;