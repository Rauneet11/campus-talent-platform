
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Project = require("../models/Project");
const Admin = require("../models/Admin");
const Invitation = require("../models/Invitation");
const Task = require("../models/Task");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// =====================================================
// HELPER: GENERATE UNIQUE USERNAME
// =====================================================
// Example:
// Rahul Sharma -> rahulsharma1
// Rahul Sharma -> rahulsharma2
//
// User.username has maxLength 20, so the name is
// automatically shortened if necessary.

const generateUsername = async (name) => {
  let baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // Minimum safe length
  if (baseName.length < 4) {
    baseName = `user${baseName}`;
  }

  let sequence = 1;
  let username;

  do {
    const suffix = String(sequence);

    // Keep username within User schema maxLength = 20
    const maxBaseLength = 20 - suffix.length;

    const shortenedBase = baseName.substring(0, maxBaseLength);

    username = `${shortenedBase}${suffix}`;

    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return username;
    }

    sequence++;
  } while (true);
};

const createAccountCredentials = async (name, requestedUsername, requestedPassword) => {
  if (requestedUsername !== undefined && typeof requestedUsername !== "string") {
    return { error: "Username must be text." };
  }
  const username = requestedUsername?.trim()
    ? requestedUsername.trim().toLowerCase()
    : await generateUsername(name);
  if (username.length < 4 || username.length > 20) {
    return { error: "Username must be between 4 and 20 characters." };
  }

  if (await User.findOne({ username })) {
    return { error: "Username already exists. Choose another username." };
  }

  if (requestedPassword !== undefined && requestedPassword !== "" &&
      (typeof requestedPassword !== "string" || requestedPassword.length < 8)) {
    return { error: "Password must be at least 8 characters long." };
  }

  const password = requestedPassword || `${username}@password`;
  return { username, password };
};

const updateAccountCredentials = async (user, username, password) => {
  if (username !== undefined) {
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    if (normalizedUsername.length < 4 || normalizedUsername.length > 20) {
      return "Username must be between 4 and 20 characters.";
    }
    if (normalizedUsername !== user.username) {
      const existingUser = await User.findOne({ username: normalizedUsername });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return "Username already exists. Choose another username.";
      }
      user.username = normalizedUsername;
    }
  }

  if (password !== undefined && password !== "") {
    if (typeof password !== "string" || password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    user.password = await bcrypt.hash(password, 10);
    user.isFirstLogin = false;
  }

  await user.save();
  return null;
};

// =====================================================
// CREATE STUDENT
// =====================================================

exports.createStudent = async (req, res) => {
  let createdUserId = null;

  try {
    const {
      name,
      rollNo,
      branch,
      year,
      skills,
      cgpa,
      username: requestedUsername,
      password: requestedPassword,
    } = req.body;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanRollNo = typeof rollNo === "string" ? rollNo.trim() : "";

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------

    if (
      !cleanName ||
      !cleanRollNo ||
      !branch ||
      year === undefined ||
      cgpa === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    // ------------------------------------------
    // Validate skills
    // ------------------------------------------

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Skills must be an array.",
      });
    }

    // ------------------------------------------
    // Check duplicate roll number
    // ------------------------------------------

    const existingStudent = await Student.findOne({
      rollNo: cleanRollNo,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Roll Number already exists.",
      });
    }

    const credentials = await createAccountCredentials(
      cleanName,
      requestedUsername,
      requestedPassword,
    );
    if (credentials.error) {
      return res.status(400).json({ success: false, message: credentials.error });
    }
    const { username, password: initialPassword } = credentials;

    // ------------------------------------------
    // Hash password
    // ------------------------------------------

    const hashedPassword = await bcrypt.hash(
      initialPassword,
      10
    );

    // ------------------------------------------
    // Create User
    // ------------------------------------------

    const user = await User.create({
      username,
      password: hashedPassword,
      role: "student",
      status: "active",
      isFirstLogin: !requestedPassword,
    });

    createdUserId = user._id;

    // ------------------------------------------
    // Create Student Profile
    // ------------------------------------------

    const student = await Student.create({
      userId: user._id,
      name: cleanName,
      rollNo: cleanRollNo,
      branch,
      year,
      skills: skills || [],
      cgpa,
    });

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Student created successfully.",

      credentials: {
        username,
        password: initialPassword,
      },

      data: student,
    });

  } catch (error) {

    // ------------------------------------------
    // Rollback User if Student creation fails
    // ------------------------------------------

    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    // Duplicate key error
    if (error.code === 11000) {
      const duplicateError = error.errorResponse || error;
      const duplicateIndex = error.message?.match(
        /index:\s+([^\s]+)\s+dup key/i
      )?.[1];
      const duplicateKeyField = error.message?.match(
        /dup key:\s*\{\s*["']?([^:"'}]+)["']?\s*:/
      )?.[1]?.trim();
      const duplicateField =
        Object.keys(
          duplicateError.keyPattern ||
            duplicateError.keyValue ||
            error.keyPattern ||
            error.keyValue ||
            {}
        )[0] ||
        duplicateKeyField ||
        (duplicateIndex?.startsWith("rollNo_") ? "rollNo" : null) ||
        (duplicateIndex?.startsWith("username_") ? "username" : null);

      console.error("Student creation duplicate key", {
        field: duplicateField || null,
        index: duplicateIndex || null,
      });

      return res.status(400).json({
        success: false,
        message:
          duplicateField === "rollNo"
            ? "A student with this roll number already exists."
            : duplicateField === "username"
              ? "Username already exists. Choose another username."
              : duplicateField
                ? `A student record with a duplicate "${duplicateField}" value already exists.`
                : duplicateIndex
                  ? `The database rejected a duplicate value for the "${duplicateIndex}" index.`
                  : "The database rejected a duplicate student record.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// CREATE TEACHER
// =====================================================

exports.createTeacher = async (req, res) => {
  let createdUserId = null;

  try {
    const {
      name,
      employeeId,
      department,
      designation,
      skills,
      experience,
      email,
      username: requestedUsername,
      password: requestedPassword,
    } = req.body;

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------

    if (
      !name ||
      !employeeId ||
      !department ||
      !designation ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      experience === undefined ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory.",
      });
    }

    // ------------------------------------------
    // Check duplicate employee ID
    // ------------------------------------------

    const existingTeacher = await Teacher.findOne({
      employeeId,
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists.",
      });
    }

    // ------------------------------------------
    // Check duplicate email
    // ------------------------------------------

    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await Teacher.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const credentials = await createAccountCredentials(
      name,
      requestedUsername,
      requestedPassword,
    );
    if (credentials.error) {
      return res.status(400).json({ success: false, message: credentials.error });
    }
    const { username, password: initialPassword } = credentials;

    // ------------------------------------------
    // Hash password
    // ------------------------------------------

    const hashedPassword = await bcrypt.hash(
      initialPassword,
      10
    );

    // ------------------------------------------
    // Create User
    // ------------------------------------------

    const user = await User.create({
      username,
      password: hashedPassword,
      role: "teacher",
      status: "active",
      isFirstLogin: !requestedPassword,
    });

    createdUserId = user._id;

    // ------------------------------------------
    // Create Teacher Profile
    // ------------------------------------------

    const teacher = await Teacher.create({
      userId: user._id,
      name,
      employeeId,
      department,
      designation,
      skills,
      experience,
      email: normalizedEmail,
    });

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully.",

      credentials: {
        username,
        password: initialPassword,
      },

      data: teacher,
    });

  } catch (error) {

    // ------------------------------------------
    // Rollback User if Teacher creation fails
    // ------------------------------------------

    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    // Duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(400).json({
        success: false,
        message: duplicateField === "username"
          ? "Username already exists. Choose another username."
          : duplicateField === "email"
            ? "Email already exists."
            : duplicateField === "employeeId"
              ? "Employee ID already exists."
              : "Duplicate data found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// CREATE PROJECT BY ADMIN
// =====================================================

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

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      !Array.isArray(requiredSkills) ||
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

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanCategory = category.trim();
    const cleanSkills = requiredSkills
      .filter((skill) => typeof skill === "string")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const parsedTeamSize = Number(teamSize);
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (cleanTitle.length < 5 || cleanTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Project title must be between 5 and 100 characters.",
      });
    }

    if (cleanDescription.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Project description must contain at least 20 characters.",
      });
    }

    if (!cleanCategory) {
      return res.status(400).json({
        success: false,
        message: "Project category is required.",
      });
    }

    if (cleanSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid required skill is required.",
      });
    }

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

    if (!mongoose.Types.ObjectId.isValid(mentor)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid teacher as the project mentor.",
      });
    }

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid project start and end dates.",
      });
    }

    // ------------------------------------------
    // Validate dates
    // ------------------------------------------

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End Date must be after Start Date.",
      });
    }

    // ------------------------------------------
    // Check duplicate project title
    // ------------------------------------------

    const existingProject = await Project.findOne({
      title: cleanTitle,
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: "Project already exists.",
      });
    }

    // ------------------------------------------
    // Check mentor
    // ------------------------------------------

    const teacher = await Teacher.findById(mentor);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found.",
      });
    }

    // ------------------------------------------
    // Find Admin profile
    // ------------------------------------------

    const admin = await Admin.findOne({
      userId: req.user._id,
    });

    // ------------------------------------------
    // Create Admin project
    // ------------------------------------------

    const project = await Project.create({
      title: cleanTitle,
      description: cleanDescription,
      category: cleanCategory,
      requiredSkills: cleanSkills,
      teamSize: parsedTeamSize,
      mentor: teacher._id,

      // Admin-created project has no student owner
      owner: null,

      // Admin profile
      createdBy: admin?._id || null,

      // Identify project creator type
      projectType: "Admin",

      // Students become members after accepting
      // collaboration invitations
      members: [],

      startDate: parsedStartDate,
      endDate: parsedEndDate,

      status: "Open",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Admin project created successfully.",
      data: project,
    });

  } catch (error) {
    console.error("Admin Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

exports.getDashboard = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const projectCount = await Project.countDocuments({ isActive: true });
    const taskCount = await Task.countDocuments();
    const invitationCount = await Invitation.countDocuments();

    return res.status(200).json({
      success: true,
      students: studentCount,
      teachers: teacherCount,
      projects: projectCount,
      tasks: taskCount,
      invitations: invitationCount,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// GET ALL STUDENTS
// =====================================================

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "-password");

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No students found.",
        count: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// GET ALL TEACHERS
// =====================================================

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("userId", "-password");

    if (teachers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No teachers found.",
        count: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// GET ALL PROJECTS
// =====================================================

exports.getAllProjects = async (req, res) => {
  try {
    const projectFilter =
      req.query.includeArchived === "true" ? {} : { isActive: true };
    const projects = await Project.find(projectFilter)
      .populate("owner")
      .populate("mentor")
      .populate("members")
      .populate("createdBy");

    if (projects.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No projects found.",
        count: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// UPDATE STUDENT
// =====================================================

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      username,
      password,
      name,
      branch,
      year,
      skills,
      cgpa,
    } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const user = await User.findById(student.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const credentialError = await updateAccountCredentials(user, username, password);
    if (credentialError) {
      return res.status(400).json({ success: false, message: credentialError });
    }

    // ------------------------------------------
    // Update Student
    // ------------------------------------------

    if (name) student.name = name;
    if (branch) student.branch = branch;
    if (year) student.year = year;
    if (skills) student.skills = skills;
    if (cgpa !== undefined) student.cgpa = cgpa;

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: student,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Username already exists. Choose another username.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// UPDATE TEACHER
// =====================================================

exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      username,
      password,
      name,
      employeeId,
      department,
      designation,
      skills,
      experience,
      email,
    } = req.body;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    const user = await User.findById(teacher.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // ------------------------------------------
    // Update Employee ID
    // ------------------------------------------

    if (
      employeeId &&
      employeeId !== teacher.employeeId
    ) {
      const existingTeacher = await Teacher.findOne({
        employeeId,
      });

      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists.",
        });
      }

      teacher.employeeId = employeeId;
    }

    // ------------------------------------------
    // Update Email
    // ------------------------------------------

    if (email && email !== teacher.email) {
      const normalizedEmail = email.toLowerCase().trim();

      const existingEmail = await Teacher.findOne({
        email: normalizedEmail,
      });

      if (
        existingEmail &&
        existingEmail._id.toString() !==
          teacher._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email already exists.",
        });
      }

      teacher.email = normalizedEmail;
    }

    const credentialError = await updateAccountCredentials(user, username, password);
    if (credentialError) {
      return res.status(400).json({ success: false, message: credentialError });
    }

    // ------------------------------------------
    // Update Teacher
    // ------------------------------------------

    if (name) teacher.name = name;
    if (department) teacher.department = department;
    if (designation) teacher.designation = designation;
    if (skills) teacher.skills = skills;
    if (experience !== undefined) {
      teacher.experience = experience;
    }

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully.",
      data: teacher,
    });

  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(400).json({
        success: false,
        message: duplicateField === "email"
          ? "Email already exists."
          : duplicateField === "employeeId"
            ? "Employee ID already exists."
            : "Username already exists. Choose another username.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// DELETE STUDENT
// =====================================================

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================================================
// DELETE TEACHER
// =====================================================

exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    // Don't delete teacher if assigned as mentor
    const project = await Project.findOne({
      mentor: id,
    });

    if (project) {
      return res.status(400).json({
        success: false,
        message:
          `Teacher is assigned to project "${project.title}".`,
      });
    }

    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
