const mongoose = require("mongoose");

const Task = require("../models/Task");
const Project = require("../models/Project");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

// ============================================================
// HELPER: GET STUDENT PROFILE
// ============================================================

const getStudentProfile = async (userId) => {
  return await Student.findOne({
    userId,
  });
};

// ============================================================
// HELPER: GET TEACHER PROFILE
// ============================================================

const getTeacherProfile = async (userId) => {
  return await Teacher.findOne({
    userId,
  });
};

exports.getMyTasks = async (req, res) => {
  try {
    let filter;
    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }
      const activeProjects = await Project.find({ isActive: true }).select("_id");
      filter = {
        assignedTo: student._id,
        projectId: { $in: activeProjects.map((project) => project._id) },
      };
    } else if (req.user.role === "teacher") {
      const teacher = await getTeacherProfile(req.user._id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }
      const projects = await Project.find({
        mentor: teacher._id,
        isActive: true,
      }).select("_id");
      filter = { projectId: { $in: projects.map((project) => project._id) } };
    } else {
      return res.status(403).json({
        success: false,
        message: "This task list is available to students and teachers.",
      });
    }

    const tasks = await Task.find(filter)
      .populate("projectId", "title status isActive")
      .populate("assignedTo", "name rollNo branch year")
      .populate("assignedBy", "name employeeId department designation")
      .populate("createdByUser", "username role")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load tasks.",
    });
  }
};

exports.getAllTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .populate("projectId", "title status isActive")
      .populate("assignedTo", "name rollNo branch year")
      .populate("assignedBy", "name employeeId department designation")
      .populate("createdByUser", "username role")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load tasks.",
    });
  }
};

// ============================================================
// HELPER: CHECK PROJECT ACCESS
// ============================================================

const hasProjectAccess = ({
  user,
  project,
  student = null,
  teacher = null,
}) => {
  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  if (user.role === "admin") {
    return true;
  }

  // ----------------------------------------------------------
  // TEACHER / MENTOR
  // ----------------------------------------------------------

  if (user.role === "teacher" && teacher) {
    return (
      project.mentor &&
      project.mentor.toString() === teacher._id.toString()
    );
  }

  // ----------------------------------------------------------
  // STUDENT
  // ----------------------------------------------------------

  if (user.role === "student" && student) {
    const isOwner =
      project.owner &&
      project.owner.toString() === student._id.toString();

    const isMember = project.members.some(
      (member) =>
        member.toString() === student._id.toString()
    );

    return isOwner || isMember;
  }

  return false;
};

// ============================================================
// HELPER: CHECK WHETHER STUDENT BELONGS TO PROJECT
// ============================================================

const isStudentInProject = (project, studentId) => {
  if (!studentId) {
    return false;
  }

  // Project owner
  if (
    project.owner &&
    project.owner.toString() === studentId.toString()
  ) {
    return true;
  }

  // Project member
  return project.members.some(
    (member) =>
      member.toString() === studentId.toString()
  );
};

// ============================================================
// CREATE TASK
// ============================================================

exports.createTask = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // Teachers must be the project mentor; admins can manage any active project.
    // ----------------------------------------------------------

    if (!["teacher", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only an authorized teacher or admin can create tasks.",
      });
    }

    const {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      dueDate,
    } = req.body;

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !projectId ||
      !assignedTo ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, project ID, assigned student and due date are required.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE IDS
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROJECT
    // ----------------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ----------------------------------------------------------
    // FIND TEACHER
    // ----------------------------------------------------------

    const teacher = req.user.role === "teacher"
      ? await getTeacherProfile(req.user._id)
      : await Teacher.findById(project.mentor);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: req.user.role === "teacher"
          ? "Teacher profile not found."
          : "The project mentor profile was not found.",
      });
    }

    // ----------------------------------------------------------
    // ONLY PROJECT MENTOR CAN CREATE TASK
    // ----------------------------------------------------------

    if (
      req.user.role === "teacher" &&
      (!project.mentor || project.mentor.toString() !== teacher._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the assigned project mentor can create tasks.",
      });
    }

    // ----------------------------------------------------------
    // FIND ASSIGNED STUDENT
    // ----------------------------------------------------------

    const student = await Student.findById(assignedTo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Assigned student not found.",
      });
    }

    // ----------------------------------------------------------
    // STUDENT MUST BELONG TO PROJECT
    // ----------------------------------------------------------

    if (!isStudentInProject(project, student._id)) {
      return res.status(400).json({
        success: false,
        message:
          "The assigned student is not a member of this project.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE TITLE
    // ----------------------------------------------------------

    const cleanTitle = title.trim();

    if (
      cleanTitle.length < 5 ||
      cleanTitle.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task title must be between 5 and 100 characters.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE DESCRIPTION
    // ----------------------------------------------------------

    const cleanDescription = description.trim();

    if (cleanDescription.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Task description must contain at least 10 characters.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE PRIORITY
    // ----------------------------------------------------------

    const validPriorities = [
      "Low",
      "Medium",
      "High",
    ];

    if (
      priority &&
      !validPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Priority must be Low, Medium or High.",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE DUE DATE
    // ----------------------------------------------------------

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date.",
      });
    }

    // Task cannot be after project end date
    if (parsedDueDate > project.endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Task due date cannot be after the project end date.",
      });
    }

    // Task cannot be before project start date
    if (parsedDueDate < project.startDate) {
      return res.status(400).json({
        success: false,
        message:
          "Task due date cannot be before the project start date.",
      });
    }

    // ----------------------------------------------------------
    // CREATE TASK
    // ----------------------------------------------------------

    const task = await Task.create({
      title: cleanTitle,
      description: cleanDescription,
      projectId: project._id,
      assignedTo: student._id,
      assignedBy: teacher._id,
      createdByUser: req.user._id,
      priority: priority || "Medium",
      status: "Pending",
      dueDate: parsedDueDate,
      completedAt: null,
    });

    // ----------------------------------------------------------
    // POPULATE RESPONSE
    // ----------------------------------------------------------

    const populatedTask = await Task.findById(task._id)
      .populate(
        "projectId",
        "title category status"
      )
      .populate(
        "assignedTo",
        "name rollNo branch year"
      )
      .populate(
        "assignedBy",
        "name employeeId department designation"
      )
      .populate("createdByUser", "username role");

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: populatedTask,
    });
  } catch (error) {
    console.error("Create Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// GET ALL PROJECT TASKS
// ============================================================

exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    // ----------------------------------------------------------
    // VALIDATE PROJECT ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROJECT
    // ----------------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ----------------------------------------------------------
    // GET USER PROFILE
    // ----------------------------------------------------------

    let student = null;
    let teacher = null;

    if (req.user.role === "student") {
      student = await getStudentProfile(req.user._id);
    }

    if (req.user.role === "teacher") {
      teacher = await getTeacherProfile(req.user._id);
    }

    // ----------------------------------------------------------
    // CHECK ACCESS
    // ----------------------------------------------------------

    const allowed = hasProjectAccess({
      user: req.user,
      project,
      student,
      teacher,
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view tasks for this project.",
      });
    }

    // ----------------------------------------------------------
    // GET TASKS
    // ----------------------------------------------------------

    const taskFilter = { projectId: project._id };
    if (req.user.role === "student") {
      taskFilter.assignedTo = student._id;
    }
    const tasks = await Task.find(taskFilter)
      .populate(
        "assignedTo",
        "name rollNo branch year"
      )
      .populate(
        "assignedBy",
        "name employeeId department designation"
      )
      .populate("createdByUser", "username role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Project Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// GET SINGLE TASK
// ============================================================

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // VALIDATE TASK ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND TASK
    // ----------------------------------------------------------

    const task = await Task.findById(id)
      .populate(
        "projectId",
        "title category status owner members mentor isActive"
      )
      .populate(
        "assignedTo",
        "name rollNo branch year"
      )
      .populate(
        "assignedBy",
        "name employeeId department designation"
      )
      .populate("createdByUser", "username role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!task.projectId.isActive) {
      return res.status(404).json({
        success: false,
        message: "Project is not active.",
      });
    }

    // ----------------------------------------------------------
    // GET USER PROFILE
    // ----------------------------------------------------------

    let student = null;
    let teacher = null;

    if (req.user.role === "student") {
      student = await getStudentProfile(req.user._id);
    }

    if (req.user.role === "teacher") {
      teacher = await getTeacherProfile(req.user._id);
    }

    // ----------------------------------------------------------
    // CHECK ACCESS
    // ----------------------------------------------------------

    const allowed = hasProjectAccess({
      user: req.user,
      project: task.projectId,
      student,
      teacher,
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this task.",
      });
    }

    if (
      req.user.role === "student" &&
      task.assignedTo._id?.toString() !== student?._id.toString() &&
      task.assignedTo.toString() !== student?._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view tasks assigned to you.",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// UPDATE TASK
// ============================================================

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // VALIDATE TASK ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND TASK
    // ----------------------------------------------------------

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROJECT
    // ----------------------------------------------------------

    const project = await Project.findOne({
      _id: task.projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or inactive.",
      });
    }

    // ==========================================================
    // STUDENT
    // ==========================================================

    if (req.user.role === "student") {
      const student = await getStudentProfile(req.user._id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }

      // Student must belong to project
      if (!isStudentInProject(project, student._id)) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this project.",
        });
      }

      // Student can update ONLY their own task
      if (
        task.assignedTo.toString() !==
        student._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tasks assigned to you.",
        });
      }

      // Student can ONLY change status
      const allowedFields = ["status"];

      const requestedFields = Object.keys(req.body);

      const hasInvalidField = requestedFields.some(
        (field) => !allowedFields.includes(field)
      );

      if (hasInvalidField) {
        return res.status(403).json({
          success: false,
          message:
            "Students can only update task status.",
        });
      }

      const validStatuses = [
        "Pending",
        "In Progress",
        "Completed",
      ];

      if (
        !validStatuses.includes(req.body.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task status.",
        });
      }

      task.status = req.body.status;

      if (req.body.status === "Completed") {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }

      await task.save();

      const updatedTask = await Task.findById(task._id)
        .populate(
          "assignedTo",
          "name rollNo branch year"
        )
        .populate(
          "assignedBy",
          "name employeeId department designation"
        )
        .populate("createdByUser", "username role");

      return res.status(200).json({
        success: true,
        message: "Task status updated successfully.",
        data: updatedTask,
      });
    }

    // ==========================================================
    // TEACHER
    // ==========================================================

    if (req.user.role === "teacher") {
      const teacher = await getTeacherProfile(req.user._id);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }

      // Only project mentor can update
      if (
        !project.mentor ||
        project.mentor.toString() !==
          teacher._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the project mentor can update this task.",
        });
      }

      const {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedTo,
      } = req.body;

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      if (title !== undefined) {
        if (typeof title !== "string") {
          return res.status(400).json({
            success: false,
            message: "Task title must be text.",
          });
        }
        const cleanTitle = title.trim();

        if (
          cleanTitle.length < 5 ||
          cleanTitle.length > 100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Task title must be between 5 and 100 characters.",
          });
        }

        task.title = cleanTitle;
      }

      // --------------------------------------------------------
      // DESCRIPTION
      // --------------------------------------------------------

      if (description !== undefined) {
        if (typeof description !== "string") {
          return res.status(400).json({
            success: false,
            message: "Task description must be text.",
          });
        }
        const cleanDescription =
          description.trim();

        if (cleanDescription.length < 10) {
          return res.status(400).json({
            success: false,
            message:
              "Task description must contain at least 10 characters.",
          });
        }

        task.description = cleanDescription;
      }

      // --------------------------------------------------------
      // PRIORITY
      // --------------------------------------------------------

      if (priority !== undefined) {
        const validPriorities = [
          "Low",
          "Medium",
          "High",
        ];

        if (
          !validPriorities.includes(priority)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid priority.",
          });
        }

        task.priority = priority;
      }

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      if (status !== undefined) {
        const validStatuses = [
          "Pending",
          "In Progress",
          "Completed",
        ];

        if (
          !validStatuses.includes(status)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid task status.",
          });
        }

        task.status = status;

        if (status === "Completed") {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }

      // --------------------------------------------------------
      // DUE DATE
      // --------------------------------------------------------

      if (dueDate !== undefined) {
        const parsedDueDate = new Date(dueDate);

        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid due date.",
          });
        }

        if (parsedDueDate < project.startDate) {
          return res.status(400).json({
            success: false,
            message:
              "Due date cannot be before project start date.",
          });
        }

        if (parsedDueDate > project.endDate) {
          return res.status(400).json({
            success: false,
            message:
              "Due date cannot be after project end date.",
          });
        }

        task.dueDate = parsedDueDate;
      }

      // --------------------------------------------------------
      // REASSIGN TASK
      // --------------------------------------------------------

      if (assignedTo !== undefined) {
        if (
          !mongoose.Types.ObjectId.isValid(
            assignedTo
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid student ID.",
          });
        }

        const student = await Student.findById(
          assignedTo
        );

        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student not found.",
          });
        }

        if (
          !isStudentInProject(
            project,
            student._id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Student is not a member of this project.",
          });
        }

        task.assignedTo = student._id;
      }

      await task.save();

      const updatedTask = await Task.findById(task._id)
        .populate(
          "projectId",
          "title category status"
        )
        .populate(
          "assignedTo",
          "name rollNo branch year"
        )
        .populate(
          "assignedBy",
          "name employeeId department designation"
        )
        .populate("createdByUser", "username role");

      return res.status(200).json({
        success: true,
        message: "Task updated successfully.",
        data: updatedTask,
      });
    }

    // ==========================================================
    // ADMIN
    // ==========================================================

    if (req.user.role === "admin") {
      const {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedTo,
      } = req.body;

      if (title !== undefined) {
        if (typeof title !== "string") {
          return res.status(400).json({
            success: false,
            message: "Task title must be text.",
          });
        }
        const cleanTitle = title.trim();

        if (
          cleanTitle.length < 5 ||
          cleanTitle.length > 100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Task title must be between 5 and 100 characters.",
          });
        }

        task.title = cleanTitle;
      }

      if (description !== undefined) {
        if (typeof description !== "string") {
          return res.status(400).json({
            success: false,
            message: "Task description must be text.",
          });
        }
        const cleanDescription =
          description.trim();

        if (cleanDescription.length < 10) {
          return res.status(400).json({
            success: false,
            message:
              "Task description must contain at least 10 characters.",
          });
        }

        task.description = cleanDescription;
      }

      if (priority !== undefined) {
        if (
          !["Low", "Medium", "High"].includes(priority)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid priority.",
          });
        }

        task.priority = priority;
      }

      if (status !== undefined) {
        if (
          ![
            "Pending",
            "In Progress",
            "Completed",
          ].includes(status)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid status.",
          });
        }

        task.status = status;

        if (status === "Completed") {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }

      if (dueDate !== undefined) {
        const parsedDueDate = new Date(dueDate);

        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid due date.",
          });
        }

        if (
          parsedDueDate < project.startDate ||
          parsedDueDate > project.endDate
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Due date must be within the project duration.",
          });
        }

        task.dueDate = parsedDueDate;
      }

      if (assignedTo !== undefined) {
        if (
          !mongoose.Types.ObjectId.isValid(
            assignedTo
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid student ID.",
          });
        }

        const student = await Student.findById(
          assignedTo
        );

        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student not found.",
          });
        }

        if (
          !isStudentInProject(
            project,
            student._id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Student is not a member of this project.",
          });
        }

        task.assignedTo = student._id;
      }

      await task.save();

      return res.status(200).json({
        success: true,
        message: "Task updated successfully.",
        data: task,
      });
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this task.",
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// DELETE TASK
// ============================================================

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // ----------------------------------------------------------
    // VALIDATE ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND TASK
    // ----------------------------------------------------------

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROJECT
    // ----------------------------------------------------------

    const project = await Project.findOne({
      _id: task.projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or inactive.",
      });
    }

    // ----------------------------------------------------------
    // ADMIN
    // ----------------------------------------------------------

    if (req.user.role === "admin") {
      await Task.findByIdAndDelete(task._id);

      return res.status(200).json({
        success: true,
        message: "Task deleted successfully.",
      });
    }

    // ----------------------------------------------------------
    // TEACHER / MENTOR
    // ----------------------------------------------------------

    if (req.user.role === "teacher") {
      const teacher = await getTeacherProfile(req.user._id);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }

      if (
        !project.mentor ||
        project.mentor.toString() !==
          teacher._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the project mentor can delete this task.",
        });
      }

      await Task.findByIdAndDelete(task._id);

      return res.status(200).json({
        success: true,
        message: "Task deleted successfully.",
      });
    }

    // ----------------------------------------------------------
    // STUDENT
    // ----------------------------------------------------------

    return res.status(403).json({
      success: false,
      message: "Students cannot delete tasks.",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// GET PROJECT PROGRESS
// ============================================================

exports.getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;

    // ----------------------------------------------------------
    // VALIDATE ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROJECT
    // ----------------------------------------------------------

    const project = await Project.findOne({
      _id: projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // ----------------------------------------------------------
    // GET USER PROFILE
    // ----------------------------------------------------------

    let student = null;
    let teacher = null;

    if (req.user.role === "student") {
      student = await getStudentProfile(req.user._id);
    }

    if (req.user.role === "teacher") {
      teacher = await getTeacherProfile(req.user._id);
    }

    // ----------------------------------------------------------
    // CHECK ACCESS
    // ----------------------------------------------------------

    const allowed = hasProjectAccess({
      user: req.user,
      project,
      student,
      teacher,
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view project progress.",
      });
    }

    // ----------------------------------------------------------
    // GET TASK COUNTS
    // ----------------------------------------------------------

    const totalTasks = await Task.countDocuments({
      projectId,
    });

    const pending = await Task.countDocuments({
      projectId,
      status: "Pending",
    });

    const inProgress = await Task.countDocuments({
      projectId,
      status: "In Progress",
    });

    const completed = await Task.countDocuments({
      projectId,
      status: "Completed",
    });

    // ----------------------------------------------------------
    // CALCULATE PROGRESS
    // ----------------------------------------------------------

    const progress =
      totalTasks === 0
        ? 0
        : Math.round(
            (completed / totalTasks) * 100
          );

    return res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectTitle: project.title,
        totalTasks,
        pending,
        inProgress,
        completed,
        progress,
      },
    });
  } catch (error) {
    console.error(
      "Get Project Progress Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};