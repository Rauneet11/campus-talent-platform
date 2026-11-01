const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const projectMember = require("../middleware/projectMember.middleware");
const projectFileMember = require("../middleware/projectFileMember.middleware");
const upload = require("../middleware/upload.middleware");

const {
  uploadProjectFile,
  getProjectFiles,
  getProjectFileById,
  deleteProjectFile,
} = require("../controllers/projectFile.controller");

// ==========================================
// UPLOAD FILE
// ==========================================

router.post(
  "/upload",
  authMiddleware,
  projectMember,
  upload.single("file"),
  uploadProjectFile
);

// ==========================================
// GET PROJECT FILES
// ==========================================

router.get(
  "/project/:projectId",
  authMiddleware,
  projectMember,
  getProjectFiles
);

// ==========================================
// GET SINGLE FILE
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  projectFileMember,
  getProjectFileById
);

// ==========================================
// DELETE FILE
// ==========================================

router.delete(
  "/:id/project/:projectId",
  authMiddleware,
  projectMember,
  deleteProjectFile
);

module.exports = router;