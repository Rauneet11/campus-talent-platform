const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isStudent = require("../middleware/isStudent.middleware");

const studentController = require("../controllers/student.controller");

// Student Profile
router.get(
  "/profile",
  authMiddleware,
  isStudent,
  studentController.getProfile
);

module.exports = router;