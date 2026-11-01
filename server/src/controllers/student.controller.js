const Student = require("../models/Student");

// ==========================================
// GET STUDENT PROFILE
// ==========================================

exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      userId: req.user._id,
    }).populate("userId", "username role status");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};