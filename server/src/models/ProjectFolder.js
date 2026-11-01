
const mongoose = require("mongoose");

const projectFolderSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    // null means root folder
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFolder",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },

    createdByModel: {
      type: String,
      required: true,
      enum: ["Student", "Teacher", "Admin"],
    },
  },
  {
    timestamps: true,
  }
);

projectFolderSchema.index(
  {
    projectId: 1,
    parentFolder: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("ProjectFolder", projectFolderSchema);
