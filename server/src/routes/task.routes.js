const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getProjectProgress,
  getMyTasks,
  getAllTasks,
} = require("../controllers/task.controller");

router.get("/my", authMiddleware, getMyTasks);
router.get("/all", authMiddleware, isAdmin, getAllTasks);

// Create task
router.post(
  "/",
  authMiddleware,
  createTask
);

// Get all tasks of project
router.get(
  "/project/:projectId",
  authMiddleware,
  getProjectTasks
);

// Get project progress
router.get(
  "/project/:projectId/progress",
  authMiddleware,
  getProjectProgress
);

// Get single task
router.get(
  "/:id",
  authMiddleware,
  getTaskById
);

// Update task
router.put(
  "/:id",
  authMiddleware,
  updateTask
);

// Delete task
router.delete(
  "/:id",
  authMiddleware,
  deleteTask
);

module.exports = router;