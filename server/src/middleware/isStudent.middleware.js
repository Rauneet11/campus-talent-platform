const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Student only.",
    });
  }

  next();
};

module.exports = isStudent;