// src/routes/facilities.js
"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/facilityController");

router.get("/", ctrl.getFacilities);
router.get("/emergency", ctrl.getEmergency);

module.exports = router;