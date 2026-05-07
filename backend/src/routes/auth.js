// src/routes/auth.js
"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { validate, schemas } = require("../middlewares/validate");
const requireAuth = require("../middlewares/auth");

router.post("/register", validate(schemas.register), ctrl.register);
router.post("/login", validate(schemas.login), ctrl.login);
router.get("/me", requireAuth, ctrl.getMe);

module.exports = router;
