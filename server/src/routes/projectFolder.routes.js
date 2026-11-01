
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const projectMember = require("../middleware/projectMember.middleware");

const {
  createFolder,
  getProjectFolders,
  getFolderById,
  renameFolder,
  deleteFolder,
} = require("../controllers/projectFolder.controller");

router.post("/:projectId", authMiddleware, projectMember, createFolder);

router.get("/:projectId", authMiddleware, projectMember, getProjectFolders);

router.get("/:projectId/:id", authMiddleware, projectMember, getFolderById);

router.patch("/:projectId/:id", authMiddleware, projectMember, renameFolder);

router.delete("/:projectId/:id", authMiddleware, projectMember, deleteFolder);

module.exports = router;
