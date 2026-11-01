const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const {
  createStudent,
  createTeacher,
  createProject,
  getDashboard,
  getAllStudents,
  getAllTeachers,
  getAllProjects,
  updateStudent,
  updateTeacher,
  deleteStudent,
  deleteTeacher,
} = require("../controllers/admin.controller");

// =====================================================
// ALL ROUTES BELOW REQUIRE ADMIN AUTHENTICATION
// =====================================================

// Create
router.post(
  "/student",
  authMiddleware,
  isAdmin,
  createStudent
);

router.post(
  "/teacher",
  authMiddleware,
  isAdmin,
  createTeacher
);

router.post(
  "/project",
  authMiddleware,
  isAdmin,
  createProject
);

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  isAdmin,
  getDashboard
);

// Get
router.get(
  "/students",
  authMiddleware,
  isAdmin,
  getAllStudents
);

router.get(
  "/teachers",
  authMiddleware,
  isAdmin,
  getAllTeachers
);

router.get(
  "/projects",
  authMiddleware,
  isAdmin,
  getAllProjects
);

// Update
router.put(
  "/student/:id",
  authMiddleware,
  isAdmin,
  updateStudent
);

router.put(
  "/teacher/:id",
  authMiddleware,
  isAdmin,
  updateTeacher
);

// Delete
router.delete(
  "/student/:id",
  authMiddleware,
  isAdmin,
  deleteStudent
);

router.delete(
  "/teacher/:id",
  authMiddleware,
  isAdmin,
  deleteTeacher
);

module.exports = router;