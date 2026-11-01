
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password are required",
      });
    }
    if (role !== undefined && !["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid account type to sign in.",
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact Admin.",
      });
    }

    // Compare password
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as a ${user.role}. Select ${user.role} sign in and try again.`,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// INITIAL ADMIN SETUP
// ==========================================

exports.setupAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // Check whether an admin already exists
    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin account already exists.",
      });
    }

    // Check username
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Validate length
    const normalizedUsername = username.toLowerCase().trim();
    if (normalizedUsername.length < 4 || normalizedUsername.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 4 and 20 characters.",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
      role: "admin",
      status: "active",
      isFirstLogin: true,
    });

    return res.status(201).json({
      success: true,
      message: "Initial admin account created successfully.",
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error("[Auth] Setup admin error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
