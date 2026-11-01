// server/src/models/ProjectFile.js

const mongoose = require("mongoose");

const projectFileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "uploadedByModel",
    },

    uploadedByModel: {
      type: String,
      required: true,
      enum: ["Student", "Teacher", "Admin"],
    },

    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFolder",
      default: null,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Cloudinary public ID
    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      required: true,
      trim: true,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

projectFileSchema.index({ projectId: 1, createdAt: -1 });
projectFileSchema.index({ folderId: 1 });

module.exports = mongoose.model("ProjectFile", projectFileSchema);