const mongoose = require("mongoose");

const Project = require("../models/Project");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Task = require("../models/Task");
const Invitation = require("../models/Invitation");

// ==========================================
// CREATE PROJECT BY STUDENT
// ==========================================

exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      requiredSkills,
      teamSize,
      mentor,
      startDate,
      endDate,
    } = req.body;

    // ==========================================
    // 1. VALIDATE REQUIRED FIELDS
    // ==========================================

    if (
      !title ||
      !description ||
      !category ||
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0 ||
      teamSize === undefined ||
      teamSize === null ||
      !mentor ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    // ==========================================
    // 2. VALIDATE TITLE
    // ==========================================

    const cleanTitle = title.trim();

    if (cleanTitle.length < 5 || cleanTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Project title must be between 5 and 100 characters.",
      });
    }

    // ==========================================
    // 3. VALIDATE DESCRIPTION
    // ==========================================

    const cleanDescription = description.trim();

    if (cleanDescription.length < 20) {
      return res.status(400).json({
        success: false,
        message:
          "Project description must contain at least 20 characters.",
      });
    }

    // ==========================================
    // 4. VALIDATE TEAM SIZE
    // ==========================================

    const parsedTeamSize = Number(teamSize);

    if (
      !Number.isInteger(parsedTeamSize) ||
      parsedTeamSize < 2 ||
      parsedTeamSize > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Team size must be an integer between 2 and 10.",
      });
    }

    // ==========================================
    // 5. VALIDATE MENTOR ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(mentor)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID.",
      });
    }

    // ==========================================
    // 6. VALIDATE DATES
    // ==========================================

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    // ==========================================
    // 7. CLEAN REQUIRED SKILLS
    // ==========================================

    const cleanSkills = requiredSkills
      .filter((skill) => typeof skill === "string")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    if (cleanSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid required skill is required.",
      });
    }

    // ==========================================
    // 8. CHECK MENTOR
    // ==========================================

    const teacher = await Teacher.findById(mentor);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found.",
      });
    }

    // ==========================================
    // 9. FIND LOGGED-IN STUDENT
    // ==========================================

    const student = await Student.findOne({
      userId: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // ==========================================
    // 10. CHECK DUPLICATE PROJECT TITLE
    // ==========================================

    const existingProject = await Project.findOne({
      title: cleanTitle,
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: "Project with this title already exists.",
      });
    }

    // ==========================================
    // 11. CREATE PROJECT
    // ==========================================

    const project = await Project.create({
      title: cleanTitle,
      description: cleanDescription,
      category,
      requiredSkills: cleanSkills,
      teamSize: parsedTeamSize,

      // Student is the project owner
      owner: student._id,

      // Teacher mentor
      mentor: teacher._id,

      // Admin did not create this project
      createdBy: null,

      // Identify creator type
      projectType: "Student",

      // No collaborators initially
      members: [],

      startDate: start,
      endDate: end,

      status: "Open",
      isActive: true,
    });

    // ==========================================
    // 12. POPULATE RESPONSE
    // ==========================================

    const createdProject = await Project.findById(project._id)
      .populate("owner")
      .populate("mentor");

    // ==========================================
    // 13. RETURN RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: createdProject,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// GET ALL PROJECTS
// ==========================================

exports.getAllProjects = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id }).select("_id");
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }
      filter.$or = [{ owner: student._id }, { members: student._id }];
    } else if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: req.user._id }).select("_id");
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }
      filter.mentor = teacher._id;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view projects.",
      });
    }

    const projects = await Project.find(filter)
      .populate("owner")
      .populate("mentor")
      .populate("members")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Get All Projects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = req.project;
    const isOwner =
      req.student &&
      project.owner &&
      project.owner.toString() === req.student._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or an admin can edit this project.",
      });
    }

    const { title, description, category, requiredSkills, teamSize } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 5 || title.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Project title must be between 5 and 100 characters.",
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 20) {
        return res.status(400).json({
          success: false,
          message: "Project description must contain at least 20 characters.",
        });
      }
      updates.description = description.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project category is required.",
        });
      }
      updates.category = category.trim();
    }

    if (requiredSkills !== undefined) {
      const skills = Array.isArray(requiredSkills)
        ? requiredSkills.filter((skill) => typeof skill === "string").map((skill) => skill.trim()).filter(Boolean)
        : [];
      if (!skills.length) {
        return res.status(400).json({
          success: false,
          message: "At least one required skill is required.",
        });
      }
      updates.requiredSkills = skills;
    }

    if (teamSize !== undefined) {
      const parsedTeamSize = Number(teamSize);
      const pendingInvitations = await Invitation.countDocuments({
        projectId: project._id,
        status: "Pending",
      });
      const currentTeamSize =
        project.members.length +
        pendingInvitations +
        (project.projectType === "Student" && project.owner ? 1 : 0);
      if (
        !Number.isInteger(parsedTeamSize) ||
        parsedTeamSize < 2 ||
        parsedTeamSize > 10 ||
        parsedTeamSize < currentTeamSize
      ) {
        return res.status(400).json({
          success: false,
          message: `Team size must be between ${Math.max(2, currentTeamSize)} and 10.`,
        });
      }
      updates.teamSize = parsedTeamSize;
    }

    Object.assign(project, updates);
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: project,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project.",
    });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = req.project;
    const isOwner =
      req.student &&
      project.owner &&
      project.owner.toString() === req.student._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or an admin can archive this project.",
      });
    }

    project.isActive = false;
    project.status = "On Hold";
    await project.save();
    await Invitation.updateMany(
      { projectId: project._id, status: "Pending" },
      { status: "Rejected", responseDate: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "Project archived successfully.",
    });
  } catch (error) {
    console.error("Archive Project Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to archive project.",
    });
  }
};

// ==========================================
// UPDATE PROJECT GITHUB REPOSITORY
// ==========================================

exports.updateProjectGithubRepo = async (req, res) => {
  try {
    const { githubRepoUrl } = req.body;
    const project = req.project;

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Only the project owner or an admin can change the repository.
    const isAdmin = req.user.role === "admin";

    const isOwner =
      req.student &&
      project.owner &&
      project.owner.toString() === req.student._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner or admin can update the repository.",
      });
    }

    // null or an empty string removes the repository link.
    if (
      githubRepoUrl !== null &&
      githubRepoUrl !== undefined &&
      typeof githubRepoUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "GitHub repository URL must be a string.",
      });
    }

    const cleanUrl =
      typeof githubRepoUrl === "string"
        ? githubRepoUrl.trim().replace(/\/+$/, "")
        : "";

    if (
      cleanUrl &&
      !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(cleanUrl)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid GitHub repository URL, such as https://github.com/owner/repository.",
      });
    }

    project.githubRepoUrl = cleanUrl || null;

    await project.save();

    return res.status(200).json({
      success: true,
      message: cleanUrl
        ? "GitHub repository linked successfully."
        : "GitHub repository link removed successfully.",
      data: {
        projectId: project._id,
        githubRepoUrl: project.githubRepoUrl,
      },
    });
  } catch (error) {
    console.error("Update GitHub Repository Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update GitHub repository.",
    });
  }
};

// ==========================================
// GET SINGLE PROJECT
// ==========================================

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE PROJECT ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    // ==========================================
    // FIND PROJECT
    // ==========================================

    const project = await Project.findOne({
      _id: id,
      isActive: true,
    })
      .populate("owner")
      .populate("mentor")
      .populate("members")
      .populate("createdBy");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get Project By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// ==========================================
// GET PROJECT PROGRESS
// ==========================================

exports.getProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // 1. VALIDATE PROJECT ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    // ==========================================
    // 2. FIND PROJECT
    // ==========================================

    const project = await Project.findOne({
      _id: id,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ==========================================
    // 3. GET PROJECT TASKS
    // ==========================================

    const tasks = await Task.find({
      projectId: id,
    });

    // ==========================================
    // 4. CALCULATE TASK COUNTS
    // ==========================================

    const totalTasks = tasks.length;

    const pending = tasks.filter(
      (task) => task.status === "Pending"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    // ==========================================
    // 5. CALCULATE PROGRESS
    // ==========================================

    const progress =
      totalTasks === 0
        ? 0
        : Math.round((completed / totalTasks) * 100);

    // ==========================================
    // 6. RETURN RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectTitle: project.title,

        totalTasks,
        pending,
        inProgress,
        completed,

        progress: `${progress}%`,
      },
    });
  } catch (error) {
    console.error("Get Project Progress Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};