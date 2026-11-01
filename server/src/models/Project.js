const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Basic project information
    title: {
      type: String,
      required: [true, "Project title is required."],
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Project description is required."],
      trim: true,
      minlength: 20,
    },

    category: {
      type: String,
      required: [true, "Project category is required."],
      trim: true,
    },

    requiredSkills: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (skills) =>
          Array.isArray(skills) &&
          skills.some((skill) => skill.length > 0),
        message: "At least one required skill must be provided.",
      },
    },

    // Team configuration
    teamSize: {
      type: Number,
      required: true,
      min: 2,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: "Team size must be a whole number.",
      },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // Teacher assigned as mentor
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    // Admin who created the project, if applicable
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    projectType: {
      type: String,
      enum: ["Student", "Admin"],
      default: "Student",
      required: true,
    },

    // Project timeline
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value > this.startDate;
        },
        message: "End date must be after the start date.",
      },
    },

    // Project lifecycle
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed", "On Hold"],
      default: "Open",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // GitHub repository integration
    githubRepoUrl: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          return (
            !value ||
            /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(value)
          );
        },
        message: "Please provide a valid GitHub repository URL.",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Useful for project listing and filtering
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ mentor: 1 });
projectSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model("Project", projectSchema);