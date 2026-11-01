
const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

// Login
router.post("/login", authController.login);

// Initial Admin Setup
router.post("/setup-admin", authController.setupAdmin);

module.exports = router;

