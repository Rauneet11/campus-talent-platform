
const cloudinary = require("../config/cloudinary");
const ProjectFile = require("../models/ProjectFile");
const Student = require("../models/Student");

// ==========================================
// UPLOAD PROJECT FILE
// Requires authMiddleware, projectMember,
// and upload.single("file")
// ==========================================
exports.uploadProjectFile = async (req, res) => {
  let uploadedPublicId;
  let uploadedResourceType;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
      });
    }

    const project = req.project;

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Upload file to Cloudinary.
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `campus/projects/${project._id}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (!result) {
            return reject(new Error("Cloudinary returned no result."));
          }

          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    uploadedPublicId = uploadResult.public_id;
    uploadedResourceType = uploadResult.resource_type;

    // Student uploads are linked to their student profile.
    // Teacher/admin uploads have no Student uploader reference
    // in the current ProjectFile schema.
    const student = await Student.findOne({
      userId: req.user._id,
    }).select("_id");

    const projectFile = await ProjectFile.create({
      projectId: project._id,
      uploadedBy: student ? student._id : null,
      fileName: req.file.originalname,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    const populatedFile = await ProjectFile.findById(projectFile._id)
      .populate("uploadedBy", "name rollNo branch year");

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      data: populatedFile,
    });
  } catch (error) {
    console.error("Upload Project File Error:", error);

    // Clean up the Cloudinary upload if database saving failed.
    if (uploadedPublicId && uploadedResourceType) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: uploadedResourceType,
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "File upload failed.",
    });
  }
};

// ==========================================
// GET PROJECT FILES
// Requires authMiddleware + projectMember
// ==========================================
exports.getProjectFiles = async (req, res) => {
  try {
    if (!req.project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const files = await ProjectFile.find({
      projectId: req.project._id,
    })
      .populate("uploadedBy", "name rollNo branch year")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error("Get Project Files Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project files.",
    });
  }
};

// ==========================================
// GET SINGLE FILE
// Requires authMiddleware + projectMember
// ==========================================
exports.getProjectFileById = async (req, res) => {
  try {
    if (!req.project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const file = await ProjectFile.findOne({
      _id: req.params.id,
      projectId: req.project._id,
    }).populate("uploadedBy", "name rollNo branch year");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found in this project.",
      });
    }

    return res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error("Get Project File Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch the file.",
    });
  }
};

// ==========================================
// DELETE PROJECT FILE
// Requires authMiddleware + projectMember
// Only uploader or admin can delete
// ==========================================
exports.deleteProjectFile = async (req, res) => {
  try {
    if (!req.project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const file = await ProjectFile.findOne({
      _id: req.params.id,
      projectId: req.project._id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found in this project.",
      });
    }

    const isAdmin = req.user.role === "admin";
    let isUploader = false;

    if (!isAdmin && file.uploadedBy) {
      const student = await Student.findOne({
        userId: req.user._id,
      }).select("_id");

      isUploader =
        Boolean(student) &&
        file.uploadedBy.toString() === student._id.toString();
    }

    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        message: "Only the uploader or an admin can delete this file.",
      });
    }

    // Infer the Cloudinary resource type for currently allowed files.
    const resourceType = file.fileType.startsWith("image/")
      ? "image"
      : "raw";

    const result = await cloudinary.uploader.destroy(file.publicId, {
      resource_type: resourceType,
    });

    // Do not remove the database record if Cloudinary deletion failed.
    if (result.result !== "ok" && result.result !== "not found") {
      console.error("Cloudinary deletion result:", result);

      return res.status(502).json({
        success: false,
        message: "Unable to delete the file from cloud storage.",
      });
    }

    await ProjectFile.findByIdAndDelete(file._id);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Project File Error:", error);

    return res.status(500).json({
      success: false,
      message: "File deletion failed.",
    });
  }
};
