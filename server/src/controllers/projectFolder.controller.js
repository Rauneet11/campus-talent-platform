
const mongoose = require("mongoose");
const ProjectFolder = require("../models/ProjectFolder");
const ProjectFile = require("../models/ProjectFile");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");

const getCreatorProfile = async (req) => {
  switch (req.user.role) {
    case "student":
      return {
        profile:
          req.student ||
          (await Student.findOne({ userId: req.user._id })),
        model: "Student",
      };

    case "teacher":
      return {
        profile:
          req.teacher ||
          (await Teacher.findOne({ userId: req.user._id })),
        model: "Teacher",
      };

    case "admin":
      return {
        profile: await Admin.findOne({ userId: req.user._id }),
        model: "Admin",
      };

    default:
      return null;
  }
};

const validateFolderName = (name) => {
  if (typeof name !== "string" || !name.trim()) {
    return {
      valid: false,
      message: "Folder name is required.",
    };
  }

  const cleanName = name.trim();

  if (cleanName.length > 100) {
    return {
      valid: false,
      message: "Folder name cannot exceed 100 characters.",
    };
  }

  return { valid: true, cleanName };
};

const populateFolder = (query) =>
  query
    .populate("createdBy", "name rollNo branch year email")
    .populate("parentFolder", "name");

const handleDuplicateError = (error, res, fallbackMessage) => {
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "A folder with this name already exists here.",
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
};

// CREATE FOLDER
exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const project = req.project;

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const validation = validateFolderName(name);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { cleanName } = validation;

    const creator = await getCreatorProfile(req);

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create folders.",
      });
    }

    if (!creator.profile) {
      return res.status(404).json({
        success: false,
        message: "Creator profile not found.",
      });
    }

    let parentFolderId = null;

    if (parentFolder !== undefined && parentFolder !== null && parentFolder !== "") {
      if (!mongoose.isValidObjectId(parentFolder)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent folder ID.",
        });
      }

      const parent = await ProjectFolder.findOne({
        _id: parentFolder,
        projectId: project._id,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent folder not found in this project.",
        });
      }

      parentFolderId = parent._id;
    }

    const existingFolder = await ProjectFolder.findOne({
      projectId: project._id,
      parentFolder: parentFolderId,
      name: cleanName,
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: "A folder with this name already exists here.",
      });
    }

    const folder = await ProjectFolder.create({
      projectId: project._id,
      name: cleanName,
      parentFolder: parentFolderId,
      createdBy: creator.profile._id,
      createdByModel: creator.model,
    });

    const populatedFolder = await populateFolder(
      ProjectFolder.findById(folder._id)
    );

    return res.status(201).json({
      success: true,
      message: "Folder created successfully.",
      data: populatedFolder,
    });
  } catch (error) {
    return handleDuplicateError(error, res, "Create Folder Error:");
  }
};

// GET ALL PROJECT FOLDERS
exports.getProjectFolders = async (req, res) => {
  try {
    const project = req.project;

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const folders = await populateFolder(
      ProjectFolder.find({ projectId: project._id }).sort({ name: 1 })
    );

    return res.status(200).json({
      success: true,
      count: folders.length,
      data: folders,
    });
  } catch (error) {
    console.error("Get Project Folders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project folders.",
    });
  }
};

// GET SINGLE FOLDER
exports.getFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder ID.",
      });
    }

    const folder = await populateFolder(
      ProjectFolder.findOne({
        _id: id,
        projectId: req.project._id,
      })
    );

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Get Folder Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch folder.",
    });
  }
};

// RENAME FOLDER
exports.renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder ID.",
      });
    }

    const validation = validateFolderName(name);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { cleanName } = validation;

    const folder = await ProjectFolder.findOne({
      _id: id,
      projectId: req.project._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found.",
      });
    }

    const existingFolder = await ProjectFolder.findOne({
      projectId: req.project._id,
      parentFolder: folder.parentFolder,
      name: cleanName,
      _id: { $ne: folder._id },
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: "A folder with this name already exists here.",
      });
    }

    folder.name = cleanName;
    await folder.save();

    const populatedFolder = await populateFolder(
      ProjectFolder.findById(folder._id)
    );

    return res.status(200).json({
      success: true,
      message: "Folder renamed successfully.",
      data: populatedFolder,
    });
  } catch (error) {
    return handleDuplicateError(error, res, "Rename Folder Error:");
  }
};

// DELETE FOLDER
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder ID.",
      });
    }

    const folder = await ProjectFolder.findOne({
      _id: id,
      projectId: req.project._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found.",
      });
    }

    const childFolders = await ProjectFolder.countDocuments({
      projectId: req.project._id,
      parentFolder: folder._id,
    });

    if (childFolders > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a folder containing subfolders.",
      });
    }

    const files = await ProjectFile.countDocuments({
      projectId: req.project._id,
      folderId: folder._id,
    });

    if (files > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a folder containing files.",
      });
    }

    await ProjectFolder.findByIdAndDelete(folder._id);

    return res.status(200).json({
      success: true,
      message: "Folder deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Folder Error:", error);

    return res.status(500).json({
      success: false,
      message: "Folder deletion failed.",
    });
  }
};
