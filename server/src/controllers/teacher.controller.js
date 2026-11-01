const Teacher = require("../models/Teacher");

exports.getAllTeachers = async (_req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("name department designation skills")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load teachers.",
    });
  }
};

// ==========================================
// GET TEACHER PROFILE
// ==========================================

exports.getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      userId: req.user._id,
    }).populate("userId", "username role status");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};