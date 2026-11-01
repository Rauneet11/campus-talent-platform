const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Set secure HTTP headers
app.use(helmet());

// HTTP request logging (skip in test environments)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// CORS — restrict to the configured frontend origin
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin "${origin}" not allowed.`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ============================================================
// REQUEST PARSING
// ============================================================

// Limit JSON body size to prevent large-payload attacks
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ============================================================
// RATE LIMITING
// ============================================================

// Strict limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // max 30 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: () => process.env.NODE_ENV === "test",
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: () => process.env.NODE_ENV === "test",
});

// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes          = require("./routes/auth.routes");
const adminRoutes         = require("./routes/admin.routes");
const studentRoutes       = require("./routes/student.routes");
const teacherRoutes       = require("./routes/teacher.routes");
const projectRoutes       = require("./routes/project.routes");
const invitationRoutes    = require("./routes/invitation.routes");
const taskRoutes          = require("./routes/task.routes");
const projectFolderRoutes = require("./routes/projectFolder.routes");
const projectFileRoutes   = require("./routes/projectFile.routes");

// ============================================================
// REGISTER ROUTES
// ============================================================

// Apply general rate limit to all /api routes
app.use("/api", apiLimiter);

// Auth — stricter rate limit
app.use("/api/auth",             authLimiter, authRoutes);

// Role-specific management
app.use("/api/admin",            adminRoutes);
app.use("/api/students",         studentRoutes);
app.use("/api/teachers",         teacherRoutes);

// Core features
app.use("/api/projects",         projectRoutes);
app.use("/api/invitations",      invitationRoutes);
app.use("/api/tasks",            taskRoutes);
app.use("/api/project-folders",  projectFolderRoutes);
app.use("/api/project-files",    projectFileRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Talent Platform API is running.",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Talent Platform API",
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// CENTRALIZED ERROR HANDLER
// ============================================================

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  // Mongoose validation error
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(". "),
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
  }

  // CORS error
  if (error.message && error.message.startsWith("CORS:")) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  // Log unexpected errors on the server (safe — not sent to client)
  console.error("[Error]", error);

  // Never expose stack traces or internal messages to clients in production
  return res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : error.message || "Internal Server Error",
  });
});

module.exports = app;
