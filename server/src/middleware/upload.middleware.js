const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Text
    "text/plain",

    // Images
    "image/jpeg",
    "image/png",
    "image/webp",

    // ZIP
    "application/zip",
    "application/x-zip-compressed",

    // Source code
    "text/javascript",
    "application/javascript",
    "text/css",
    "text/html",

    // JSON
    "application/json",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

module.exports = upload;