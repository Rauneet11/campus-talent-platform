const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isTeacher = require("../middleware/isTeacher.middleware");

const teacherController = require("../controllers/teacher.controller");

// Teacher Profile
router.get(
  "/",
  authMiddleware,
  teacherController.getAllTeachers
);

router.get(
  "/profile", authMiddleware,isTeacher,teacherController.getProfile
);

module.exports = router;