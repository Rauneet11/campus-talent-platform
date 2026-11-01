const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const isStudent = require("../middleware/isStudent.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");

const {
  getInvitationCandidates,
  getProjectInvitations,
  getAllInvitations,
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} = require("../controllers/invitation.controller");

router.get("/all", authMiddleware, isAdmin, getAllInvitations);

router.get(
  "/project/:projectId",
  authMiddleware,
  getProjectInvitations
);

router.get(
  "/project/:projectId/candidates",
  authMiddleware,
  getInvitationCandidates
);

// ==========================================
// SEND INVITATION
// ==========================================

router.post(
  "/",
  authMiddleware,
  sendInvitation
);

// ==========================================
// GET MY RECEIVED INVITATIONS
// ==========================================

router.get(
  "/my",
  authMiddleware,
  isStudent,
  getMyInvitations
);

// ==========================================
// ACCEPT INVITATION
// ==========================================

router.put(
  "/:id/accept",
  authMiddleware,
  isStudent,
  acceptInvitation
);

// ==========================================
// REJECT INVITATION
// ==========================================

router.put(
  "/:id/reject",
  authMiddleware,
  isStudent,
  rejectInvitation
);

module.exports = router;