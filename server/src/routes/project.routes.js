const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isStudent = require("../middleware/isStudent.middleware");
const projectMember = require("../middleware/projectMember.middleware");

const {
  createProject,
  getAllProjects,
  getProjectById,
  getProjectProgress,
  updateProject,
  archiveProject,
  updateProjectGithubRepo,
} = require("../controllers/project.controller");

// CREATE PROJECT — Student only
router.post(
  "/",
  authMiddleware,
  isStudent,
  createProject
);

// GET ALL PROJECTS
router.get(
  "/",
  authMiddleware,
  getAllProjects
);

// UPDATE PROJECT GITHUB REPOSITORY
router.patch(
  "/:projectId/github",
  authMiddleware,
  projectMember,
  updateProjectGithubRepo
);

router.patch(
  "/:projectId",
  authMiddleware,
  projectMember,
  updateProject
);

router.delete(
  "/:projectId",
  authMiddleware,
  projectMember,
  archiveProject
);

// GET PROJECT PROGRESS
router.get(
  "/:id/progress",
  authMiddleware,
  projectMember,
  getProjectProgress
);

// GET SINGLE PROJECT
router.get(
  "/:id",
  authMiddleware,
  projectMember,
  getProjectById
);

module.exports = router;