
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const projectMember = async (req, res, next) => {
  try {
    const projectId =
      req.params.projectId ||
      req.params.id ||
      req.body.projectId ||
      req.query.projectId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    if (!mongoose.isValidObjectId(projectId)) {
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

    if (!project.isActive) {
      return res.status(404).json({
        success: false,
        message: "Project is archived.",
      });
    }

    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role === "admin") {
      req.project = project;
      return next();
    }

    if (req.user.role === "student") {
      const student = await Student.findOne({
        userId: req.user._id,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }

      const studentId = student._id.toString();

      const isOwner =
        project.owner &&
        project.owner.toString() === studentId;

      const isMember = project.members.some(
        (member) => member.toString() === studentId
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this project.",
        });
      }

      req.project = project;
      req.student = student;
      return next();
    }

    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({
        userId: req.user._id,
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }

      const isMentor =
        project.mentor &&
        project.mentor.toString() === teacher._id.toString();

      if (!isMentor) {
        return res.status(403).json({
          success: false,
          message: "You are not the mentor of this project.",
        });
      }

      req.project = project;
      req.teacher = teacher;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this project.",
    });
  } catch (error) {
    console.error("Project Member Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};

module.exports = projectMember;
