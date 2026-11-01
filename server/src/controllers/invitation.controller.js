const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const Student = require("../models/Student");
const mongoose = require("mongoose");

exports.getAllInvitations = async (_req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate("sender", "username role")
      .populate("receiver", "name rollNo branch")
      .populate("projectId", "title status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    console.error("Get All Invitations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load invitations.",
    });
  }
};

class InvitationWorkflowError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

exports.getInvitationCandidates = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (req.user.role === "admin") {
      if (project.projectType !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Admins can invite students only to admin-created projects.",
        });
      }
    } else if (req.user.role === "student") {
      const currentStudent = await Student.findOne({ userId: req.user._id });
      if (
        project.projectType !== "Student" ||
        !currentStudent ||
        project.owner?.toString() !== currentStudent._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Only the project owner can invite collaborators.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to invite students.",
      });
    }

    if (!project.isActive || project.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This project is no longer accepting collaborators.",
      });
    }

    const currentTeamSize =
      project.members.length + (project.projectType === "Student" && project.owner ? 1 : 0);
    const pendingInvitations = await Invitation.find({
      projectId: project._id,
      status: "Pending",
    }).select("receiver");

    if (currentTeamSize + pendingInvitations.length >= project.teamSize) {
      return res.status(200).json({ success: true, data: [] });
    }

    const excludedStudentIds = [
      ...project.members.map((member) => member.toString()),
      ...(project.owner ? [project.owner.toString()] : []),
    ];
    excludedStudentIds.push(
      ...pendingInvitations.map((invitation) => invitation.receiver.toString())
    );

    const students = await Student.find({
      _id: { $nin: excludedStudentIds },
    })
      .select("name rollNo branch year")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get Invitation Candidates Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load invitation candidates.",
    });
  }
};

exports.getProjectInvitations = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    let authorized = false;
    if (req.user.role === "admin" && project.projectType === "Admin") {
      authorized = true;
    } else if (req.user.role === "student" && project.projectType === "Student") {
      const student = await Student.findOne({ userId: req.user._id });
      authorized = Boolean(
        student && project.owner?.toString() === student._id.toString(),
      );
    }
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Only this project's owner or an authorized admin can view its invitations.",
      });
    }

    const invitations = await Invitation.find({ projectId })
      .populate("receiver", "name rollNo branch")
      .populate("sender", "username role")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    console.error("Get Project Invitations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load project invitations.",
    });
  }
};

// ==========================================
// SEND INVITATION
// ==========================================

exports.sendInvitation = async (req, res) => {
  try {
    const { projectId, studentId, message } = req.body;

    // ------------------------------------------
    // Validate request
    // ------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid project and student IDs are required.",
      });
    }
    if (message !== undefined && (typeof message !== "string" || message.length > 300)) {
      return res.status(400).json({
        success: false,
        message: "Invitation message must be text with at most 300 characters.",
      });
    }

    // ------------------------------------------
    // Find project
    // ------------------------------------------

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ------------------------------------------
    // Check project status
    // ------------------------------------------

    if (!project.isActive || project.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This project is no longer accepting collaborators.",
      });
    }

    if (project.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This project has been cancelled.",
      });
    }

    // ------------------------------------------
    // Find target student
    // ------------------------------------------

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student to invite not found.",
      });
    }

    // ------------------------------------------
    // Find current student's profile
    // ------------------------------------------

    let currentStudent = null;

    if (req.user.role === "student") {
      currentStudent = await Student.findOne({
        userId: req.user._id,
      });

      if (!currentStudent) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }
    }

    // ------------------------------------------
    // Determine who is allowed to invite
    // ------------------------------------------

    if (req.user.role === "admin") {
      // Admin can invite students to Admin-created projects.
      if (project.projectType !== "Admin") {
        return res.status(403).json({
          success: false,
          message:
            "Admin can send invitations only for Admin-created projects.",
        });
      }
    } else if (req.user.role === "student") {
      // Only owner can invite for Student-created projects.
      if (project.projectType !== "Student") {
        return res.status(403).json({
          success: false,
          message:
            "Students can send invitations only for Student-created projects.",
        });
      }

      if (
        !project.owner ||
        project.owner.toString() !== currentStudent._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Only the project owner can send invitations.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send invitations.",
      });
    }

    // ------------------------------------------
    // Student project owner cannot invite himself
    // ------------------------------------------

    if (
      project.projectType === "Student" &&
      project.owner &&
      project.owner.toString() === student._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot invite himself.",
      });
    }

    // ------------------------------------------
    // Check if student is already a collaborator
    // ------------------------------------------

    const alreadyMember = project.members.some(
      (member) => member.toString() === student._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "Student is already a project collaborator.",
      });
    }

    // ------------------------------------------
    // Calculate current team size
    // ------------------------------------------

    let currentTeamSize = project.members.length;

    // For Student-created projects, owner is also
    // part of the team even though owner is stored
    // separately from members.
    if (project.projectType === "Student" && project.owner) {
      currentTeamSize += 1;
    }

    if (currentTeamSize >= project.teamSize) {
      return res.status(400).json({
        success: false,
        message: "Project team is already full.",
      });
    }

    // ------------------------------------------
    // Check existing pending invitation
    // ------------------------------------------

    const existingInvitation = await Invitation.findOne({
      projectId: project._id,
      receiver: student._id,
      status: "Pending",
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: "Invitation already sent to this student.",
      });
    }

    const pendingInvitationCount = await Invitation.countDocuments({
      projectId: project._id,
      status: "Pending",
    });

    if (currentTeamSize + pendingInvitationCount >= project.teamSize) {
      return res.status(400).json({
        success: false,
        message: "There are already enough pending invitations to fill this project team.",
      });
    }

    // ------------------------------------------
    // Create invitation
    // ------------------------------------------

    const invitation = await Invitation.create({
      projectId: project._id,
      sender: req.user._id,
      receiver: student._id,
      message: message || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully.",
      data: invitation,
    });
  } catch (error) {
    // Duplicate index error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A pending invitation already exists for this student.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// GET MY INVITATIONS
// ==========================================

exports.getMyInvitations = async (req, res) => {
  try {
    const student = await Student.findOne({
      userId: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const invitations = await Invitation.find({
      receiver: student._id,
    })
      .populate({
        path: "projectId",
        populate: [
          {
            path: "owner",
            select: "name rollNo branch year skills cgpa",
          },
          {
            path: "mentor",
            select: "name employeeId department designation",
          },
        ],
      })
      .populate({
        path: "sender",
        select: "username role",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// ACCEPT INVITATION
// ==========================================

exports.acceptInvitation = async (req, res) => {
  let session;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID.",
      });
    }

    session = await mongoose.startSession();
    let invitationData;
    let wasAlreadyMember = false;
    await session.withTransaction(async () => {
      const student = await Student.findOne({ userId: req.user._id }).session(session);
      if (!student) {
        throw new InvitationWorkflowError(404, "Student profile not found.");
      }

      const invitation = await Invitation.findById(id).session(session);
      if (!invitation) {
        throw new InvitationWorkflowError(404, "Invitation not found.");
      }
      if (invitation.receiver.toString() !== student._id.toString()) {
        throw new InvitationWorkflowError(403, "You cannot respond to this invitation.");
      }
      if (invitation.status !== "Pending") {
        throw new InvitationWorkflowError(400, `Invitation is already ${invitation.status}.`);
      }

      const project = await Project.findById(invitation.projectId).session(session);
      if (!project) {
        throw new InvitationWorkflowError(404, "Project no longer exists.");
      }
      if (!project.isActive || project.status === "Completed" || project.status === "Cancelled") {
        throw new InvitationWorkflowError(400, "This project is no longer accepting collaborators.");
      }

      wasAlreadyMember = project.members.some(
        (member) => member.toString() === student._id.toString(),
      );
      if (!wasAlreadyMember) {
        const currentTeamSize =
          project.members.length +
          (project.projectType === "Student" && project.owner ? 1 : 0);
        if (currentTeamSize >= project.teamSize) {
          throw new InvitationWorkflowError(400, "Project team is already full.");
        }
        project.members.addToSet(student._id);
        await project.save({ session });
      }

      invitation.status = "Accepted";
      invitation.responseDate = new Date();
      await invitation.save({ session });
      invitationData = invitation.toObject();
    });

    return res.status(200).json({
      success: true,
      message: wasAlreadyMember
        ? "You are already a collaborator on this project."
        : "Invitation accepted. You are now a collaborator.",
      data: invitationData,
    });
  } catch (error) {
    if (error instanceof InvitationWorkflowError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    if (error.code === 20 || error.message?.includes("Transaction numbers are only allowed")) {
      return res.status(503).json({
        success: false,
        message: "Invitation acceptance requires MongoDB transaction support. Configure MongoDB as a replica set and retry.",
      });
    }
    console.error("Accept Invitation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to accept invitation.",
    });
  } finally {
    if (session) await session.endSession();
  }
};

// ==========================================
// REJECT INVITATION
// ==========================================

exports.rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID.",
      });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const invitation = await Invitation.findOne({
      _id: id,
      receiver: student._id,
    });
    if (!invitation) {
      const existingInvitation = await Invitation.findById(id).select("receiver");
      if (!existingInvitation) {
        return res.status(404).json({
          success: false,
          message: "Invitation not found.",
        });
      }
      return res.status(403).json({
        success: false,
        message: "You cannot respond to this invitation.",
      });
    }

    if (invitation.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Invitation is already ${invitation.status}.`,
      });
    }

    const rejectedInvitation = await Invitation.findOneAndUpdate(
      { _id: id, receiver: student._id, status: "Pending" },
      { $set: { status: "Rejected", responseDate: new Date() } },
      { new: true },
    );
    if (!rejectedInvitation) {
      const latestInvitation = await Invitation.findById(id).select("status");
      return res.status(400).json({
        success: false,
        message: `Invitation is already ${latestInvitation?.status || "processed"}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation rejected.",
      data: rejectedInvitation,
    });
  } catch (error) {
    console.error("Reject Invitation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reject invitation.",
    });
  }
};