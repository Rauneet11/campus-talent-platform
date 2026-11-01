const mongoose = require("mongoose");
const ProjectFile = require("../models/ProjectFile");
const projectMember = require("./projectMember.middleware");

const projectFileMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    const file = await ProjectFile.findById(id).select("projectId");
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    req.params.projectId = file.projectId.toString();
    return projectMember(req, res, next);
  } catch (error) {
    console.error("Project File Access Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify project file access.",
    });
  }
};

module.exports = projectFileMember;
