const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // ==========================================
    // TASK INFORMATION
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    // ==========================================
    // PROJECT
    // ==========================================

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // ==========================================
    // STUDENT ASSIGNMENT
    // ==========================================

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Teacher who assigned the task
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================
    // TASK PRIORITY
    // ==========================================

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // ==========================================
    // TASK STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    // ==========================================
    // DEADLINE
    // ==========================================

    dueDate: {
      type: Date,
      required: true,
    },

    // ==========================================
    // COMPLETION TRACKING
    // ==========================================

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);