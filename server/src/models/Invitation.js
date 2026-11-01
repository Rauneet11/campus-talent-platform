const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    // Project for which collaboration is requested
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // User who sent the invitation
    // Can be Admin or Student
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Student who receives the invitation
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },

    message: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    responseDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending invitations for the same
// project and student.
invitationSchema.index(
  {
    projectId: 1,
    receiver: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "Pending",
    },
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);